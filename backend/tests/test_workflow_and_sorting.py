import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.models import Complaint, StatusHistory
from app.main import app

from sqlalchemy.pool import StaticPool

# Setup in-memory SQLite database for test suite
@pytest.fixture
def test_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client(test_db):
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()

def seed_sample_ticket(test_db, ticket_id="CIV-00001", urgency="Medium", status="New", created_at=None):
    c = Complaint(
        id=ticket_id,
        raw_text=f"Test complaint text for {ticket_id}",
        citizen_name="Karthik User",
        citizen_email="karthik@example.com",
        location_text="Main Gate, Ward 4",
        latitude=28.6139,
        longitude=77.2090,
        category="Roads",
        issue_type="Pothole",
        department="Road Infrastructure & Maintenance",
        urgency=urgency,
        urgency_reason="Traffic slowdown test",
        summary=f"Pothole issue {ticket_id}",
        suggested_action="Patch road",
        confidence=0.95,
        needs_review=False,
        status=status,
        created_at=created_at or datetime.utcnow(),
        updated_at=created_at or datetime.utcnow()
    )
    test_db.add(c)
    hist = StatusHistory(
        complaint_id=ticket_id,
        from_status=None,
        to_status=status,
        actor="Citizen",
        notes="Initial lodge",
        changed_at=created_at or datetime.utcnow()
    )
    test_db.add(hist)
    test_db.commit()
    test_db.refresh(c)
    return c

# ------------------------------------------------------------------------------
# 1. SMART SORTING TESTS
# ------------------------------------------------------------------------------

def test_smart_sorting_urgency_priority(client, test_db):
    """Urgency priority: Critical (4) > High (3) > Medium (2) > Low (1)."""
    seed_sample_ticket(test_db, "CIV-00001", urgency="Low")
    seed_sample_ticket(test_db, "CIV-00002", urgency="Critical")
    seed_sample_ticket(test_db, "CIV-00003", urgency="Medium")
    seed_sample_ticket(test_db, "CIV-00004", urgency="High")

    res = client.get("/api/complaints")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 4
    urgencies = [item["urgency"] for item in data]
    assert urgencies == ["Critical", "High", "Medium", "Low"]

def test_smart_sorting_numeric_complaint_ids_within_urgency(client, test_db):
    """Within same urgency, tickets sort by numeric portion descending (e.g. CIV-00010 > CIV-00002)."""
    seed_sample_ticket(test_db, "CIV-00002", urgency="High")
    seed_sample_ticket(test_db, "CIV-00010", urgency="High")
    seed_sample_ticket(test_db, "CIV-00005", urgency="High")
    seed_sample_ticket(test_db, "CIV-00001", urgency="High")

    res = client.get("/api/complaints")
    assert res.status_code == 200
    data = res.json()
    ids = [item["id"] for item in data]
    # Expect 10 -> 5 -> 2 -> 1, not alphabetical (where '00001' might sort differently)
    assert ids == ["CIV-00010", "CIV-00005", "CIV-00002", "CIV-00001"]

# ------------------------------------------------------------------------------
# 2. SEARCH & FILTERING TESTS
# ------------------------------------------------------------------------------

def test_search_and_filters(client, test_db):
    seed_sample_ticket(test_db, "CIV-00001", urgency="Critical", status="New")
    seed_sample_ticket(test_db, "CIV-00002", urgency="Medium", status="In Progress")
    
    # Filter by urgency
    res = client.get("/api/complaints?urgency=Critical")
    assert len(res.json()) == 1
    assert res.json()[0]["id"] == "CIV-00001"

    # Filter by status
    res = client.get("/api/complaints?status=In+Progress")
    assert len(res.json()) == 1
    assert res.json()[0]["id"] == "CIV-00002"

    # Search by ID
    res = client.get("/api/complaints?search=CIV-00001")
    assert len(res.json()) == 1
    assert res.json()[0]["id"] == "CIV-00001"

# ------------------------------------------------------------------------------
# 3. STRICT ONE-WAY STATUS WORKFLOW TESTS
# ------------------------------------------------------------------------------

def test_valid_forward_transitions(client, test_db):
    """New -> Assigned -> In Progress -> Resolved."""
    c = seed_sample_ticket(test_db, "CIV-00001", status="New")

    # 1. New -> Assigned
    res = client.patch(f"/api/complaints/{c.id}", json={"status": "Assigned", "assigned_to": "Squad Alpha"})
    assert res.status_code == 200
    assert res.json()["status"] == "Assigned"

    # 2. Assigned -> In Progress
    res = client.patch(f"/api/complaints/{c.id}", json={"status": "In Progress", "officer_notes": "Starting repair work"})
    assert res.status_code == 200
    assert res.json()["status"] == "In Progress"

    # 3. In Progress -> Resolved
    res = client.patch(f"/api/complaints/{c.id}", json={"status": "Resolved", "officer_notes": "Pothole filled and sealed"})
    assert res.status_code == 200
    assert res.json()["status"] == "Resolved"
    assert res.json()["resolved_at"] is not None

def test_forbidden_backward_transitions(client, test_db):
    """Complaints cannot transition backward: Assigned -> New, In Progress -> Assigned, Resolved -> In Progress."""
    c = seed_sample_ticket(test_db, "CIV-00001", status="Assigned")

    # Assigned -> New (FORBIDDEN)
    res = client.patch(f"/api/complaints/{c.id}", json={"status": "New"})
    assert res.status_code == 400
    assert "strict forward-only workflow" in res.json()["detail"]

    # Move to In Progress
    client.patch(f"/api/complaints/{c.id}", json={"status": "In Progress"})

    # In Progress -> Assigned (FORBIDDEN)
    res = client.patch(f"/api/complaints/{c.id}", json={"status": "Assigned"})
    assert res.status_code == 400
    assert "strict forward-only workflow" in res.json()["detail"]

    # Move to Resolved
    client.patch(f"/api/complaints/{c.id}", json={"status": "Resolved"})

    # Resolved -> In Progress via normal PATCH (FORBIDDEN)
    res = client.patch(f"/api/complaints/{c.id}", json={"status": "In Progress"})
    assert res.status_code == 400
    assert "Resolved complaints cannot be transitioned backward" in res.json()["detail"]

def test_invalid_status_string_rejected(client, test_db):
    c = seed_sample_ticket(test_db, "CIV-00001", status="New")
    res = client.patch(f"/api/complaints/{c.id}", json={"status": "ArbitraryNonExistentStatus"})
    assert res.status_code == 400
    assert "Invalid status" in res.json()["detail"]

# ------------------------------------------------------------------------------
# 4. REOPEN CASE TESTS
# ------------------------------------------------------------------------------

def test_reopen_case_success_and_restrictions(client, test_db):
    c = seed_sample_ticket(test_db, "CIV-00001", status="Resolved")

    # Reopen without valid reason
    res = client.post(f"/api/complaints/{c.id}/reopen", json={"reason": "no"})
    assert res.status_code in (400, 422)

    # Legitimate Reopen
    res = client.post(f"/api/complaints/{c.id}/reopen", json={"reason": "Citizen reported water leakage reoccurred after rain", "actor": "Supervisor Sharma"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "Reopened"
    assert data["reopen_count"] == 1
    assert data["reopened_at"] is not None

    # Verify audit history
    history = data["status_history"]
    latest_hist = [h for h in history if h["to_status"] == "Reopened"][0]
    assert latest_hist["from_status"] == "Resolved"
    assert "Supervisor Sharma" in latest_hist["actor"]
    assert "water leakage reoccurred" in latest_hist["notes"]

    # Reopened complaint can now transition to In Progress or Assigned
    res_progress = client.patch(f"/api/complaints/{c.id}", json={"status": "In Progress", "actor": "Squad Alpha"})
    assert res_progress.status_code == 200
    assert res_progress.json()["status"] == "In Progress"

def test_cannot_reopen_non_resolved_complaint(client, test_db):
    c = seed_sample_ticket(test_db, "CIV-00001", status="In Progress")
    res = client.post(f"/api/complaints/{c.id}/reopen", json={"reason": "Trying to reopen prematurely"})
    assert res.status_code == 400
    assert "Only resolved or closed complaints can be reopened" in res.json()["detail"]

# ------------------------------------------------------------------------------
# 5. CLOSE / DISMISS CASE TESTS
# ------------------------------------------------------------------------------

def test_dismiss_case_success_and_authorization(client, test_db):
    c = seed_sample_ticket(test_db, "CIV-00001", status="New")

    # Unauthorized role
    res = client.post(f"/api/complaints/{c.id}/dismiss", json={"reason": "Duplicate ticket", "actor": "Guest User", "role": "Citizen"})
    assert res.status_code == 403
    assert "Unauthorized" in res.json()["detail"]

    # Authorized role (Supervisor)
    res = client.post(f"/api/complaints/{c.id}/dismiss", json={"reason": "Confirmed duplicate of CIV-00040 per ward inspection", "actor": "Lead Officer Patel", "role": "Supervisor"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "Closed"
    assert data["closed_at"] is not None
    assert "Confirmed duplicate" in data["closure_reason"]

    # Verify audit history
    latest_hist = [h for h in data["status_history"] if h["to_status"] == "Closed"][0]
    assert latest_hist["from_status"] == "New"
    assert "Lead Officer Patel" in latest_hist["actor"]
    assert "Confirmed duplicate" in latest_hist["notes"]
