import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from .config import DEFAULT_MAP_CENTER_LAT, DEFAULT_MAP_CENTER_LNG, GEMINI_API_KEY
from .models import Complaint, StatusHistory, EmailLog
from .analyzer import analyze_complaint, DEPARTMENT_MAP

# 40 realistic civic complaints (including Hinglish, messy text, safety triggers, and duplicates)
SEED_DATA_ITEMS = [
    # Required primary example
    {
        "text": "There is a huge pothole near our college gate, and two people almost fell today.",
        "name": "Aarav Sharma",
        "email": "aarav.sharma@example.com",
        "loc": "College Gate, Sector 4",
        "lat": DEFAULT_MAP_CENTER_LAT + 0.005,
        "lng": DEFAULT_MAP_CENTER_LNG + 0.004,
        "status": "New"
    },
    # Near duplicate of the above
    {
        "text": "Huge crater outside main college entrance gate! Dangerous for two wheelers, fix urgently.",
        "name": "Neha Gupta",
        "email": "neha.gupta@example.com",
        "loc": "College Gate",
        "lat": DEFAULT_MAP_CENTER_LAT + 0.0052,
        "lng": DEFAULT_MAP_CENTER_LNG + 0.0041,
        "status": "New"
    },
    # Hotspot Cluster 1 (Market Area - Shivaji Circle / CP)
    {
        "text": "Live electric wire hanging low from pole right outside metro gate 2, heavy sparking seen!",
        "name": "Vikram Patel",
        "email": "vikram.patel@example.com",
        "loc": "Metro Gate 2, Central Market",
        "lat": DEFAULT_MAP_CENTER_LAT + 0.0120,
        "lng": DEFAULT_MAP_CENTER_LNG + 0.0080,
        "status": "Assigned"
    },
    {
        "text": "Open manhole on main market road, two pedestrians fell and got injured yesterday evening.",
        "name": "Sunita Verma",
        "email": "sunita.verma@example.com",
        "loc": "Central Market Road",
        "lat": DEFAULT_MAP_CENTER_LAT + 0.0125,
        "lng": DEFAULT_MAP_CENTER_LNG + 0.0084,
        "status": "In Progress"
    },
    {
        "text": "Massive garbage pile accumulated opposite fruit market for 5 days. Foul smell and stray dogs.",
        "name": "Mohammad Rizwan",
        "email": "rizwan.m@example.com",
        "loc": "Opposite Fruit Market",
        "lat": DEFAULT_MAP_CENTER_LAT + 0.0118,
        "lng": DEFAULT_MAP_CENTER_LNG + 0.0079,
        "status": "New"
    },
    {
        "text": "Main water pipeline burst near central market fountain, clean drinking water flooding the road.",
        "name": "Kavita Rao",
        "email": "kavita.rao@example.com",
        "loc": "Central Market Fountain",
        "lat": DEFAULT_MAP_CENTER_LAT + 0.0122,
        "lng": DEFAULT_MAP_CENTER_LNG + 0.0082,
        "status": "Assigned"
    },
    {
        "text": "Naali overflow ho rahi hai market road pe, dirty black water spreading in front of shops.",
        "name": "Rajesh Bansal",
        "email": "rajesh.b@example.com",
        "loc": "Shop No 14, Central Market",
        "lat": DEFAULT_MAP_CENTER_LAT + 0.0129,
        "lng": DEFAULT_MAP_CENTER_LNG + 0.0086,
        "status": "New"
    },
    {
        "text": "All 4 streetlights near circle are broken for past 10 days, pitch dark and unsafe for women.",
        "name": "Pooja Malhotra",
        "email": "pooja.m@example.com",
        "loc": "Central Circle Bus Stop",
        "lat": DEFAULT_MAP_CENTER_LAT + 0.0121,
        "lng": DEFAULT_MAP_CENTER_LNG + 0.0075,
        "status": "New"
    },
    {
        "text": "Deep potholes across the whole 200m stretch of Market Lane 3, cars bottoming out daily.",
        "name": "Anil Deshmukh",
        "email": "anil.d@example.com",
        "loc": "Market Lane 3",
        "lat": DEFAULT_MAP_CENTER_LAT + 0.0127,
        "lng": DEFAULT_MAP_CENTER_LNG + 0.0078,
        "status": "Resolved"
    },

    # Hotspot Cluster 2 (Residential Complex / School Zone)
    {
        "text": "Sewage overflow near homes and primary school, children walking through contaminated water.",
        "name": "Meera Sen",
        "email": "meera.sen@example.com",
        "loc": "Outside City Public School",
        "lat": DEFAULT_MAP_CENTER_LAT - 0.0150,
        "lng": DEFAULT_MAP_CENTER_LNG - 0.0120,
        "status": "In Progress"
    },
    {
        "text": "Transformer sparking loudly with burning smell right next to children's park playground.",
        "name": "Deepak Nair",
        "email": "deepak.nair@example.com",
        "loc": "Block C Children Park",
        "lat": DEFAULT_MAP_CENTER_LAT - 0.0153,
        "lng": DEFAULT_MAP_CENTER_LNG - 0.0118,
        "status": "Assigned"
    },
    {
        "text": "Gutter cover broken, open hole right where school vans drop off children every morning.",
        "name": "Shalini Joshi",
        "email": "shalini.j@example.com",
        "loc": "Block C Main Gate",
        "lat": DEFAULT_MAP_CENTER_LAT - 0.0148,
        "lng": DEFAULT_MAP_CENTER_LNG - 0.0123,
        "status": "New"
    },
    {
        "text": "No drinking water supply in Block C apartments since 48 hours, overhead tanks completely dry.",
        "name": "Rohan Mehra",
        "email": "rohan.mehra@example.com",
        "loc": "Block C Flats",
        "lat": DEFAULT_MAP_CENTER_LAT - 0.0155,
        "lng": DEFAULT_MAP_CENTER_LNG - 0.0125,
        "status": "New"
    },
    {
        "text": "Kachre ka dher pichle 1 hafte se pada hai school boundary wall ke pass, bache beemar pad rahe.",
        "name": "Suresh Yadav",
        "email": "suresh.yadav@example.com",
        "loc": "Behind School Wall, Block C",
        "lat": DEFAULT_MAP_CENTER_LAT - 0.0145,
        "lng": DEFAULT_MAP_CENTER_LNG - 0.0115,
        "status": "New"
    },
    {
        "text": "Road has sunk about 1 foot deep near school crossing, high risk of accident for school buses.",
        "name": "Priyanka Roy",
        "email": "priyanka.roy@example.com",
        "loc": "School Crossing Junction",
        "lat": DEFAULT_MAP_CENTER_LAT - 0.0158,
        "lng": DEFAULT_MAP_CENTER_LNG - 0.0122,
        "status": "Assigned"
    },
    {
        "text": "Multiple street lamps dead along school perimeter road, very dark during early morning winter.",
        "name": "Arjun Singhal",
        "email": "arjun.s@example.com",
        "loc": "Perimeter Road, Block C",
        "lat": DEFAULT_MAP_CENTER_LAT - 0.0142,
        "lng": DEFAULT_MAP_CENTER_LNG - 0.0127,
        "status": "Resolved"
    },

    # Scattered Realistic Complaints (Hinglish, mixed, unmapped, diverse categories)
    {
        "text": "Paani me bahut ganda mitti aur badboo aa rahi hai pichle teen din se, peene layak nahi hai.",
        "name": "Gita Devi",
        "email": "gita.devi@example.com",
        "loc": "Sector 9 House 42",
        "lat": DEFAULT_MAP_CENTER_LAT + 0.0220,
        "lng": DEFAULT_MAP_CENTER_LNG - 0.0180,
        "status": "New"
    },
    {
        "text": "Bijli ka taar ped se ulajh kar toot gaya hai sadak par, barish ho sakti hai dhyan do jaldi.",
        "name": "Manoj Tiwari",
        "email": "manoj.t@example.com",
        "loc": "Banyan Tree Chowk, Ward 12",
        "lat": DEFAULT_MAP_CENTER_LAT - 0.0210,
        "lng": DEFAULT_MAP_CENTER_LNG + 0.0150,
        "status": "Assigned"
    },
    {
        "text": "Dustbin overflowed onto sidewalk, dogs tearing garbage bags into road near bus stop.",
        "name": "Tanvi Jain",
        "email": "tanvi.jain@example.com",
        "loc": "Bus Stop, Sector 15",
        "lat": DEFAULT_MAP_CENTER_LAT + 0.0180,
        "lng": DEFAULT_MAP_CENTER_LNG + 0.0220,
        "status": "New"
    },
    {
        "text": "Severe waterlogging outside district hospital emergency gate after rain, ambulances delayed.",
        "name": "Dr. Vinay Saxena",
        "email": "vinay.s@example.com",
        "loc": "Civil Hospital Emergency Gate",
        "lat": DEFAULT_MAP_CENTER_LAT + 0.0080,
        "lng": DEFAULT_MAP_CENTER_LNG - 0.0250,
        "status": "In Progress"
    },
    {
        "text": "Nali choked with plastic bottles near community park, stagnant water breeding mosquitoes.",
        "name": "Smita Agarwal",
        "email": "smita.a@example.com",
        "loc": "Rose Garden Community Park",
        "lat": DEFAULT_MAP_CENTER_LAT - 0.0090,
        "lng": DEFAULT_MAP_CENTER_LNG + 0.0190,
        "status": "New"
    },
    {
        "text": "Speed breaker markings faded completely near blind curve on Ring Road link, bikes skidding.",
        "name": "Karthik Menon",
        "email": "karthik.m@example.com",
        "loc": "Ring Road Link Curve",
        "lat": DEFAULT_MAP_CENTER_LAT + 0.0310,
        "lng": DEFAULT_MAP_CENTER_LNG - 0.0040,
        "status": "Resolved"
    },
    {
        "text": "Streetlight flickering like disco light for 2 weeks on 7th avenue, disturbing sleep.",
        "name": "Rita Fernandes",
        "email": "rita.f@example.com",
        "loc": "7th Avenue, Plot 108",
        "lat": DEFAULT_MAP_CENTER_LAT - 0.0280,
        "lng": DEFAULT_MAP_CENTER_LNG - 0.0090,
        "status": "New"
    },
    {
        "text": "Water valve leak on municipal main line wasting thousands of liters daily onto pavement.",
        "name": "Harish Pandey",
        "email": "harish.p@example.com",
        "loc": "Near Water Tank No 3",
        "lat": DEFAULT_MAP_CENTER_LAT + 0.0040,
        "lng": DEFAULT_MAP_CENTER_LNG + 0.0290,
        "status": "Assigned"
    },
    {
        "text": "Dead dog lying on sidewalk since yesterday morning, urgently need disposal team.",
        "name": "Satish Chander",
        "email": "satish.c@example.com",
        "loc": "Opposite Shiv Mandir",
        "lat": DEFAULT_MAP_CENTER_LAT - 0.0190,
        "lng": DEFAULT_MAP_CENTER_LNG - 0.0210,
        "status": "In Progress"
    },
    {
        "text": "Storm drain slab cracked in half under car tire weight, wheel trapped earlier today.",
        "name": "Farhan Akhtar",
        "email": "farhan.a@example.com",
        "loc": "Main Colony Road, Sector 3",
        "lat": DEFAULT_MAP_CENTER_LAT + 0.0140,
        "lng": DEFAULT_MAP_CENTER_LNG - 0.0160,
        "status": "New"
    },
    {
        "text": "Illegal banner tied to electric pole blocking traffic signal view completely.",
        "name": "Vandana Sethi",
        "email": "vandana.s@example.com",
        "loc": "Crossroad Junction Signal",
        "lat": DEFAULT_MAP_CENTER_LAT - 0.0060,
        "lng": DEFAULT_MAP_CENTER_LNG + 0.0120,
        "status": "Resolved"
    },
    {
        "text": "Loud loudspeaker noise from private venue without permission late at night.",
        "name": "Nitin Goel",
        "email": "nitin.g@example.com",
        "loc": "Town Hall Lane",
        "lat": DEFAULT_MAP_CENTER_LAT + 0.0010,
        "lng": DEFAULT_MAP_CENTER_LNG - 0.0080,
        "status": "Resolved"
    },
    {
        "text": "Potholes filled with loose gravel during rains, two wheeler rider fell and got knee injury.",
        "name": "Gaurav Bhatt",
        "email": "gaurav.b@example.com",
        "loc": "Railway Underpass Road",
        "lat": DEFAULT_MAP_CENTER_LAT + 0.0260,
        "lng": DEFAULT_MAP_CENTER_LNG + 0.0090,
        "status": "In Progress"
    },
    {
        "text": "Drinking water smells strongly of sewage in entire lane of 15 houses, severe sickness risk.",
        "name": "Usha Krishnan",
        "email": "usha.k@example.com",
        "loc": "Lane 4, Gandhi Colony",
        "lat": DEFAULT_MAP_CENTER_LAT - 0.0110,
        "lng": DEFAULT_MAP_CENTER_LNG + 0.0060,
        "status": "New"
    },
    {
        "text": "Public park benches vandalized and broken glass spread on walking track.",
        "name": "Dinesh Kulkarni",
        "email": "dinesh.k@example.com",
        "loc": "Netaji Subhash Park",
        "lat": DEFAULT_MAP_CENTER_LAT + 0.0190,
        "lng": DEFAULT_MAP_CENTER_LNG - 0.0020,
        "status": "New"
    },
    {
        "text": "Construction debris and cement dumped on footpath blocking pedestrian ramp.",
        "name": "Simran Kaur",
        "email": "simran.k@example.com",
        "loc": "Outer Ring Footpath, Plot 5",
        "lat": DEFAULT_MAP_CENTER_LAT - 0.0240,
        "lng": DEFAULT_MAP_CENTER_LNG + 0.0020,
        "status": "New"
    },
    {
        "text": "Water pipeline burst creating a fountain 10 feet high, eroding road foundation.",
        "name": "Ananya Sen",
        "email": "ananya.s@example.com",
        "loc": "Near Flyover Pillar 44",
        "lat": DEFAULT_MAP_CENTER_LAT + 0.0160,
        "lng": DEFAULT_MAP_CENTER_LNG + 0.0170,
        "status": "Assigned"
    },
    {
        "text": "Streetlight pole bent at 45 degree angle after vehicle hit, resting precariously on tree branch.",
        "name": "Bhavesh Dave",
        "email": "bhavesh.d@example.com",
        "loc": "Old Post Office Road",
        "lat": DEFAULT_MAP_CENTER_LAT - 0.0030,
        "lng": DEFAULT_MAP_CENTER_LNG - 0.0140,
        "status": "In Progress"
    },
    {
        "text": "Public toilet complex locked and overflowing sewage into lane for past 3 days.",
        "name": "Lata Mangesh",
        "email": "lata.m@example.com",
        "loc": "Near Daily Sabzi Mandi",
        "lat": DEFAULT_MAP_CENTER_LAT + 0.0280,
        "lng": DEFAULT_MAP_CENTER_LNG + 0.0140,
        "status": "New"
    },

    # 5 UNMAPPED TICKETS (latitude and longitude = None to test unmapped badge and manual pin setter)
    {
        "text": "There is a massive pothole somewhere along the highway bypass near the toll gate.",
        "name": "Jaspreet Singh",
        "email": "jaspreet.s@example.com",
        "loc": None,
        "lat": None,
        "lng": None,
        "status": "New"
    },
    {
        "text": "Garbage collector has not visited our entire block for past 10 days.",
        "name": "Pratibha Das",
        "email": "pratibha.d@example.com",
        "loc": None,
        "lat": None,
        "lng": None,
        "status": "New"
    },
    {
        "text": "Water pressure is too low to fill buckets on top floor apartments.",
        "name": "Sanjay Kapoor",
        "email": "sanjay.k@example.com",
        "loc": None,
        "lat": None,
        "lng": None,
        "status": "Assigned"
    },
    {
        "text": "Open electrical junction box with uncovered wires at children eye level near park entry.",
        "name": "Alok Mishra",
        "email": "alok.m@example.com",
        "loc": None,
        "lat": None,
        "lng": None,
        "status": "New"
    },
    {
        "text": "Blocked sewer causing backflow into ground floor bathrooms in colony.",
        "name": "Bina Chatterjee",
        "email": "bina.c@example.com",
        "loc": None,
        "lat": None,
        "lng": None,
        "status": "Resolved"
    }
]

def seed_database(db: Session) -> int:
    """Seeds 40 realistic civic complaints into the database."""
    officers = ["Officer R. Sharma", "Officer A. Iyer", "Officer V. Kulkarni", "Officer M. Khan"]
    now = datetime.utcnow()
    count = 0

    for i, item in enumerate(SEED_DATA_ITEMS, 1):
        ticket_id = f"CIV-{i:05d}"
        
        # Check if ticket already exists
        existing = db.query(Complaint).filter(Complaint.id == ticket_id).first()
        if existing:
            continue

        raw_text = item["text"]
        loc_hint = item["loc"]
        
        # Run through analyzer (uses Gemini if key present, fallback otherwise)
        analysis = analyze_complaint(raw_text, loc_hint)

        created_ago_days = random.randint(0, 10)
        created_time = now - timedelta(days=created_ago_days, hours=random.randint(1, 18), minutes=random.randint(0, 59))
        
        status = item["status"]
        resolved_time = None
        assigned_to = None
        notes = "Sample data seeded for municipal triage demonstration."

        if status in ["Assigned", "In Progress", "Resolved"]:
            assigned_to = random.choice(officers)
        if status == "Resolved":
            resolved_time = created_time + timedelta(days=random.randint(1, 3), hours=random.randint(2, 6))
            notes = "Issue inspected, repairs completed, verified with local residents. [Sample Data]"

        complaint = Complaint(
            id=ticket_id,
            raw_text=raw_text,
            citizen_name=f"{item['name']} (Sample)",
            citizen_email=item["email"],
            location_text=loc_hint or analysis.get("location_text"),
            latitude=item["lat"],
            longitude=item["lng"],
            category=analysis["category"],
            issue_type=analysis["issue_type"],
            department=analysis["department"],
            urgency=analysis["urgency"],
            urgency_reason=analysis["urgency_reason"],
            duration=analysis.get("duration"),
            summary=analysis["summary"],
            suggested_action=analysis["suggested_action"],
            confidence=analysis["confidence"],
            needs_review=analysis["needs_review"],
            status=status,
            assigned_to=assigned_to,
            officer_notes=notes,
            photo_path=None,
            ai_source=analysis["ai_source"],
            created_at=created_time,
            updated_at=resolved_time or created_time,
            resolved_at=resolved_time
        )
        db.add(complaint)

        # Add Status History
        hist1 = StatusHistory(
            complaint_id=ticket_id,
            from_status=None,
            to_status="New",
            actor="Citizen",
            notes="Grievance lodged via citizen portal",
            changed_at=created_time
        )
        db.add(hist1)

        if status in ["Assigned", "In Progress", "Resolved"]:
            hist2 = StatusHistory(
                complaint_id=ticket_id,
                from_status="New",
                to_status="Assigned",
                actor="AI Dispatch Triage",
                notes=f"Auto-assigned to {assigned_to}",
                changed_at=created_time + timedelta(hours=3)
            )
            db.add(hist2)

        if status in ["In Progress", "Resolved"]:
            hist3 = StatusHistory(
                complaint_id=ticket_id,
                from_status="Assigned",
                to_status="In Progress",
                actor=assigned_to or "Field Officer",
                notes="Field inspection and repair operation initiated",
                changed_at=created_time + timedelta(hours=8)
            )
            db.add(hist3)

        if status == "Resolved":
            hist4 = StatusHistory(
                complaint_id=ticket_id,
                from_status="In Progress",
                to_status="Resolved",
                actor=assigned_to or "Field Officer",
                notes=notes or "Remediation verified and certified complete",
                changed_at=resolved_time
            )
            db.add(hist4)

        count += 1

    db.commit()
    return count

if __name__ == "__main__":
    from .database import SessionLocal
    db = SessionLocal()
    try:
        seeded = seed_database(db)
        print(f"Successfully seeded {seeded} complaints.")
    finally:
        db.close()
