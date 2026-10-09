from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, Base, engine
from app.seed import seed_database
from app.models import Complaint, StatusHistory, EmailLog

client = TestClient(app)

print("=== STARTING FULL BACKEND INTEGRATION TEST ===")

# 1. Test Seed
db = SessionLocal()
seeded_count = seed_database(db)
db.close()
print(f"[1] Seed Database: Seeded {seeded_count} records.")

# 2. Test Stats endpoint
res_stats = client.get("/api/stats")
assert res_stats.status_code == 200, f"Stats failed: {res_stats.text}"
stats_data = res_stats.json()
print(f"[2] GET /api/stats: Total={stats_data['total']}, CriticalOpen={stats_data['critical_open']}, Resolved={stats_data['resolved']}, Unmapped={stats_data['unmapped_count']}")
assert stats_data['total'] >= 40, "Total complaints should be at least 40"

# 3. Test Map endpoint
res_map = client.get("/api/map")
assert res_map.status_code == 200, f"Map failed: {res_map.text}"
map_items = res_map.json()
print(f"[3] GET /api/map: {len(map_items)} open mapped items returned.")
assert len(map_items) > 0, "Map items should have coordinates"

# 4. Test Complaints list & filters
res_list = client.get("/api/complaints?urgency=Critical")
assert res_list.status_code == 200
crit_items = res_list.json()
print(f"[4] GET /api/complaints?urgency=Critical: {len(crit_items)} critical tickets found.")
for c in crit_items[:2]:
    print(f"    - [{c['id']}] {c['urgency']}: {c['summary'][:60]}...")

# 5. Test Complaint Submission (Free-text with safety rule)
submit_payload = {
    "raw_text": "Live wire is sparking near the school bus stop, please send someone immediately children are playing nearby!",
    "citizen_name": "Test Citizen",
    "citizen_email": "test.citizen@example.com",
    "location_text": "St. Marys School Bus Stop",
    "latitude": 28.6140,
    "longitude": 77.2095
}
res_post = client.post("/api/complaints", data=submit_payload)
assert res_post.status_code == 200, f"Post complaint failed: {res_post.text}"
created_ticket = res_post.json()
ticket_id = created_ticket["id"]
print(f"[5] POST /api/complaints: Created ticket {ticket_id}")
print(f"    Category: {created_ticket['category']}")
print(f"    Department: {created_ticket['department']}")
print(f"    Urgency: {created_ticket['urgency']} (Reason: {created_ticket['urgency_reason']})")
print(f"    Status: {created_ticket['status']}")
print(f"    Needs Review: {created_ticket['needs_review']}")
assert created_ticket["urgency"] == "Critical", "Live wire near children should be Critical"

# 6. Test GET ticket by ID
res_get = client.get(f"/api/complaints/{ticket_id}")
assert res_get.status_code == 200
ticket_detail = res_get.json()
print(f"[6] GET /api/complaints/{ticket_id}: Retrieved successfully. StatusHistory count: {len(ticket_detail['status_history'])}, EmailLog count: {len(ticket_detail['email_logs'])}")

# 7. Test PATCH ticket status with forward-only transitions (New -> Assigned -> In Progress -> Resolved)
res_patch_1 = client.patch(f"/api/complaints/{ticket_id}", json={
    "status": "Assigned",
    "assigned_to": "Officer V. Kulkarni"
})
assert res_patch_1.status_code == 200

res_patch_2 = client.patch(f"/api/complaints/{ticket_id}", json={
    "status": "In Progress",
    "officer_notes": "Live wire insulated and secured by emergency electrical squad."
})
assert res_patch_2.status_code == 200

res_patch = client.patch(f"/api/complaints/{ticket_id}", json={
    "status": "Resolved",
    "officer_notes": "Hazard cleared, repairs certified."
})
assert res_patch.status_code == 200
updated_ticket = res_patch.json()
print(f"[7] PATCH /api/complaints/{ticket_id}: Status={updated_ticket['status']}, ResolvedAt={updated_ticket['resolved_at']}")
assert updated_ticket["status"] == "Resolved"
assert updated_ticket["resolved_at"] is not None

# 8. Test Resend Email endpoint
res_resend = client.post(f"/api/complaints/{ticket_id}/resend-email", json={"email_type": "resolved"})
assert res_resend.status_code == 200
print(f"[8] POST /api/complaints/{ticket_id}/resend-email: Success. Email logs count: {len(res_resend.json()['email_logs'])}")
for log in res_resend.json()["email_logs"]:
    print(f"    Log: type={log['email_type']}, to={log['to_email']}, status={log['status']}, err={log['error']}")

print("\n=== ALL BACKEND INTEGRATION TESTS PASSED PERFECTLY ===")
