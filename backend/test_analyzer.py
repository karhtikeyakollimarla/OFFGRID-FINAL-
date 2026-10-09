import json
from app.analyzer import analyze_complaint

test_complaints = [
    ("There is a huge pothole near our college gate, and two people almost fell today.", "college gate"),
    ("Live wire is sparking near the school bus stop, please send someone immediately children are playing nearby!", None),
    ("Open manhole on 5th main road, someone fell and got injured yesterday evening.", "5th main road"),
    ("Sadak pe bahut bada khaddha hai, gaadi ka accident ho gaya.", "Near metro station"),
    ("Kachra pichle char din se nahi uthaya gaya, badboo aa rahi hai colony me.", "Shanti Nagar"),
    ("Drinking water pipeline is leaking heavily outside hospital gate for 3 days.", "Civil Hospital"),
    ("Streetlight is not working on 2nd cross street, area is completely dark at night.", "2nd cross"),
    ("Naali overflow ho rahi hai ghar ke samne, ganda paani road pe beh raha hai.", None),
    ("Some random noise coming from community hall.", None),
    ("Sewage overflow near homes causing severe health hazard.", "Block B")
]

print("=== RUNNING MILESTONE 1 ANALYZER VERIFICATION ===")
for i, (text, loc) in enumerate(test_complaints, 1):
    result = analyze_complaint(text, loc)
    print(f"\n--- Complaint #{i} ---")
    print(f"Input: {text}")
    print(f"Output: Category={result['category']} | Issue={result['issue_type']} | Dept={result['department']}")
    print(f"        Urgency={result['urgency']} | Reason={result['urgency_reason']}")
    print(f"        Summary: {result['summary']}")
    print(f"        Confidence={result['confidence']} | Source={result['ai_source']} | NeedsReview={result['needs_review']}")

print("\n=== ALL 10 COMPLAINTS EVALUATED SUCCESSFULLY ===")
