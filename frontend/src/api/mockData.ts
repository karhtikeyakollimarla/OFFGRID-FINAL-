import { Complaint, StatsData, ComplaintMapItem } from '../types';

export const INITIAL_MOCK_COMPLAINTS: Complaint[] = [
  {
    "id": "CIV-00001",
    "raw_text": "There is a huge pothole near our college gate, and two people almost fell today.",
    "citizen_name": "Aarav Sharma",
    "citizen_email": "aarav.sharma@example.com",
    "location_text": "College Gate, Sector 4",
    "latitude": 28.6189,
    "longitude": 77.21300000000001,
    "category": "Roads",
    "issue_type": "Huge Pothole",
    "department": "Public Works \u2013 Roads",
    "urgency": "High",
    "urgency_reason": "The pothole presents a significant risk of injury to pedestrians who could fall into it.",
    "duration": null,
    "summary": "A large pothole near the college gate in Sector\u202f4 poses a risk of pedestrians falling.",
    "suggested_action": "Dispatch a road repair crew to assess and fill the pothole promptly.",
    "confidence": 0.98,
    "needs_review": false,
    "status": "New",
    "assigned_to": "Officer R. Sharma",
    "assigned_team_id": "PWD-R-01",
    "officer_notes": null,
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 11,
        "complaint_id": "CIV-00001",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 11,
        "complaint_id": "CIV-00001",
        "email_type": "lodged",
        "to_email": "aarav.sharma@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0001",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00002",
    "raw_text": "Huge crater outside main college entrance gate! Dangerous for two wheelers, fix urgently.",
    "citizen_name": "Neha Gupta",
    "citizen_email": "neha.gupta@example.com",
    "location_text": "College Gate",
    "latitude": 28.6191,
    "longitude": 77.2131,
    "category": "Roads",
    "issue_type": "Road Crater",
    "department": "Public Works \u2013 Roads",
    "urgency": "High",
    "urgency_reason": "The crater poses a serious risk of accidents to two\u2011wheelers using the college entrance.",
    "duration": null,
    "summary": "A large crater has formed outside the main college entrance gate, creating a danger for two\u2011wheelers.",
    "suggested_action": "Dispatch a road repair crew to fill and level the crater immediately.",
    "confidence": 0.97,
    "needs_review": false,
    "status": "New",
    "assigned_to": "Officer R. Sharma",
    "assigned_team_id": "PWD-R-01",
    "officer_notes": null,
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 21,
        "complaint_id": "CIV-00002",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 21,
        "complaint_id": "CIV-00002",
        "email_type": "lodged",
        "to_email": "neha.gupta@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0002",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00003",
    "raw_text": "Live electric wire hanging low from pole right outside metro gate 2, heavy sparking seen!",
    "citizen_name": "Vikram Patel",
    "citizen_email": "vikram.patel@example.com",
    "location_text": "Metro Gate 2, Central Market",
    "latitude": 28.6259,
    "longitude": 77.217,
    "category": "Streetlights & Electrical",
    "issue_type": "Live Electric Wire",
    "department": "Electrical & Street Lighting",
    "urgency": "Critical",
    "urgency_reason": "The exposed, sparking live wire poses an immediate risk of electrocution or fire.",
    "duration": null,
    "summary": "A live electric wire is hanging low from a pole near Metro Gate 2, with heavy sparking observed.",
    "suggested_action": "Dispatch an electrical safety team to isolate and repair the wire immediately.",
    "confidence": 0.98,
    "needs_review": false,
    "status": "Assigned",
    "assigned_to": "Officer V. Kulkarni",
    "assigned_team_id": "ESL-01",
    "officer_notes": "Auto-assigned via rules",
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 31,
        "complaint_id": "CIV-00003",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 31,
        "complaint_id": "CIV-00003",
        "email_type": "lodged",
        "to_email": "vikram.patel@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0003",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00004",
    "raw_text": "Open manhole on main market road, two pedestrians fell and got injured yesterday evening.",
    "citizen_name": "Sunita Verma",
    "citizen_email": "sunita.verma@example.com",
    "location_text": "Central Market Road",
    "latitude": 28.6264,
    "longitude": 77.2174,
    "category": "Drainage",
    "issue_type": "Open Manhole",
    "department": "Drainage & Sewerage",
    "urgency": "Critical",
    "urgency_reason": "The open manhole poses an immediate risk of injury, and two pedestrians were already injured.",
    "duration": "since yesterday evening",
    "summary": "An open manhole on Central Market Road caused two pedestrians to fall and sustain injuries yesterday evening.",
    "suggested_action": "Dispatch a repair crew to cover and secure the manhole immediately and investigate the cause.",
    "confidence": 0.98,
    "needs_review": false,
    "status": "In Progress",
    "assigned_to": "Officer S. Chawla",
    "assigned_team_id": "DS-01",
    "officer_notes": "Auto-assigned via rules",
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 41,
        "complaint_id": "CIV-00004",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 41,
        "complaint_id": "CIV-00004",
        "email_type": "lodged",
        "to_email": "sunita.verma@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0004",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00005",
    "raw_text": "Massive garbage pile accumulated opposite fruit market for 5 days. Foul smell and stray dogs.",
    "citizen_name": "Mohammad Rizwan",
    "citizen_email": "rizwan.m@example.com",
    "location_text": "Opposite Fruit Market",
    "latitude": 28.625700000000002,
    "longitude": 77.21690000000001,
    "category": "Sanitation",
    "issue_type": "Garbage Pile",
    "department": "Sanitation & Solid Waste",
    "urgency": "High",
    "urgency_reason": "The foul odor and presence of stray dogs create a health and hygiene risk for nearby residents.",
    "duration": "5 days",
    "summary": "A massive garbage pile has been accumulating opposite the fruit market for five days, emitting a foul odor and attracting stray dogs.",
    "suggested_action": "Dispatch a sanitation crew to clear the garbage pile and sanitize the area immediately.",
    "confidence": 0.98,
    "needs_review": false,
    "status": "New",
    "assigned_to": "Officer M. Khan",
    "assigned_team_id": "SSW-01",
    "officer_notes": null,
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 51,
        "complaint_id": "CIV-00005",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 51,
        "complaint_id": "CIV-00005",
        "email_type": "lodged",
        "to_email": "rizwan.m@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0005",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00006",
    "raw_text": "Main water pipeline burst near central market fountain, clean drinking water flooding the road.",
    "citizen_name": "Kavita Rao",
    "citizen_email": "kavita.rao@example.com",
    "location_text": "Central Market Fountain",
    "latitude": 28.6261,
    "longitude": 77.2172,
    "category": "Water Supply",
    "issue_type": "Pipeline Burst",
    "department": "Water Supply Board",
    "urgency": "High",
    "urgency_reason": "The burst is flooding the road, posing a significant slip hazard and disrupting traffic flow.",
    "duration": null,
    "summary": "A main water pipeline has burst near the Central Market Fountain, causing clean drinking water to flood the road.",
    "suggested_action": "Dispatch a water supply emergency repair team to isolate and fix the burst pipeline and divert traffic.",
    "confidence": 0.97,
    "needs_review": false,
    "status": "Assigned",
    "assigned_to": "Officer A. Iyer",
    "assigned_team_id": "WSB-01",
    "officer_notes": "Auto-assigned via rules",
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 61,
        "complaint_id": "CIV-00006",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 61,
        "complaint_id": "CIV-00006",
        "email_type": "lodged",
        "to_email": "kavita.rao@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0006",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00007",
    "raw_text": "Naali overflow ho rahi hai market road pe, dirty black water spreading in front of shops.",
    "citizen_name": "Rajesh Bansal",
    "citizen_email": "rajesh.b@example.com",
    "location_text": "Shop No 14, Central Market",
    "latitude": 28.6268,
    "longitude": 77.2176,
    "category": "Drainage",
    "issue_type": "Drainage Overflow",
    "department": "Drainage & Sewerage",
    "urgency": "High",
    "urgency_reason": "Dirty water overflowing onto the market road poses a health and safety risk to shoppers and shop owners.",
    "duration": null,
    "summary": "An overflowing drainage on Market Road near Shop No 14 in Central Market is releasing dirty black water onto the street in front of shops.",
    "suggested_action": "Dispatch a drainage cleaning crew to clear the blockage and pump out the water immediately.",
    "confidence": 0.97,
    "needs_review": false,
    "status": "New",
    "assigned_to": "Officer S. Chawla",
    "assigned_team_id": "DS-01",
    "officer_notes": null,
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 71,
        "complaint_id": "CIV-00007",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 71,
        "complaint_id": "CIV-00007",
        "email_type": "lodged",
        "to_email": "rajesh.b@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0007",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00008",
    "raw_text": "All 4 streetlights near circle are broken for past 10 days, pitch dark and unsafe for women.",
    "citizen_name": "Pooja Malhotra",
    "citizen_email": "pooja.m@example.com",
    "location_text": "Central Circle Bus Stop",
    "latitude": 28.626,
    "longitude": 77.2165,
    "category": "Streetlights & Electrical",
    "issue_type": "Broken Streetlights",
    "department": "Electrical & Street Lighting",
    "urgency": "High",
    "urgency_reason": "Dark conditions create a safety risk for pedestrians, especially women, increasing the potential for assaults.",
    "duration": "10 days",
    "summary": "Four streetlights near Central Circle Bus Stop have been non\u2011functional for the past ten days, leaving the area dark and unsafe.",
    "suggested_action": "Dispatch an electrical maintenance crew to inspect and repair the four streetlights immediately.",
    "confidence": 0.98,
    "needs_review": false,
    "status": "New",
    "assigned_to": "Officer D. Nair",
    "assigned_team_id": "ESL-02",
    "officer_notes": null,
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 81,
        "complaint_id": "CIV-00008",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 81,
        "complaint_id": "CIV-00008",
        "email_type": "lodged",
        "to_email": "pooja.m@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0008",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00009",
    "raw_text": "Deep potholes across the whole 200m stretch of Market Lane 3, cars bottoming out daily.",
    "citizen_name": "Anil Deshmukh",
    "citizen_email": "anil.d@example.com",
    "location_text": "Market Lane 3",
    "latitude": 28.6266,
    "longitude": 77.2168,
    "category": "Roads",
    "issue_type": "Deep Potholes",
    "department": "Public Works \u2013 Roads",
    "urgency": "High",
    "urgency_reason": "Vehicles are bottoming out daily, creating a significant risk of accidents and damage.",
    "duration": null,
    "summary": "Deep potholes spanning a 200\u2011meter stretch of Market Lane\u202f3 are causing vehicles to bottom out daily.",
    "suggested_action": "Dispatch a road repair crew to assess and fill the potholes on Market Lane\u202f3 immediately.",
    "confidence": 0.98,
    "needs_review": false,
    "status": "Resolved",
    "assigned_to": "Officer R. Sharma",
    "assigned_team_id": "PWD-R-01",
    "officer_notes": "Auto-assigned via rules",
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": "2026-10-09T15:00:00Z",
    "status_history": [
      {
        "id": 91,
        "complaint_id": "CIV-00009",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 91,
        "complaint_id": "CIV-00009",
        "email_type": "lodged",
        "to_email": "anil.d@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0009",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00010",
    "raw_text": "Sewage overflow near homes and primary school, children walking through contaminated water.",
    "citizen_name": "Meera Sen",
    "citizen_email": "meera.sen@example.com",
    "location_text": "Outside City Public School",
    "latitude": 28.5989,
    "longitude": 77.197,
    "category": "Drainage",
    "issue_type": "Sewage Overflow",
    "department": "Drainage & Sewerage",
    "urgency": "High",
    "urgency_reason": "Children are exposed to contaminated water, posing health and safety risks.",
    "duration": null,
    "summary": "Sewage water is overflowing near homes and the city public school, forcing children to walk through contaminated water.",
    "suggested_action": "Dispatch a drainage crew to assess and clear the overflow and provide temporary barriers or safe passage for children.",
    "confidence": 0.97,
    "needs_review": false,
    "status": "In Progress",
    "assigned_to": "Officer S. Chawla",
    "assigned_team_id": "DS-01",
    "officer_notes": "Auto-assigned via rules",
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 101,
        "complaint_id": "CIV-00010",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 101,
        "complaint_id": "CIV-00010",
        "email_type": "lodged",
        "to_email": "meera.sen@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0010",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00011",
    "raw_text": "Transformer sparking loudly with burning smell right next to children's park playground.",
    "citizen_name": "Deepak Nair",
    "citizen_email": "deepak.nair@example.com",
    "location_text": "Block C Children Park",
    "latitude": 28.5986,
    "longitude": 77.19720000000001,
    "category": "Streetlights & Electrical",
    "issue_type": "Sparking Transformer",
    "department": "Electrical & Street Lighting",
    "urgency": "Critical",
    "urgency_reason": "The sparking transformer poses an immediate fire and electrocution risk, especially with children nearby.",
    "duration": null,
    "summary": "A transformer is sparking loudly and emitting a burning smell right next to the children's park playground.",
    "suggested_action": "Send an electrical safety team to isolate, shut off power, and inspect the transformer immediately.",
    "confidence": 0.98,
    "needs_review": false,
    "status": "Assigned",
    "assigned_to": "Officer V. Kulkarni",
    "assigned_team_id": "ESL-01",
    "officer_notes": "Auto-assigned via rules",
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 111,
        "complaint_id": "CIV-00011",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 111,
        "complaint_id": "CIV-00011",
        "email_type": "lodged",
        "to_email": "deepak.nair@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0011",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00012",
    "raw_text": "Gutter cover broken, open hole right where school vans drop off children every morning.",
    "citizen_name": "Shalini Joshi",
    "citizen_email": "shalini.j@example.com",
    "location_text": "Block C Main Gate",
    "latitude": 28.5991,
    "longitude": 77.1967,
    "category": "Drainage",
    "issue_type": "Open Gutter",
    "department": "Drainage & Sewerage",
    "urgency": "High",
    "urgency_reason": "The open gutter poses a serious injury risk to children alighting school vans each morning.",
    "duration": null,
    "summary": "The gutter cover at Block C Main Gate is broken, leaving an open hole where school vans drop off children each morning.",
    "suggested_action": "Dispatch a drainage crew to replace the gutter cover and secure the opening immediately.",
    "confidence": 0.97,
    "needs_review": false,
    "status": "New",
    "assigned_to": "Officer S. Chawla",
    "assigned_team_id": "DS-01",
    "officer_notes": null,
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 121,
        "complaint_id": "CIV-00012",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 121,
        "complaint_id": "CIV-00012",
        "email_type": "lodged",
        "to_email": "shalini.j@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0012",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00013",
    "raw_text": "No drinking water supply in Block C apartments since 48 hours, overhead tanks completely dry.",
    "citizen_name": "Rohan Mehra",
    "citizen_email": "rohan.mehra@example.com",
    "location_text": "Block C Flats",
    "latitude": 28.5984,
    "longitude": 77.1965,
    "category": "Water Supply",
    "issue_type": "Water Supply Interruption",
    "department": "Water Supply Board",
    "urgency": "High",
    "urgency_reason": "Residents have been without drinking water for 48 hours, posing health and sanitation risks.",
    "duration": "48 hours",
    "summary": "Drinking water supply to Block C apartments has been unavailable for 48 hours, leaving overhead tanks completely dry.",
    "suggested_action": "Dispatch a water supply team to assess the blockage and restore water flow to Block C apartments immediately.",
    "confidence": 0.98,
    "needs_review": false,
    "status": "New",
    "assigned_to": "Officer A. Iyer",
    "assigned_team_id": "WSB-01",
    "officer_notes": null,
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 131,
        "complaint_id": "CIV-00013",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 131,
        "complaint_id": "CIV-00013",
        "email_type": "lodged",
        "to_email": "rohan.mehra@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0013",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00014",
    "raw_text": "Kachre ka dher pichle 1 hafte se pada hai school boundary wall ke pass, bache beemar pad rahe.",
    "citizen_name": "Suresh Yadav",
    "citizen_email": "suresh.yadav@example.com",
    "location_text": "Behind School Wall, Block C",
    "latitude": 28.5994,
    "longitude": 77.1975,
    "category": "Sanitation",
    "issue_type": "Garbage Dump",
    "department": "Sanitation & Solid Waste",
    "urgency": "High",
    "urgency_reason": "The garbage accumulation near the school is causing illness among children, posing a health hazard.",
    "duration": "1 week",
    "summary": "A garbage pile has been accumulating for the past week behind the school boundary wall in Block C, causing illness among children.",
    "suggested_action": "Dispatch a sanitation crew to remove the garbage pile, clean the area, and conduct a health inspection.",
    "confidence": 0.98,
    "needs_review": false,
    "status": "New",
    "assigned_to": "Officer M. Khan",
    "assigned_team_id": "SSW-01",
    "officer_notes": null,
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 141,
        "complaint_id": "CIV-00014",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 141,
        "complaint_id": "CIV-00014",
        "email_type": "lodged",
        "to_email": "suresh.yadav@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0014",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00015",
    "raw_text": "Road has sunk about 1 foot deep near school crossing, high risk of accident for school buses.",
    "citizen_name": "Priyanka Roy",
    "citizen_email": "priyanka.roy@example.com",
    "location_text": "School Crossing Junction",
    "latitude": 28.598100000000002,
    "longitude": 77.1968,
    "category": "Roads",
    "issue_type": "Sunken Road",
    "department": "Public Works \u2013 Roads",
    "urgency": "High",
    "urgency_reason": "The sunken section creates a substantial hazard that could cause accidents involving school buses and pedestrians.",
    "duration": null,
    "summary": "A section of the road near the school crossing junction has sunk about one foot deep, posing a high risk of accidents for school buses.",
    "suggested_action": "Dispatch a road repair crew to assess and fill the sunken section immediately.",
    "confidence": 0.98,
    "needs_review": false,
    "status": "Assigned",
    "assigned_to": "Officer R. Sharma",
    "assigned_team_id": "PWD-R-01",
    "officer_notes": "Auto-assigned via rules",
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 151,
        "complaint_id": "CIV-00015",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 151,
        "complaint_id": "CIV-00015",
        "email_type": "lodged",
        "to_email": "priyanka.roy@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0015",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00016",
    "raw_text": "Multiple street lamps dead along school perimeter road, very dark during early morning winter.",
    "citizen_name": "Arjun Singhal",
    "citizen_email": "arjun.s@example.com",
    "location_text": "Perimeter Road, Block C",
    "latitude": 28.599700000000002,
    "longitude": 77.19630000000001,
    "category": "Streetlights & Electrical",
    "issue_type": "Dead Streetlights",
    "department": "Electrical & Street Lighting",
    "urgency": "High",
    "urgency_reason": "The darkness creates a safety risk for students and pedestrians during early\u2011morning hours.",
    "duration": null,
    "summary": "Multiple street lamps along the school perimeter road in Block C are not functioning, leaving the area dark during early morning winter.",
    "suggested_action": "Dispatch an electrical maintenance crew to inspect and repair the non\u2011functional street lamps on the perimeter road promptly.",
    "confidence": 0.97,
    "needs_review": false,
    "status": "Resolved",
    "assigned_to": "Officer V. Kulkarni",
    "assigned_team_id": "ESL-01",
    "officer_notes": "Auto-assigned via rules",
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": "2026-10-09T15:00:00Z",
    "status_history": [
      {
        "id": 161,
        "complaint_id": "CIV-00016",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 161,
        "complaint_id": "CIV-00016",
        "email_type": "lodged",
        "to_email": "arjun.s@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0016",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00017",
    "raw_text": "Paani me bahut ganda mitti aur badboo aa rahi hai pichle teen din se, peene layak nahi hai.",
    "citizen_name": "Gita Devi",
    "citizen_email": "gita.devi@example.com",
    "location_text": "Sector 9 House 42",
    "latitude": 28.6359,
    "longitude": 77.191,
    "category": "Water Supply",
    "issue_type": "Contaminated Water",
    "department": "Water Supply Board",
    "urgency": "High",
    "urgency_reason": "The water is unsafe for drinking, posing health hazards to residents.",
    "duration": "3 days",
    "summary": "The water supply in Sector 9 House 42 has been dirty, smelly, and undrinkable for the past three days.",
    "suggested_action": "Dispatch a water quality testing team and provide alternative safe drinking water to the affected households.",
    "confidence": 0.97,
    "needs_review": false,
    "status": "New",
    "assigned_to": "Officer A. Iyer",
    "assigned_team_id": "WSB-01",
    "officer_notes": null,
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 171,
        "complaint_id": "CIV-00017",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 171,
        "complaint_id": "CIV-00017",
        "email_type": "lodged",
        "to_email": "gita.devi@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0017",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00018",
    "raw_text": "Bijli ka taar ped se ulajh kar toot gaya hai sadak par, barish ho sakti hai dhyan do jaldi.",
    "citizen_name": "Manoj Tiwari",
    "citizen_email": "manoj.t@example.com",
    "location_text": "Banyan Tree Chowk, Ward 12",
    "latitude": 28.5929,
    "longitude": 77.224,
    "category": "Streetlights & Electrical",
    "issue_type": "Broken electric wire",
    "department": "Electrical & Street Lighting",
    "urgency": "Critical",
    "urgency_reason": "Exposed live wire on the road poses immediate risk of electrocution, especially with impending rain.",
    "duration": null,
    "summary": "A broken electric wire tangled with a tree is lying on the road near Banyan Tree Chowk, Ward 12, posing a danger especially with upcoming rain.",
    "suggested_action": "Dispatch an electrical safety team to isolate and repair the live wire immediately.",
    "confidence": 0.97,
    "needs_review": false,
    "status": "Assigned",
    "assigned_to": "Officer V. Kulkarni",
    "assigned_team_id": "ESL-01",
    "officer_notes": "Auto-assigned via rules",
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 181,
        "complaint_id": "CIV-00018",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 181,
        "complaint_id": "CIV-00018",
        "email_type": "lodged",
        "to_email": "manoj.t@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0018",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00019",
    "raw_text": "Dustbin overflowed onto sidewalk, dogs tearing garbage bags into road near bus stop.",
    "citizen_name": "Tanvi Jain",
    "citizen_email": "tanvi.jain@example.com",
    "location_text": "Bus Stop, Sector 15",
    "latitude": 28.6319,
    "longitude": 77.23100000000001,
    "category": "Sanitation",
    "issue_type": "Dustbin Overflow",
    "department": "Sanitation & Solid Waste",
    "urgency": "Medium",
    "urgency_reason": "Litter on the sidewalk poses a health and cleanliness risk and can attract pests, though it does not present an immediate safety danger.",
    "duration": null,
    "summary": "A dustbin at the bus stop in Sector\u202f15 has overflowed onto the sidewalk, with dogs tearing garbage bags into the road.",
    "suggested_action": "Send a sanitation crew to empty the dustbin, clean the sidewalk, and secure the area to prevent further spillage.",
    "confidence": 0.96,
    "needs_review": false,
    "status": "New",
    "assigned_to": "Officer M. Khan",
    "assigned_team_id": "SSW-01",
    "officer_notes": null,
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 191,
        "complaint_id": "CIV-00019",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 191,
        "complaint_id": "CIV-00019",
        "email_type": "lodged",
        "to_email": "tanvi.jain@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0019",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00020",
    "raw_text": "Severe waterlogging outside district hospital emergency gate after rain, ambulances delayed.",
    "citizen_name": "Dr. Vinay Saxena",
    "citizen_email": "vinay.s@example.com",
    "location_text": "Civil Hospital Emergency Gate",
    "latitude": 28.6219,
    "longitude": 77.184,
    "category": "Drainage",
    "issue_type": "Severe Waterlogging",
    "department": "Drainage & Sewerage",
    "urgency": "High",
    "urgency_reason": "Ambulances are delayed, impacting emergency medical services at the hospital.",
    "duration": null,
    "summary": "Severe waterlogging has accumulated outside the district hospital emergency gate after rain, causing ambulance delays.",
    "suggested_action": "Dispatch a drainage crew to clear the water and improve drainage at the hospital emergency gate immediately.",
    "confidence": 0.96,
    "needs_review": false,
    "status": "In Progress",
    "assigned_to": "Officer S. Chawla",
    "assigned_team_id": "DS-01",
    "officer_notes": "Auto-assigned via rules",
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 201,
        "complaint_id": "CIV-00020",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 201,
        "complaint_id": "CIV-00020",
        "email_type": "lodged",
        "to_email": "vinay.s@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0020",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00021",
    "raw_text": "Nali choked with plastic bottles near community park, stagnant water breeding mosquitoes.",
    "citizen_name": "Smita Agarwal",
    "citizen_email": "smita.a@example.com",
    "location_text": "Rose Garden Community Park",
    "latitude": 28.6049,
    "longitude": 77.22800000000001,
    "category": "Drainage",
    "issue_type": "Clogged Drain",
    "department": "Drainage & Sewerage",
    "urgency": "High",
    "urgency_reason": "Stagnant water is breeding mosquitoes, creating a health risk for nearby residents.",
    "duration": null,
    "summary": "A drain near Rose Garden Community Park is clogged with plastic bottles, causing stagnant water and mosquito breeding.",
    "suggested_action": "Dispatch a drainage crew to remove the plastic debris, clean and disinfect the drain, and ensure proper water flow.",
    "confidence": 0.96,
    "needs_review": false,
    "status": "New",
    "assigned_to": "Officer K. Roy",
    "assigned_team_id": "DS-02",
    "officer_notes": null,
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 211,
        "complaint_id": "CIV-00021",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 211,
        "complaint_id": "CIV-00021",
        "email_type": "lodged",
        "to_email": "smita.a@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0021",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00022",
    "raw_text": "Speed breaker markings faded completely near blind curve on Ring Road link, bikes skidding.",
    "citizen_name": "Karthik Menon",
    "citizen_email": "karthik.m@example.com",
    "location_text": "Ring Road Link Curve",
    "latitude": 28.6449,
    "longitude": 77.205,
    "category": "Roads",
    "issue_type": "Faded Speedbreaker Markings",
    "department": "Public Works \u2013 Roads",
    "urgency": "High",
    "urgency_reason": "Faded markings on a blind curve increase the risk of accidents for cyclists and other vehicles.",
    "duration": null,
    "summary": "The speed breaker markings have completely faded near the blind curve on the Ring Road link, causing bikes to skid.",
    "suggested_action": "Dispatch road maintenance crew to repaint the speed breaker markings and assess visibility at the blind curve.",
    "confidence": 0.97,
    "needs_review": false,
    "status": "Resolved",
    "assigned_to": "Officer R. Sharma",
    "assigned_team_id": "PWD-R-01",
    "officer_notes": "Auto-assigned via rules",
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": "2026-10-09T15:00:00Z",
    "status_history": [
      {
        "id": 221,
        "complaint_id": "CIV-00022",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 221,
        "complaint_id": "CIV-00022",
        "email_type": "lodged",
        "to_email": "karthik.m@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0022",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00023",
    "raw_text": "Streetlight flickering like disco light for 2 weeks on 7th avenue, disturbing sleep.",
    "citizen_name": "Rita Fernandes",
    "citizen_email": "rita.f@example.com",
    "location_text": "7th Avenue, Plot 108",
    "latitude": 28.585900000000002,
    "longitude": 77.2,
    "category": "Streetlights & Electrical",
    "issue_type": "Flickering Streetlight",
    "department": "Electrical & Street Lighting",
    "urgency": "Medium",
    "urgency_reason": "The flickering streetlight is causing sleep disturbance and may reduce nighttime visibility, creating moderate inconvenience.",
    "duration": "2 weeks",
    "summary": "A streetlight on 7th Avenue, Plot 108 has been flickering like a disco light for two weeks, disturbing residents' sleep.",
    "suggested_action": "Dispatch an electrical maintenance crew to inspect and repair the faulty streetlight promptly.",
    "confidence": 0.98,
    "needs_review": false,
    "status": "New",
    "assigned_to": "Officer V. Kulkarni",
    "assigned_team_id": "ESL-01",
    "officer_notes": null,
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 231,
        "complaint_id": "CIV-00023",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 231,
        "complaint_id": "CIV-00023",
        "email_type": "lodged",
        "to_email": "rita.f@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0023",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00024",
    "raw_text": "Water valve leak on municipal main line wasting thousands of liters daily onto pavement.",
    "citizen_name": "Harish Pandey",
    "citizen_email": "harish.p@example.com",
    "location_text": "Near Water Tank No 3",
    "latitude": 28.617900000000002,
    "longitude": 77.238,
    "category": "Water Supply",
    "issue_type": "Valve Leak",
    "department": "Water Supply Board",
    "urgency": "High",
    "urgency_reason": "Thousands of liters are being lost each day, causing significant resource waste and potential supply impact.",
    "duration": null,
    "summary": "A municipal main line water valve is leaking, wasting thousands of liters daily onto the pavement near Water Tank No 3.",
    "suggested_action": "Send a water supply crew to locate and repair the leaking valve promptly.",
    "confidence": 0.97,
    "needs_review": false,
    "status": "Assigned",
    "assigned_to": "Officer A. Iyer",
    "assigned_team_id": "WSB-01",
    "officer_notes": "Auto-assigned via rules",
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 241,
        "complaint_id": "CIV-00024",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 241,
        "complaint_id": "CIV-00024",
        "email_type": "lodged",
        "to_email": "harish.p@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0024",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00025",
    "raw_text": "Dead dog lying on sidewalk since yesterday morning, urgently need disposal team.",
    "citizen_name": "Satish Chander",
    "citizen_email": "satish.c@example.com",
    "location_text": "Opposite Shiv Mandir",
    "latitude": 28.594900000000003,
    "longitude": 77.188,
    "category": "Sanitation",
    "issue_type": "Dead Animal",
    "department": "Sanitation & Solid Waste",
    "urgency": "High",
    "urgency_reason": "The decomposing carcass poses a health risk and foul odor to pedestrians.",
    "duration": "since yesterday morning",
    "summary": "A dead dog has been lying on the sidewalk opposite Shiv Mandir since yesterday morning, requiring prompt disposal.",
    "suggested_action": "Dispatch animal removal team to collect and dispose of the carcass safely.",
    "confidence": 0.98,
    "needs_review": false,
    "status": "In Progress",
    "assigned_to": "Officer M. Khan",
    "assigned_team_id": "SSW-01",
    "officer_notes": "Auto-assigned via rules",
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 251,
        "complaint_id": "CIV-00025",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 251,
        "complaint_id": "CIV-00025",
        "email_type": "lodged",
        "to_email": "satish.c@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0025",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00026",
    "raw_text": "Storm drain slab cracked in half under car tire weight, wheel trapped earlier today.",
    "citizen_name": "Farhan Akhtar",
    "citizen_email": "farhan.a@example.com",
    "location_text": "Main Colony Road, Sector 3",
    "latitude": 28.6279,
    "longitude": 77.193,
    "category": "Drainage",
    "issue_type": "Cracked Drain Slab",
    "department": "Drainage & Sewerage",
    "urgency": "High",
    "urgency_reason": "The cracked slab poses an immediate risk of vehicle damage and personal injury to motorists passing over it.",
    "duration": "earlier today",
    "summary": "A storm drain slab on Main Colony Road, Sector 3 is cracked in half, trapping a car tire as reported earlier today.",
    "suggested_action": "Send a drainage repair team to inspect and replace the damaged slab without delay.",
    "confidence": 0.97,
    "needs_review": false,
    "status": "New",
    "assigned_to": "Officer S. Chawla",
    "assigned_team_id": "DS-01",
    "officer_notes": null,
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 261,
        "complaint_id": "CIV-00026",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 261,
        "complaint_id": "CIV-00026",
        "email_type": "lodged",
        "to_email": "farhan.a@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0026",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00027",
    "raw_text": "Illegal banner tied to electric pole blocking traffic signal view completely.",
    "citizen_name": "Vandana Sethi",
    "citizen_email": "vandana.s@example.com",
    "location_text": "Crossroad Junction Signal",
    "latitude": 28.6079,
    "longitude": 77.221,
    "category": "Roads",
    "issue_type": "Signal Obstruction",
    "department": "Public Works \u2013 Roads",
    "urgency": "High",
    "urgency_reason": "The blocked view of the traffic signal creates a serious risk of accidents at the junction.",
    "duration": null,
    "summary": "An illegal banner is tied to an electric pole, completely blocking the view of the traffic signal at the Crossroad Junction.",
    "suggested_action": "Remove the banner immediately and inspect the pole for compliance with traffic safety regulations.",
    "confidence": 0.96,
    "needs_review": false,
    "status": "Resolved",
    "assigned_to": "Officer R. Sharma",
    "assigned_team_id": "PWD-R-01",
    "officer_notes": "Auto-assigned via rules",
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": "2026-10-09T15:00:00Z",
    "status_history": [
      {
        "id": 271,
        "complaint_id": "CIV-00027",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 271,
        "complaint_id": "CIV-00027",
        "email_type": "lodged",
        "to_email": "vandana.s@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0027",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00028",
    "raw_text": "Loud loudspeaker noise from private venue without permission late at night.",
    "citizen_name": "Nitin Goel",
    "citizen_email": "nitin.g@example.com",
    "location_text": "Town Hall Lane",
    "latitude": 28.614900000000002,
    "longitude": 77.20100000000001,
    "category": "Other",
    "issue_type": "Noise Disturbance",
    "department": "General Administration",
    "urgency": "Low",
    "urgency_reason": "The noise is a nuisance but does not pose an immediate safety risk.",
    "duration": null,
    "summary": "A private venue is playing loudspeaker music late at night without permission, causing disturbance.",
    "suggested_action": "Dispatch an enforcement officer to the venue to assess the noise and issue a violation notice if needed.",
    "confidence": 0.96,
    "needs_review": true,
    "status": "Resolved",
    "assigned_to": "Officer Ananya Sen",
    "assigned_team_id": "GEN-01",
    "officer_notes": "Auto-assigned via rules",
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": "2026-10-09T15:00:00Z",
    "status_history": [
      {
        "id": 281,
        "complaint_id": "CIV-00028",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 281,
        "complaint_id": "CIV-00028",
        "email_type": "lodged",
        "to_email": "nitin.g@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0028",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00029",
    "raw_text": "Potholes filled with loose gravel during rains, two wheeler rider fell and got knee injury.",
    "citizen_name": "Gaurav Bhatt",
    "citizen_email": "gaurav.b@example.com",
    "location_text": "Railway Underpass Road",
    "latitude": 28.6399,
    "longitude": 77.218,
    "category": "Roads",
    "issue_type": "Pothole",
    "department": "Public Works \u2013 Roads",
    "urgency": "High",
    "urgency_reason": "A rider fell into the pothole and sustained a knee injury, indicating a significant safety hazard.",
    "duration": null,
    "summary": "Potholes filled with loose gravel on Railway Underpass Road caused a two-wheeler rider to fall and sustain a knee injury.",
    "suggested_action": "Dispatch a road repair crew to fill and level the potholes and improve drainage to prevent further accidents.",
    "confidence": 0.97,
    "needs_review": false,
    "status": "In Progress",
    "assigned_to": "Officer R. Sharma",
    "assigned_team_id": "PWD-R-01",
    "officer_notes": "Auto-assigned via rules",
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 291,
        "complaint_id": "CIV-00029",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 291,
        "complaint_id": "CIV-00029",
        "email_type": "lodged",
        "to_email": "gaurav.b@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0029",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00030",
    "raw_text": "Drinking water smells strongly of sewage in entire lane of 15 houses, severe sickness risk.",
    "citizen_name": "Usha Krishnan",
    "citizen_email": "usha.k@example.com",
    "location_text": "Lane 4, Gandhi Colony",
    "latitude": 28.6029,
    "longitude": 77.215,
    "category": "Water Supply",
    "issue_type": "Contaminated Water",
    "department": "Water Supply Board",
    "urgency": "High",
    "urgency_reason": "The sewage-like smell in drinking water poses a severe sickness risk to residents.",
    "duration": null,
    "summary": "Drinking water in Lane 4, Gandhi Colony smells strongly of sewage, posing a severe sickness risk.",
    "suggested_action": "Dispatch a water quality team to test and remediate the supply line in the affected lane.",
    "confidence": 0.97,
    "needs_review": false,
    "status": "New",
    "assigned_to": "Officer A. Iyer",
    "assigned_team_id": "WSB-01",
    "officer_notes": null,
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 301,
        "complaint_id": "CIV-00030",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 301,
        "complaint_id": "CIV-00030",
        "email_type": "lodged",
        "to_email": "usha.k@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0030",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00031",
    "raw_text": "Public park benches vandalized and broken glass spread on walking track.",
    "citizen_name": "Dinesh Kulkarni",
    "citizen_email": "dinesh.k@example.com",
    "location_text": "Netaji Subhash Park",
    "latitude": 28.6329,
    "longitude": 77.20700000000001,
    "category": "Other",
    "issue_type": "Vandalized Benches",
    "department": "General Administration",
    "urgency": "High",
    "urgency_reason": "The scattered broken glass poses a significant injury risk to park visitors.",
    "duration": null,
    "summary": "Park benches have been vandalized and broken glass is scattered on the walking track at Netaji Subhash Park.",
    "suggested_action": "Dispatch sanitation crew to clear the glass and repair the benches, and notify police to investigate the vandalism.",
    "confidence": 0.96,
    "needs_review": true,
    "status": "New",
    "assigned_to": "Officer Ananya Sen",
    "assigned_team_id": "GEN-01",
    "officer_notes": null,
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 311,
        "complaint_id": "CIV-00031",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 311,
        "complaint_id": "CIV-00031",
        "email_type": "lodged",
        "to_email": "dinesh.k@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0031",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00032",
    "raw_text": "Construction debris and cement dumped on footpath blocking pedestrian ramp.",
    "citizen_name": "Simran Kaur",
    "citizen_email": "simran.k@example.com",
    "location_text": "Outer Ring Footpath, Plot 5",
    "latitude": 28.5899,
    "longitude": 77.211,
    "category": "Sanitation",
    "issue_type": "Construction Debris",
    "department": "Sanitation & Solid Waste",
    "urgency": "High",
    "urgency_reason": "Blocks pedestrian ramp, posing injury risk to walkers and disabled persons.",
    "duration": null,
    "summary": "Construction debris and cement have been dumped on the footpath, blocking the pedestrian ramp at Outer Ring Footpath, Plot 5.",
    "suggested_action": "Dispatch sanitation crew to clear the debris and enforce anti\u2011dumping regulations.",
    "confidence": 0.97,
    "needs_review": false,
    "status": "New",
    "assigned_to": "Officer M. Khan",
    "assigned_team_id": "SSW-01",
    "officer_notes": null,
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 321,
        "complaint_id": "CIV-00032",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 321,
        "complaint_id": "CIV-00032",
        "email_type": "lodged",
        "to_email": "simran.k@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0032",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00033",
    "raw_text": "Water pipeline burst creating a fountain 10 feet high, eroding road foundation.",
    "citizen_name": "Ananya Sen",
    "citizen_email": "ananya.s@example.com",
    "location_text": "Near Flyover Pillar 44",
    "latitude": 28.6299,
    "longitude": 77.226,
    "category": "Water Supply",
    "issue_type": "Pipeline Burst",
    "department": "Water Supply Board",
    "urgency": "High",
    "urgency_reason": "The burst is creating a 10\u2011foot fountain and eroding the road foundation, posing a significant safety hazard and potential road collapse.",
    "duration": null,
    "summary": "A water pipeline has burst, spewing water up to ten feet high and damaging the road foundation near Flyover Pillar 44.",
    "suggested_action": "Send an emergency water supply crew to shut off the line, repair the burst pipe, and assess the road foundation for immediate stabilization.",
    "confidence": 0.97,
    "needs_review": false,
    "status": "Assigned",
    "assigned_to": "Officer A. Iyer",
    "assigned_team_id": "WSB-01",
    "officer_notes": "Auto-assigned via rules",
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 331,
        "complaint_id": "CIV-00033",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 331,
        "complaint_id": "CIV-00033",
        "email_type": "lodged",
        "to_email": "ananya.s@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0033",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00034",
    "raw_text": "Streetlight pole bent at 45 degree angle after vehicle hit, resting precariously on tree branch.",
    "citizen_name": "Bhavesh Dave",
    "citizen_email": "bhavesh.d@example.com",
    "location_text": "Old Post Office Road",
    "latitude": 28.6109,
    "longitude": 77.19500000000001,
    "category": "Streetlights & Electrical",
    "issue_type": "Bent Streetlight Pole",
    "department": "Electrical & Street Lighting",
    "urgency": "High",
    "urgency_reason": "The tilted pole poses a substantial risk of falling and injuring pedestrians or vehicles.",
    "duration": null,
    "summary": "A streetlight pole was hit by a vehicle and is now bent at a 45\u2011degree angle, precariously resting on a tree branch.",
    "suggested_action": "Send an electrical crew to secure the pole, assess structural integrity, and straighten or replace it as needed.",
    "confidence": 0.97,
    "needs_review": false,
    "status": "In Progress",
    "assigned_to": "Officer V. Kulkarni",
    "assigned_team_id": "ESL-01",
    "officer_notes": "Auto-assigned via rules",
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 341,
        "complaint_id": "CIV-00034",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 341,
        "complaint_id": "CIV-00034",
        "email_type": "lodged",
        "to_email": "bhavesh.d@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0034",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00035",
    "raw_text": "Public toilet complex locked and overflowing sewage into lane for past 3 days.",
    "citizen_name": "Lata Mangesh",
    "citizen_email": "lata.m@example.com",
    "location_text": "Near Daily Sabzi Mandi",
    "latitude": 28.6419,
    "longitude": 77.223,
    "category": "Sanitation",
    "issue_type": "Sewage Overflow",
    "department": "Sanitation & Solid Waste",
    "urgency": "High",
    "urgency_reason": "The overflowing sewage creates a health hazard and contaminates the public lane, posing a substantial risk to residents.",
    "duration": "3 days",
    "summary": "A public toilet complex is locked and has been overflowing sewage onto the lane for the past three days.",
    "suggested_action": "Send a sanitation crew to unlock the facility, clear the blockage, clean the overflow area, and disinfect the lane.",
    "confidence": 0.98,
    "needs_review": false,
    "status": "New",
    "assigned_to": "Officer M. Khan",
    "assigned_team_id": "SSW-01",
    "officer_notes": null,
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 351,
        "complaint_id": "CIV-00035",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 351,
        "complaint_id": "CIV-00035",
        "email_type": "lodged",
        "to_email": "lata.m@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0035",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00036",
    "raw_text": "There is a massive pothole somewhere along the highway bypass near the toll gate.",
    "citizen_name": "Jaspreet Singh",
    "citizen_email": "jaspreet.s@example.com",
    "location_text": null,
    "latitude": null,
    "longitude": null,
    "category": "Roads",
    "issue_type": "Pothole",
    "department": "Public Works \u2013 Roads",
    "urgency": "High",
    "urgency_reason": "The pothole poses a significant risk of vehicle damage and accidents on a busy highway bypass.",
    "duration": null,
    "summary": "A massive pothole has formed on the highway bypass near the toll gate.",
    "suggested_action": "Dispatch a road repair crew to assess and fill the pothole promptly.",
    "confidence": 0.97,
    "needs_review": false,
    "status": "New",
    "assigned_to": "Officer R. Sharma",
    "assigned_team_id": "PWD-R-01",
    "officer_notes": null,
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 361,
        "complaint_id": "CIV-00036",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 361,
        "complaint_id": "CIV-00036",
        "email_type": "lodged",
        "to_email": "jaspreet.s@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0036",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00037",
    "raw_text": "Garbage collector has not visited our entire block for past 10 days.",
    "citizen_name": "Pratibha Das",
    "citizen_email": "pratibha.d@example.com",
    "location_text": null,
    "latitude": null,
    "longitude": null,
    "category": "Sanitation",
    "issue_type": "Missed Garbage Collection",
    "department": "Sanitation & Solid Waste",
    "urgency": "High",
    "urgency_reason": "Garbage has not been collected for 10 days, creating potential health and sanitation hazards.",
    "duration": "10 days",
    "summary": "Garbage collection has not occurred for the entire block for the past ten days.",
    "suggested_action": "Dispatch a sanitation crew to collect the accumulated waste and schedule regular pickups for the block.",
    "confidence": 0.97,
    "needs_review": false,
    "status": "New",
    "assigned_to": "Officer M. Khan",
    "assigned_team_id": "SSW-01",
    "officer_notes": null,
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 371,
        "complaint_id": "CIV-00037",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 371,
        "complaint_id": "CIV-00037",
        "email_type": "lodged",
        "to_email": "pratibha.d@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0037",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00038",
    "raw_text": "Water pressure is too low to fill buckets on top floor apartments.",
    "citizen_name": "Sanjay Kapoor",
    "citizen_email": "sanjay.k@example.com",
    "location_text": null,
    "latitude": null,
    "longitude": null,
    "category": "Water Supply",
    "issue_type": "Low Water Pressure",
    "department": "Water Supply Board",
    "urgency": "Medium",
    "urgency_reason": "Residents cannot obtain sufficient water for daily use, causing inconvenience.",
    "duration": null,
    "summary": "Water pressure in the building is too low to fill buckets on top\u2011floor apartments.",
    "suggested_action": "Inspect and adjust the water supply pressure for the affected building.",
    "confidence": 0.96,
    "needs_review": false,
    "status": "Assigned",
    "assigned_to": "Officer A. Iyer",
    "assigned_team_id": "WSB-01",
    "officer_notes": "Auto-assigned via rules",
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 381,
        "complaint_id": "CIV-00038",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 381,
        "complaint_id": "CIV-00038",
        "email_type": "lodged",
        "to_email": "sanjay.k@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0038",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00039",
    "raw_text": "Open electrical junction box with uncovered wires at children eye level near park entry.",
    "citizen_name": "Alok Mishra",
    "citizen_email": "alok.m@example.com",
    "location_text": null,
    "latitude": null,
    "longitude": null,
    "category": "Streetlights & Electrical",
    "issue_type": "Exposed Wires",
    "department": "Electrical & Street Lighting",
    "urgency": "Critical",
    "urgency_reason": "Live exposed wires at child height pose immediate risk of electrocution.",
    "duration": null,
    "summary": "An open electrical junction box with uncovered wires is located at the park entry at children\u2019s eye level.",
    "suggested_action": "Dispatch the electrical safety team to isolate power and secure the junction box immediately.",
    "confidence": 0.98,
    "needs_review": false,
    "status": "New",
    "assigned_to": "Officer V. Kulkarni",
    "assigned_team_id": "ESL-01",
    "officer_notes": null,
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": null,
    "status_history": [
      {
        "id": 391,
        "complaint_id": "CIV-00039",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 391,
        "complaint_id": "CIV-00039",
        "email_type": "lodged",
        "to_email": "alok.m@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0039",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  },
  {
    "id": "CIV-00040",
    "raw_text": "Blocked sewer causing backflow into ground floor bathrooms in colony.",
    "citizen_name": "Bina Chatterjee",
    "citizen_email": "bina.c@example.com",
    "location_text": null,
    "latitude": null,
    "longitude": null,
    "category": "Drainage",
    "issue_type": "Blocked Sewer",
    "department": "Drainage & Sewerage",
    "urgency": "High",
    "urgency_reason": "Backflow poses health risks and can damage property.",
    "duration": null,
    "summary": "A blocked sewer is causing backflow into ground\u2011floor bathrooms in the colony.",
    "suggested_action": "Dispatch a drainage crew to inspect and clear the blockage promptly.",
    "confidence": 0.97,
    "needs_review": false,
    "status": "Resolved",
    "assigned_to": "Officer S. Chawla",
    "assigned_team_id": "DS-01",
    "officer_notes": "Auto-assigned via rules",
    "photo_path": null,
    "ai_source": "rule_fallback",
    "is_demo": true,
    "reopen_count": 0,
    "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T12:00:00Z",
    "resolved_at": "2026-10-09T15:00:00Z",
    "status_history": [
      {
        "id": 401,
        "complaint_id": "CIV-00040",
        "from_status": null,
        "to_status": "New",
        "actor": "Citizen System",
        "notes": "Complaint lodged by citizen",
        "changed_at": "2026-10-09T10:00:00Z"
      }
    ],
    "email_logs": [
      {
        "id": 401,
        "complaint_id": "CIV-00040",
        "email_type": "lodged",
        "to_email": "bina.c@example.com",
        "status": "sent",
        "error": null,
        "provider_id": "resend_msg_0040",
        "sent_at": "2026-10-09T10:00:02Z"
      }
    ]
  }
];

export function computeStats(list: Complaint[]): StatsData {
  const by_category: Record<string, number> = {
    Roads: 0,
    Sanitation: 0,
    'Water Supply': 0,
    Drainage: 0,
    'Streetlights & Electrical': 0,
    Other: 0
  };
  const by_urgency: Record<string, number> = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0
  };
  const by_status: Record<string, number> = {
    New: 0,
    Assigned: 0,
    'In Progress': 0,
    Resolved: 0,
    Reopened: 0,
    Closed: 0
  };

  let critical_open = 0;
  let resolved = 0;
  let needs_review_count = 0;
  let unmapped_count = 0;

  for (const c of list) {
    if (by_category[c.category] !== undefined) by_category[c.category]++;
    else by_category[c.category] = 1;

    if (by_urgency[c.urgency] !== undefined) by_urgency[c.urgency]++;
    else by_urgency[c.urgency] = 1;

    if (by_status[c.status] !== undefined) by_status[c.status]++;
    else by_status[c.status] = 1;

    if (c.urgency === 'Critical' && c.status !== 'Resolved' && c.status !== 'Closed') {
      critical_open++;
    }
    if (c.status === 'Resolved') {
      resolved++;
    }
    if (c.needs_review) {
      needs_review_count++;
    }
    if (!c.latitude || !c.longitude) {
      unmapped_count++;
    }
  }

  return {
    total: list.length,
    critical_open,
    new_today: list.filter(c => c.status === 'New').length,
    resolved,
    by_category,
    by_urgency,
    by_status,
    needs_review_count,
    unmapped_count
  };
}

export function computeMapItems(list: Complaint[], includeResolved: boolean = true): ComplaintMapItem[] {
  return list
    .filter(c => c.latitude !== null && c.longitude !== null && (includeResolved || c.status !== 'Resolved'))
    .map(c => ({
      id: c.id,
      latitude: c.latitude,
      longitude: c.longitude,
      urgency: c.urgency,
      category: c.category as any,
      status: c.status as any,
      summary: c.summary,
      issue_type: c.issue_type,
      created_at: c.created_at
    }));
}
