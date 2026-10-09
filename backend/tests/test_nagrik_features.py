import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models import Complaint, StatusHistory, Officer
from app.auth import DEFAULT_SEEDED_OFFICERS, hash_password

# Use in-memory SQLite with StaticPool and check_same_thread=False
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Seed default officers
    for off in DEFAULT_SEEDED_OFFICERS:
        pwd_hash, salt = hash_password(off["password"])
        officer = Officer(
            email=off["email"],
            full_name=off["full_name"],
            badge_number=off["badge_number"],
            department=off["department"],
            role=off["role"],
            password_hash=pwd_hash,
            salt=salt,
            is_active=True
        )
        db.add(officer)
    db.commit()
    db.close()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    try:
        yield test_client
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)

def test_health_check_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "Nagrik API"
    assert "tagline" in data
    assert data["database"] == "connected"

def test_officer_authentication_flow(client):
    # 1. Invalid credentials
    res_bad = client.post("/api/auth/login", json={
        "email": "admin@nagrik.local",
        "password": "WrongPassword123"
    })
    assert res_bad.status_code == 401

    # 2. Valid credentials
    res_ok = client.post("/api/auth/login", json={
        "email": "admin@nagrik.local",
        "password": "NagrikAdmin2026!"
    })
    assert res_ok.status_code == 200
    login_data = res_ok.json()
    assert "access_token" in login_data
    token = login_data["access_token"]
    assert login_data["officer"]["role"] == "Commissioner"

    # 3. /api/auth/me with bearer token
    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["email"] == "admin@nagrik.local"

    # 4. /api/auth/officers list
    res_list = client.get("/api/auth/officers")
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 5

def test_complaint_creation_auto_assignment_and_tracking_token(client):
    res = client.post("/api/complaints/json", json={
        "raw_text": "Live electric wire hanging low sparking near bus stop, dangerous!",
        "citizen_name": "Rohan Mehra",
        "citizen_email": "rohan.m@example.com",
        "location_text": "Bus Stop, Sector 12"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["id"].startswith("CIV-")
    assert data["tracking_token"] is not None
    assert data["tracking_token"].startswith("tr_")
    assert data["department"] == "Electrical & Street Lighting"
    assert data["assigned_to"] is not None
    assert data["assigned_team_id"] == "ESL-01"
    assert data["urgency"] == "Critical"
    assert ("Safety Rule" in data["urgency_reason"]) or ("electrocution" in data["urgency_reason"].lower()) or ("wire" in data["urgency_reason"].lower())

    token = data["tracking_token"]
    ticket_id = data["id"]

    # Secure tracking using token: full email exposed
    res_track_token = client.get(f"/api/track/{token}")
    assert res_track_token.status_code == 200
    assert res_track_token.json()["citizen_email"] == "rohan.m@example.com"

    # Tracking by Ticket ID without token or email: citizen email masked for privacy
    res_track_public = client.get(f"/api/track/{ticket_id}")
    assert res_track_public.status_code == 200
    assert "***" in res_track_public.json()["citizen_email"]

    # Tracking by Ticket ID with citizen email query param: full email verified
    res_track_verified = client.get(f"/api/track/{ticket_id}?email=rohan.m@example.com")
    assert res_track_verified.status_code == 200
    assert res_track_verified.json()["citizen_email"] == "rohan.m@example.com"

def test_evidence_upload_validation(client):
    # 1. Invalid file extension rejected
    bad_file = io.BytesIO(b"fake executable code")
    res_bad_ext = client.post(
        "/api/complaints",
        data={
            "raw_text": "Pothole on main road",
            "citizen_name": "Sunita",
            "citizen_email": "sunita@example.com"
        },
        files={"photo": ("malicious.exe", bad_file, "application/octet-stream")}
    )
    assert res_bad_ext.status_code == 400
    assert "Invalid file extension" in res_bad_ext.json()["detail"]

    # 2. Invalid magic header rejected
    fake_png = io.BytesIO(b"not really a png file at all")
    res_bad_magic = client.post(
        "/api/complaints",
        data={
            "raw_text": "Pothole on main road",
            "citizen_name": "Sunita",
            "citizen_email": "sunita@example.com"
        },
        files={"photo": ("evidence.png", fake_png, "image/png")}
    )
    assert res_bad_magic.status_code == 400
    assert "file does not match allowed" in res_bad_magic.json()["detail"]

    # 3. Valid PNG magic header accepted
    valid_png_bytes = b"\x89PNG\r\n\x1a\n" + b"\x00" * 50
    valid_png = io.BytesIO(valid_png_bytes)
    res_ok = client.post(
        "/api/complaints",
        data={
            "raw_text": "Pothole on sector 4 road causing traffic slowdown",
            "citizen_name": "Sunita",
            "citizen_email": "sunita@example.com"
        },
        files={"photo": ("valid_evidence.png", valid_png, "image/png")}
    )
    assert res_ok.status_code == 200
    assert res_ok.json()["photo_path"] is not None
    assert res_ok.json()["photo_path"].startswith("/uploads/")
