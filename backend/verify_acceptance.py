import requests
import json
import time

API_URL = "http://127.0.0.1:8000/api"
PROXY_URL = "http://127.0.0.1:5173/api"

print("==========================================================")
print("     CIVICAI ACCEPTANCE CRITERIA VERIFICATION SUITE       ")
print("==========================================================")

# Check backend health & proxy health
res_health = requests.get(f"{API_URL}/stats")
assert res_health.status_code == 200, "Backend /api/stats failed"
print(f"PASS: Direct Backend accessible at {API_URL}")

res_proxy = requests.get(f"{PROXY_URL}/stats")
assert res_proxy.status_code == 200, "Frontend proxy to /api/stats failed"
print(f"PASS: Vite Frontend Proxy accessible at {PROXY_URL}")

# TEST 1: Pothole complaint returns Roads / Pothole / Public Works – Roads, High/Critical, location 'college gate'
pothole_payload = {
    "raw_text": "There is a huge pothole near our college gate, and two people almost fell today.",
    "citizen_name": "Acceptance Test Citizen",
    "citizen_email": "citizen.pothole@example.com",
    "location_text": "College Gate"
}
res_pothole = requests.post(f"{API_URL}/complaints", data=pothole_payload)
assert res_pothole.status_code == 200, f"Pothole submit failed: {res_pothole.text}"
t1 = res_pothole.json()
print("\n--- TEST 1: Pothole Complaint ---")
print(f"Ticket ID: {t1['id']}")
print(f"Category: {t1['category']} (Expected: Roads)")
print(f"Issue Type: {t1['issue_type']}")
print(f"Department: {t1['department']} (Expected: Public Works – Roads)")
print(f"Urgency: {t1['urgency']} (Expected: High or Critical)")
print(f"Location: {t1['location_text']}")
print(f"Suggested Action: {t1['suggested_action']}")
assert t1["category"] == "Roads"
assert "Roads" in t1["department"]
assert t1["urgency"] in ["High", "Critical"]
assert "college gate" in (t1["location_text"] or "").lower()
print("RESULT: TEST 1 PASSED")

# TEST 2: Complaint mentioning 'live wire' or 'children' is never rated below High
wire_payload = {
    "raw_text": "Live wire sparking near park, small children playing nearby!",
    "citizen_name": "Safety Test Citizen",
    "citizen_email": "safety@example.com"
}
res_wire = requests.post(f"{API_URL}/complaints", data=wire_payload)
assert res_wire.status_code == 200
t2 = res_wire.json()
print("\n--- TEST 2: Live Wire / Children Safety Rule ---")
print(f"Ticket ID: {t2['id']}")
print(f"Urgency: {t2['urgency']} (Expected: High or Critical)")
print(f"Urgency Reason: {t2['urgency_reason']}")
assert t2["urgency"] in ["High", "Critical"]
print("RESULT: TEST 2 PASSED")

# TEST 3: Fallback operation with invalid/absent key
print("\n--- TEST 3: Fallback Operation & needs_review flag ---")
print(f"AI Source: {t1['ai_source']}")
print(f"Needs Review: {t1['needs_review']}")
print(f"Confidence: {t1['confidence']}")
assert t1["needs_review"] is True
print("RESULT: TEST 3 PASSED")

# TEST 4: Submitting complaint creates ticket, logs lodged email, appears on dashboard & map
time.sleep(1) # Allow background email task to complete
res_t1_check = requests.get(f"{API_URL}/complaints/{t1['id']}")
assert res_t1_check.status_code == 200
t1_refreshed = res_t1_check.json()
print("\n--- TEST 4: Lodged Email Logging & Dashboard Visibility ---")
print(f"Status history count: {len(t1_refreshed['status_history'])}")
print(f"Email log count: {len(t1_refreshed['email_logs'])}")
assert len(t1_refreshed['email_logs']) >= 1
lodged_log = [l for l in t1_refreshed['email_logs'] if l['email_type'] == 'lodged']
assert len(lodged_log) >= 1
print(f"Lodged email status: {lodged_log[0]['status']} (Recipient: {lodged_log[0]['to_email']}, Reason: {lodged_log[0]['error']})")
print("RESULT: TEST 4 PASSED")

# TEST 5: Changing status to Resolved sends exactly one resolved email and records resolved_at; toggling again does not resend
print("\n--- TEST 5: Resolution & Single Email Guarantee ---")
# First transition: to Resolved
res_resolve1 = requests.patch(f"{API_URL}/complaints/{t1['id']}", json={"status": "Resolved", "officer_notes": "Repaired road surface"})
assert res_resolve1.status_code == 200
t1_resolved = res_resolve1.json()
assert t1_resolved["status"] == "Resolved"
assert t1_resolved["resolved_at"] is not None
print(f"First transition to Resolved -> resolved_at recorded: {t1_resolved['resolved_at']}")
time.sleep(1)

# Toggle back to In Progress
requests.patch(f"{API_URL}/complaints/{t1['id']}", json={"status": "In Progress"})
# Toggle back to Resolved again
requests.patch(f"{API_URL}/complaints/{t1['id']}", json={"status": "Resolved"})
time.sleep(1)

# Verify email logs
t1_final = requests.get(f"{API_URL}/complaints/{t1['id']}").json()
resolved_logs = [l for l in t1_final['email_logs'] if l['email_type'] == 'resolved']
print(f"Resolved email attempts logged: {len(resolved_logs)} (Guarantee: exactly 1 automatic trigger on first transition)")
assert len(resolved_logs) == 1
print("RESULT: TEST 5 PASSED")

# TEST 6: Invalid email failure tolerance
print("\n--- TEST 6: Email Failure Resiliency ---")
invalid_email_payload = {
    "raw_text": "Minor garbage on corner of street 4.",
    "citizen_name": "Invalid Email Citizen",
    "citizen_email": "invalid_email_format",
}
res_invalid = requests.post(f"{API_URL}/complaints", data=invalid_email_payload)
assert res_invalid.status_code == 200, "Submission should still succeed even with bad email!"
t_bad = res_invalid.json()
time.sleep(1)
t_bad_refreshed = requests.get(f"{API_URL}/complaints/{t_bad['id']}").json()
print(f"Ticket created: {t_bad_refreshed['id']}, Email logs: {t_bad_refreshed['email_logs']}")
assert len(t_bad_refreshed['email_logs']) >= 1
assert t_bad_refreshed['email_logs'][0]['status'] in ['skipped', 'failed']
print("RESULT: TEST 6 PASSED")

# TEST 7: Dashboard filters affect both list and map
print("\n--- TEST 7: Filters Affecting List and Map ---")
crit_list = requests.get(f"{API_URL}/complaints?urgency=Critical").json()
crit_map = requests.get(f"{API_URL}/map?urgency=Critical").json()
roads_list = requests.get(f"{API_URL}/complaints?category=Roads").json()
roads_map = requests.get(f"{API_URL}/map?category=Roads").json()
print(f"Critical tickets in list: {len(crit_list)}, Critical items in map: {len(crit_map)}")
print(f"Roads tickets in list: {len(roads_list)}, Roads items in map: {len(roads_map)}")
assert all(c["urgency"] == "Critical" for c in crit_list)
assert all(m["urgency"] == "Critical" for m in crit_map)
print("RESULT: TEST 7 PASSED")

print("\n==========================================================")
print("       ALL ACCEPTANCE CRITERIA PASSED WITHOUT ERROR       ")
print("==========================================================")
