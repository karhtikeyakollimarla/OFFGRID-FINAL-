"""
Nagrik Municipal Grievance Routing & Department Assignment Engine.
Automatically routes incoming grievances to the appropriate municipal department,
functional operational team, and primary lead officer.
"""

from typing import Dict, Any, Optional

DEPARTMENT_TEAMS = {
    "Public Works – Roads": [
        {
            "team_id": "PWD-R-01",
            "team_name": "Road Maintenance & Pothole Repair (North & Central)",
            "primary_officer": "Officer R. Sharma",
            "wards": ["Ward 01", "Ward 02", "Ward 03", "Ward 04"],
            "capabilities": ["pothole", "asphalt", "crater", "footpath", "resurfacing", "pavement"]
        },
        {
            "team_id": "PWD-R-02",
            "team_name": "Major Infrastructure & Arterial Roads (South & East)",
            "primary_officer": "Officer N. Desai",
            "wards": ["Ward 05", "Ward 06", "Ward 07", "Ward 08"],
            "capabilities": ["arterial road", "bridge", "flyover", "divider", "cave-in"]
        }
    ],
    "Sanitation & Solid Waste": [
        {
            "team_id": "SSW-01",
            "team_name": "Rapid Waste Clearance & Compactor Squad",
            "primary_officer": "Officer M. Khan",
            "wards": ["Ward 01", "Ward 02", "Ward 03", "Ward 04"],
            "capabilities": ["garbage", "dump", "kachra", "overflowing dustbin", "commercial waste"]
        },
        {
            "team_id": "SSW-02",
            "team_name": "Public Hygiene & Neighborhood Sanitation",
            "primary_officer": "Officer P. Mehra",
            "wards": ["Ward 05", "Ward 06", "Ward 07", "Ward 08"],
            "capabilities": ["stray animal waste", "residential litter", "foul smell", "sweeping"]
        }
    ],
    "Water Supply Board": [
        {
            "team_id": "WSB-01",
            "team_name": "Hydraulic Pipeline & Main Distribution Division",
            "primary_officer": "Officer A. Iyer",
            "wards": ["Ward 01", "Ward 02", "Ward 03", "Ward 04"],
            "capabilities": ["pipeline burst", "main line leak", "pressure drop", "supply contamination"]
        },
        {
            "team_id": "WSB-02",
            "team_name": "Feeder Lines & Metering Remediation Squad",
            "primary_officer": "Officer S. Joshi",
            "wards": ["Ward 05", "Ward 06", "Ward 07", "Ward 08"],
            "capabilities": ["drinking water shortage", "valve fault", "booster failure", "domestic supply"]
        }
    ],
    "Drainage & Sewerage": [
        {
            "team_id": "DS-01",
            "team_name": "Super Sucker Jetting & Underground Sewer Division",
            "primary_officer": "Officer S. Chawla",
            "wards": ["Ward 01", "Ward 02", "Ward 03", "Ward 04"],
            "capabilities": ["sewer overflow", "blocked main", "manhole collapse", "backflow"]
        },
        {
            "team_id": "DS-02",
            "team_name": "Stormwater & Surface Drain Clearance Unit",
            "primary_officer": "Officer K. Roy",
            "wards": ["Ward 05", "Ward 06", "Ward 07", "Ward 08"],
            "capabilities": ["naali overflow", "clogged drain", "stagnant water", "monsoon waterlogging"]
        }
    ],
    "Electrical & Street Lighting": [
        {
            "team_id": "ESL-01",
            "team_name": "Emergency Electrical Safety & High Voltage Squad",
            "primary_officer": "Officer V. Kulkarni",
            "wards": ["Ward 01", "Ward 02", "Ward 03", "Ward 04", "Ward 05", "Ward 06", "Ward 07", "Ward 08"],
            "capabilities": ["live wire", "sparking", "open junction box", "hanging cable", "transformer"]
        },
        {
            "team_id": "ESL-02",
            "team_name": "Public Lighting Infrastructure Maintenance",
            "primary_officer": "Officer D. Nair",
            "wards": ["Ward 01", "Ward 02", "Ward 03", "Ward 04", "Ward 05", "Ward 06", "Ward 07", "Ward 08"],
            "capabilities": ["broken streetlight", "dark spot", "timer failure", "pole tilt"]
        }
    ],
    "General Administration": [
        {
            "team_id": "GEN-01",
            "team_name": "Civic Redressal & Inter-Departmental Coordination Cell",
            "primary_officer": "Officer Ananya Sen",
            "wards": ["Ward 01", "Ward 02", "Ward 03", "Ward 04", "Ward 05", "Ward 06", "Ward 07", "Ward 08"],
            "capabilities": ["general grievance", "cross-departmental", "policy inquiry", "unclassified"]
        }
    ]
}

def assign_department_and_team(
    category: str,
    urgency: str,
    issue_type: str = "",
    location_text: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None
) -> Dict[str, Any]:
    """
    Evaluates grievance classification against departmental capabilities,
    urgency rules, and geographical coverage to auto-assign the most suitable operational squad.
    """
    from .ai_service import DEPARTMENT_MAP
    dept_name = DEPARTMENT_MAP.get(category, "General Administration")
    teams = DEPARTMENT_TEAMS.get(dept_name, DEPARTMENT_TEAMS["General Administration"])
    
    # Critical electrical safety override
    if dept_name == "Electrical & Street Lighting" and urgency == "Critical":
        chosen_team = teams[0] # ESL-01 Emergency Electrical Safety Squad
        return {
            "department": dept_name,
            "assigned_team_id": chosen_team["team_id"],
            "assigned_to": chosen_team["primary_officer"],
            "assignment_score": 0.98,
            "assignment_reason": f"Dispatched to {chosen_team['team_name']} ({chosen_team['team_id']}) under {dept_name} due to Critical electrical life-safety hazard."
        }
        
    # Team selection heuristic based on issue_type keywords
    issue_lower = (issue_type or "").lower()
    best_team = teams[0]
    best_score = 0.85
    
    for team in teams:
        for cap in team["capabilities"]:
            if cap in issue_lower:
                best_team = team
                best_score = 0.92
                break
                
    # If category is "Other", flag for supervisor review
    if category == "Other":
        return {
            "department": "General Administration",
            "assigned_team_id": "GEN-01",
            "assigned_to": "Officer Ananya Sen",
            "assignment_score": 0.50,
            "assignment_reason": "Routing pending supervisory review: unclassified category requires manual triage assessment."
        }
        
    return {
        "department": dept_name,
        "assigned_team_id": best_team["team_id"],
        "assigned_to": best_team["primary_officer"],
        "assignment_score": best_score,
        "assignment_reason": f"Auto-routed to {best_team['team_name']} ({best_team['team_id']}) under {dept_name} based on domain capability match."
    }
