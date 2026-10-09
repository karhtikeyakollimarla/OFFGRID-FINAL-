import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database import Base
from app.models import Complaint, EmailLog, StatusHistory
from app.main import app
from app.email_service import (
    send_citizen_lodged_email,
    send_admin_new_complaint_notification,
    send_complaint_resolved_email,
    send_complaint_email,
    is_valid_email,
    sanitize_error_message
)
from scripts.test_resend import run_diagnostic

@pytest.fixture(autouse=True)
def clean_test_env():
    with patch("app.email_service.DEMO_EMAIL_OVERRIDE", None):
        yield

# Setup in-memory SQLite database for isolated unit tests
@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

@pytest.fixture
def sample_complaint(db_session):
    complaint = Complaint(
        id="CIV-TEST-001",
        raw_text="Severe water leakage on main road outside hospital.",
        citizen_name="Anita Roy",
        citizen_email="anita.roy@testdomain.com",
        location_text="City Hospital Gate",
        category="Water Supply",
        issue_type="Pipeline Leakage",
        department="Water Supply Board",
        urgency="High",
        urgency_reason="Water supply disruption affecting hospital entrance.",
        summary="Water leakage outside City Hospital Gate.",
        suggested_action="Dispatch pipe repair squad.",
        confidence=0.92,
        needs_review=False,
        status="New",
        ai_source="groq",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db_session.add(complaint)
    db_session.commit()
    db_session.refresh(complaint)
    return complaint

# ------------------------------------------------------------------------------
# TEST 1: Valid citizen confirmation email after successful persistence
# ------------------------------------------------------------------------------
def test_valid_citizen_confirmation_email(db_session, sample_complaint):
    with patch("resend.Emails.send", return_value={"id": "resend_msg_001"}) as mock_send, \
         patch("app.email_service.RESEND_API_KEY", "re_mock_test_key_12345"):
        
        log = send_citizen_lodged_email(db_session, sample_complaint)
        assert log.status == "sent"
        assert log.provider_id == "resend_msg_001"
        assert log.email_type == "lodged"
        assert log.to_email == "anita.roy@testdomain.com"
        assert mock_send.called
        
        call_args = mock_send.call_args[0][0]
        assert "CIV-TEST-001" in call_args["subject"]
        assert "Anita Roy" in call_args["html"]

# ------------------------------------------------------------------------------
# TEST 2: Correct administrative recipient selection
# ------------------------------------------------------------------------------
def test_correct_administrative_recipient_selection(db_session, sample_complaint):
    with patch("resend.Emails.send", return_value={"id": "resend_admin_msg_002"}) as mock_send, \
         patch("app.email_service.RESEND_API_KEY", "re_mock_key"), \
         patch("app.email_service.ADMIN_NOTIFICATION_EMAIL", "officer.nodal@metro.gov"):
        
        log = send_admin_new_complaint_notification(db_session, sample_complaint)
        assert log.status == "sent"
        assert log.to_email == "officer.nodal@metro.gov"
        assert log.email_type == "admin_notification"
        
        call_args = mock_send.call_args[0][0]
        assert call_args["to"] == ["officer.nodal@metro.gov"]
        assert "CIV-TEST-001" in call_args["subject"]
        assert "Water Supply Board" in call_args["html"]
        # Ensure citizen private details are omitted from admin broadcast
        assert "anita.roy@testdomain.com" not in call_args["html"]

# ------------------------------------------------------------------------------
# TEST 3: Missing administrative recipient safely skipped
# ------------------------------------------------------------------------------
def test_missing_administrative_recipient(db_session, sample_complaint):
    with patch("resend.Emails.send") as mock_send, \
         patch("app.email_service.ADMIN_NOTIFICATION_EMAIL", None):
        
        log = send_admin_new_complaint_notification(db_session, sample_complaint)
        assert log.status == "skipped"
        assert "not configured" in log.error
        assert not mock_send.called

# ------------------------------------------------------------------------------
# TEST 4: Missing or invalid citizen email safely skipped
# ------------------------------------------------------------------------------
def test_missing_or_invalid_citizen_email(db_session, sample_complaint):
    sample_complaint.citizen_email = "invalid_not_an_email"
    db_session.commit()
    
    with patch("resend.Emails.send") as mock_send, \
         patch("app.email_service.RESEND_API_KEY", "re_mock_key"):
        
        log = send_citizen_lodged_email(db_session, sample_complaint)
        assert log.status == "skipped"
        assert "invalid" in log.error.lower()
        assert not mock_send.called

# ------------------------------------------------------------------------------
# TEST 5: Missing API key safely handled
# ------------------------------------------------------------------------------
def test_missing_api_key(db_session, sample_complaint):
    with patch("resend.Emails.send") as mock_send, \
         patch("app.email_service.RESEND_API_KEY", ""):
        
        log = send_citizen_lodged_email(db_session, sample_complaint)
        assert log.status == "skipped"
        assert "RESEND_API_KEY is not configured" in log.error
        assert not mock_send.called

# ------------------------------------------------------------------------------
# TEST 6: Invalid or unverified sender rejection handled with clean error
# ------------------------------------------------------------------------------
def test_unverified_sender_rejection(db_session, sample_complaint):
    error_msg = "You can only send testing emails to your own email address (owner@gmail.com). To send to other recipients, verify a domain."
    with patch("resend.Emails.send", side_effect=Exception(error_msg)), \
         patch("app.email_service.RESEND_API_KEY", "re_mock_key"):
        
        log = send_citizen_lodged_email(db_session, sample_complaint)
        assert log.status == "failed"
        assert "Free tier 'onboarding@resend.dev' can only deliver" in log.error
        assert log.retryable is False

# ------------------------------------------------------------------------------
# TEST 7: Resend API rate limiting (HTTP 429) marked retryable
# ------------------------------------------------------------------------------
def test_resend_rate_limiting(db_session, sample_complaint):
    with patch("resend.Emails.send", side_effect=Exception("HTTP 429: rate_limit_exceeded")), \
         patch("app.email_service.RESEND_API_KEY", "re_mock_key"):
        
        log = send_citizen_lodged_email(db_session, sample_complaint)
        assert log.status == "failed"
        assert "rate limit" in log.error.lower()
        assert log.retryable is True

# ------------------------------------------------------------------------------
# TEST 8: Network timeout error handling
# ------------------------------------------------------------------------------
def test_network_timeout_error(db_session, sample_complaint):
    with patch("resend.Emails.send", side_effect=Exception("Connection timeout communicating with api.resend.com")), \
         patch("app.email_service.RESEND_API_KEY", "re_mock_key"):
        
        log = send_citizen_lodged_email(db_session, sample_complaint)
        assert log.status == "failed"
        assert "timeout" in log.error.lower()
        assert log.retryable is True

# ------------------------------------------------------------------------------
# TEST 9: Provider message ID persistence
# ------------------------------------------------------------------------------
def test_provider_message_id_persistence(db_session, sample_complaint):
    with patch("resend.Emails.send", return_value={"id": "provider_uid_778899"}), \
         patch("app.email_service.RESEND_API_KEY", "re_mock_key"):
        
        log = send_citizen_lodged_email(db_session, sample_complaint)
        persisted = db_session.query(EmailLog).filter(EmailLog.id == log.id).first()
        assert persisted is not None
        assert persisted.provider_id == "provider_uid_778899"
        assert persisted.status == "sent"

# ------------------------------------------------------------------------------
# TEST 10: Accurate email status logging
# ------------------------------------------------------------------------------
def test_accurate_email_status_logging(db_session, sample_complaint):
    # Sent status
    with patch("resend.Emails.send", return_value={"id": "id_1"}), \
         patch("app.email_service.RESEND_API_KEY", "re_mock_key"):
        log_sent = send_citizen_lodged_email(db_session, sample_complaint)
        assert log_sent.status == "sent"
        
    # Skipped status
    with patch("app.email_service.RESEND_API_KEY", ""):
        log_skip = send_citizen_lodged_email(db_session, sample_complaint)
        assert log_skip.status == "skipped"

    # Failed status
    with patch("resend.Emails.send", side_effect=Exception("Server error 500")), \
         patch("app.email_service.RESEND_API_KEY", "re_mock_key"):
        log_fail = send_citizen_lodged_email(db_session, sample_complaint)
        assert log_fail.status == "failed"

# ------------------------------------------------------------------------------
# TEST 11: Complaint persistence despite email failure
# ------------------------------------------------------------------------------
def test_complaint_persistence_despite_email_failure():
    client = TestClient(app)
    
    # Simulate Resend throwing an exception during intake
    with patch("resend.Emails.send", side_effect=Exception("Resend completely down")):
        response = client.post("/api/complaints/json", json={
            "raw_text": "Massive pothole near district bus terminal.",
            "citizen_name": "Rohan Mehta",
            "citizen_email": "rohan.mehta@example.com",
            "location_text": "Bus Terminal"
        })
        # The complaint MUST be created and returned 200 OK regardless of email failure
        assert response.status_code == 200
        data = response.json()
        assert data["id"].startswith("CIV-")
        assert data["citizen_name"] == "Rohan Mehta"

# ------------------------------------------------------------------------------
# TEST 12: No duplicate confirmation after retries
# ------------------------------------------------------------------------------
def test_no_duplicate_resolution_email(db_session, sample_complaint):
    sample_complaint.status = "Resolved"
    sample_complaint.resolved_at = datetime.utcnow()
    db_session.commit()
    
    with patch("resend.Emails.send", return_value={"id": "res_msg_001"}) as mock_send, \
         patch("app.email_service.RESEND_API_KEY", "re_mock_key"):
        
        # First send
        log1 = send_complaint_resolved_email(db_session, sample_complaint)
        assert log1.status == "sent"
        assert mock_send.call_count == 1
        
        # Second attempt (must not send duplicate)
        log2 = send_complaint_resolved_email(db_session, sample_complaint)
        assert log2.id == log1.id
        assert mock_send.call_count == 1 # Still 1, didn't dispatch again!

# ------------------------------------------------------------------------------
# TEST 13: Single resolution trigger on status update
# ------------------------------------------------------------------------------
def test_resolution_email_triggered_only_once_on_status_toggle():
    client = TestClient(app)
    
    # Create complaint
    create_res = client.post("/api/complaints/json", json={
        "raw_text": "Deep road trench outside gate.",
        "citizen_name": "Priya Sharma",
        "citizen_email": "priya.sharma@example.com"
    })
    ticket_id = create_res.json()["id"]
    
    with patch("resend.Emails.send", return_value={"id": "res_mock_single"}) as mock_send:
        # 1. Forward to In Progress, then Resolved -> triggers resolution email
        r_prog = client.patch(f"/api/complaints/{ticket_id}", json={"status": "In Progress"})
        assert r_prog.status_code == 200
        r1 = client.patch(f"/api/complaints/{ticket_id}", json={"status": "Resolved"})
        assert r1.status_code == 200
        
        # 2. Reopen via explicit Reopen action (since direct backward patch is now strictly forbidden)
        r2 = client.post(f"/api/complaints/{ticket_id}/reopen", json={"reason": "Reopened for field verification"})
        assert r2.status_code == 200
        
        # 3. Resolve again -> must NOT send duplicate resolution email
        r3 = client.patch(f"/api/complaints/{ticket_id}", json={"status": "Resolved"})
        assert r3.status_code == 200

# ------------------------------------------------------------------------------
# TEST 14: Diagnostic tool behavior with missing configuration
# ------------------------------------------------------------------------------
def test_diagnostic_tool_missing_recipient():
    with patch("scripts.test_resend.RESEND_TEST_RECIPIENT", None), \
         patch("scripts.test_resend.ADMIN_NOTIFICATION_EMAIL", None), \
         patch("scripts.test_resend.DEMO_EMAIL_OVERRIDE", None):
        code = run_diagnostic(test_to=None)
        assert code == 1

def test_diagnostic_tool_missing_api_key():
    with patch("scripts.test_resend.RESEND_API_KEY", ""):
        code = run_diagnostic(test_to="test@resend.dev")
        assert code == 1

# ------------------------------------------------------------------------------
# TEST 15: Existing complaint and officer dashboard API compatibility
# ------------------------------------------------------------------------------
def test_officer_dashboard_endpoints_and_stats():
    client = TestClient(app)
    
    # 1. Check /api/stats
    stats_res = client.get("/api/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total" in stats
    assert "by_category" in stats
    assert "critical_open" in stats
    
    # 2. Check /api/complaints list
    list_res = client.get("/api/complaints")
    assert list_res.status_code == 200
    complaints = list_res.json()
    assert isinstance(complaints, list)
    if len(complaints) > 0:
        c = complaints[0]
        assert "id" in c
        assert "email_logs" in c
        assert "status_history" in c
