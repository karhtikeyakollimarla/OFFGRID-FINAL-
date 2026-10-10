import os
import shutil
import logging
import secrets
import uuid
from datetime import datetime, date
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File, Form, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, case, or_, Integer, text

from .config import FRONTEND_URL, UPLOAD_DIR
from .database import engine, get_db, Base
from .models import Complaint, StatusHistory, EmailLog, Officer
from .schemas import (
    ComplaintCreate, ComplaintUpdate, ComplaintResponse,
    ComplaintMapItem, StatsResponse, ResendEmailRequest,
    ComplaintReopenRequest, ComplaintDismissRequest,
    OfficerLoginRequest, OfficerResponse, TokenResponse
)
from .analyzer import analyze_complaint
from .assignment import assign_department_and_team
from .geocoding import geocode_location
from .n8n_service import dispatch_n8n_event_sync
from .auth import (
    hash_password, verify_password, create_access_token,
    get_current_officer_optional, get_current_officer_required
)
from .email_service import (
    send_complaint_email,
    send_citizen_lodged_email,
    send_complaint_assigned_email,
    send_admin_new_complaint_notification,
    send_complaint_resolved_email,
    send_complaint_reopened_email,
    send_complaint_closed_email,
    send_safety_escalation_email
)
from .migrations import run_migrations

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nagrik.api")

# Initialize SQLite tables and safe additive migrations
Base.metadata.create_all(bind=engine)
run_migrations()

app = FastAPI(
    title="Nagrik API",
    description="Nagrik: AI-Powered Civic Grievance Management Platform",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount photo uploads directory if it exists
if UPLOAD_DIR.exists():
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.on_event("startup")
def startup_event():
    from .database import SessionLocal
    from .seed import seed_database
    db = SessionLocal()
    try:
        if db.query(Complaint).count() == 0:
            seed_database(db)
            logger.info("Auto-seeded initial civic complaint dataset on cold start.")
    except Exception as e:
        logger.warning(f"Startup auto-seed check: {e}")
    finally:
        db.close()

def generate_next_complaint_id(db: Session) -> str:
    """Generate sequential ID formatted as CIV-00001, CIV-00002, etc."""
    last_complaint = (
        db.query(Complaint)
        .filter(Complaint.id.like("CIV-%"))
        .order_by(desc(Complaint.id))
        .first()
    )
    if not last_complaint:
        return "CIV-00001"
    try:
        current_num = int(last_complaint.id.split("-")[1])
        return f"CIV-{current_num + 1:05d}"
    except (IndexError, ValueError):
        count = db.query(Complaint).count()
        return f"CIV-{count + 1:05d}"

def bg_send_email_task(complaint_id: str, email_type: str):
    """Background task to safely send and log emails with an independent DB session."""
    from .database import SessionLocal
    db = SessionLocal()
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if complaint:
            if email_type == "lodged":
                send_citizen_lodged_email(db, complaint)
                send_admin_new_complaint_notification(db, complaint)
            elif email_type == "assigned":
                send_complaint_assigned_email(db, complaint)
            elif email_type == "resolved":
                send_complaint_resolved_email(db, complaint)
            elif email_type == "reopened":
                send_complaint_reopened_email(db, complaint)
            elif email_type == "closed":
                send_complaint_closed_email(db, complaint)
            elif email_type == "escalation":
                send_safety_escalation_email(db, complaint)
            else:
                send_complaint_email(db, complaint, email_type)
    except Exception as e:
        logger.error(f"Error in background email task: {e}")
    finally:
        db.close()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# ----------------- HEALTH & SYSTEM ENDPOINTS -----------------

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    """Health readiness check verifying server and SQLite database connection."""
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"unhealthy: {e}"
    return {
        "status": "healthy",
        "service": "Nagrik API",
        "tagline": "Your City. Your Voice.",
        "version": "2.0.0",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat()
    }

# ----------------- OFFICER AUTHENTICATION -----------------

@app.post("/api/auth/login", response_model=TokenResponse)
def officer_login(payload: OfficerLoginRequest, db: Session = Depends(get_db)):
    """Authenticates municipal officer and issues a tamper-proof session token."""
    email_clean = payload.email.strip().lower()
    officer = db.query(Officer).filter(func.lower(Officer.email) == email_clean).first()
    if not officer or not verify_password(payload.password, officer.password_hash, officer.salt):
        raise HTTPException(status_code=401, detail="Invalid officer email or password.")
    if not officer.is_active:
        raise HTTPException(status_code=403, detail="Officer account is deactivated.")

    token = create_access_token({
        "email": officer.email,
        "role": officer.role,
        "name": officer.full_name,
        "dept": officer.department
    })
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        officer=OfficerResponse.model_validate(officer)
    )

@app.get("/api/auth/me", response_model=OfficerResponse)
def get_current_officer_profile(officer: Officer = Depends(get_current_officer_required)):
    """Retrieves active officer session profile."""
    return officer

@app.get("/api/auth/officers", response_model=List[OfficerResponse])
def list_available_officers(db: Session = Depends(get_db)):
    """Lists registered municipal officers for verification and environment switching."""
    return db.query(Officer).filter(Officer.is_active == True).all()

# ----------------- COMPLAINT SUBMISSION -----------------

@app.post("/api/complaints", response_model=ComplaintResponse)
async def create_complaint(
    background_tasks: BackgroundTasks,
    raw_text: str = Form(...),
    citizen_name: str = Form(...),
    citizen_email: str = Form(...),
    location_text: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # 1. Evidence upload handling with strict security controls
    photo_path = None
    if photo and photo.filename:
        ext = Path(photo.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file extension '{ext}'. Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )
        
        file_content = await photo.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="Evidence file exceeds the maximum 10MB limit.")
            
        # Magic header byte validation
        is_valid_magic = (
            file_content.startswith(b"\xff\xd8") or # JPEG
            file_content.startswith(b"\x89PNG") or # PNG
            file_content.startswith(b"GIF8") or # GIF
            file_content.startswith(b"%PDF") or # PDF
            (file_content.startswith(b"RIFF") and b"WEBP" in file_content[:16]) # WEBP
        )
        if not is_valid_magic:
            raise HTTPException(status_code=400, detail="Invalid file contents: file does not match allowed image or PDF format.")

        safe_filename = f"{uuid.uuid4().hex}{ext}"
        dest_file = UPLOAD_DIR / safe_filename
        with open(dest_file, "wb") as f:
            f.write(file_content)
        photo_path = f"/uploads/{safe_filename}"

    # 2. AI Analysis (with safety rules & fallback)
    loc_hint = location_text or None
    analysis = analyze_complaint(raw_text, loc_hint)

    # 3. Geocoding priority
    final_lat = latitude
    final_lng = longitude
    resolved_loc_text = location_text or analysis.get("location_text")

    if (final_lat is None or final_lng is None) and resolved_loc_text:
        geo_lat, geo_lng = geocode_location(resolved_loc_text)
        if geo_lat is not None and geo_lng is not None:
            final_lat = geo_lat
            final_lng = geo_lng

    # 4. Department and operational team auto-assignment
    assignment = assign_department_and_team(
        category=analysis["category"],
        urgency=analysis["urgency"],
        issue_type=analysis["issue_type"],
        location_text=resolved_loc_text,
        lat=final_lat,
        lng=final_lng
    )

    # 5. Generate unique IDs and secure tracking token
    complaint_id = generate_next_complaint_id(db)
    tracking_token = f"tr_{secrets.token_urlsafe(18)}"

    # Determine initial workflow status
    initial_status = "Assigned" if not analysis["needs_review"] else "New"

    complaint = Complaint(
        id=complaint_id,
        raw_text=raw_text.strip(),
        citizen_name=citizen_name.strip(),
        citizen_email=citizen_email.strip(),
        location_text=resolved_loc_text,
        latitude=final_lat,
        longitude=final_lng,
        category=analysis["category"],
        issue_type=analysis["issue_type"],
        department=assignment["department"],
        urgency=analysis["urgency"],
        urgency_reason=analysis["urgency_reason"],
        duration=analysis.get("duration"),
        summary=analysis["summary"],
        suggested_action=analysis["suggested_action"],
        confidence=analysis["confidence"],
        needs_review=analysis["needs_review"],
        status=initial_status,
        assigned_to=assignment["assigned_to"],
        assigned_team_id=assignment["assigned_team_id"],
        assignment_score=assignment["assignment_score"],
        assignment_reason=assignment["assignment_reason"],
        officer_notes=None,
        photo_path=photo_path,
        ai_source=analysis["ai_source"],
        tracking_token=tracking_token,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(complaint)

    # 6. Record initial status history
    hist1 = StatusHistory(
        complaint_id=complaint_id,
        from_status=None,
        to_status="New",
        actor="Citizen (Public Portal)",
        notes="Grievance logged via citizen portal",
        changed_at=datetime.utcnow()
    )
    db.add(hist1)

    if initial_status == "Assigned":
        hist2 = StatusHistory(
            complaint_id=complaint_id,
            from_status="New",
            to_status="Assigned",
            actor="Nagrik Dispatch Engine",
            notes=assignment["assignment_reason"],
            changed_at=datetime.utcnow()
        )
        db.add(hist2)

    db.commit()
    db.refresh(complaint)

    # 7. Queue asynchronous notifications and optional n8n automation
    background_tasks.add_task(bg_send_email_task, complaint_id, "lodged")
    if initial_status == "Assigned":
        background_tasks.add_task(bg_send_email_task, complaint_id, "assigned")
    if analysis["urgency"] == "Critical":
        background_tasks.add_task(bg_send_email_task, complaint_id, "escalation")

    complaint_summary = {
        "id": complaint.id,
        "category": complaint.category,
        "department": complaint.department,
        "urgency": complaint.urgency,
        "summary": complaint.summary,
        "location": complaint.location_text,
        "assigned_to": complaint.assigned_to,
        "needs_review": complaint.needs_review
    }
    background_tasks.add_task(dispatch_n8n_event_sync, "complaint_created", complaint_summary)
    if analysis["urgency"] == "Critical":
        background_tasks.add_task(dispatch_n8n_event_sync, "critical_safety_escalation", complaint_summary)

    return complaint

@app.post("/api/complaints/json", response_model=ComplaintResponse)
async def create_complaint_json(
    payload: ComplaintCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    loc_hint = payload.location_text or None
    analysis = analyze_complaint(payload.raw_text, loc_hint)

    final_lat = payload.latitude
    final_lng = payload.longitude
    resolved_loc_text = payload.location_text or analysis.get("location_text")

    if (final_lat is None or final_lng is None) and resolved_loc_text:
        geo_lat, geo_lng = geocode_location(resolved_loc_text)
        if geo_lat is not None and geo_lng is not None:
            final_lat = geo_lat
            final_lng = geo_lng

    assignment = assign_department_and_team(
        category=analysis["category"],
        urgency=analysis["urgency"],
        issue_type=analysis["issue_type"],
        location_text=resolved_loc_text,
        lat=final_lat,
        lng=final_lng
    )

    complaint_id = generate_next_complaint_id(db)
    tracking_token = f"tr_{secrets.token_urlsafe(18)}"
    initial_status = "Assigned" if not analysis["needs_review"] else "New"

    complaint = Complaint(
        id=complaint_id,
        raw_text=payload.raw_text.strip(),
        citizen_name=payload.citizen_name.strip(),
        citizen_email=payload.citizen_email.strip(),
        location_text=resolved_loc_text,
        latitude=final_lat,
        longitude=final_lng,
        category=analysis["category"],
        issue_type=analysis["issue_type"],
        department=assignment["department"],
        urgency=analysis["urgency"],
        urgency_reason=analysis["urgency_reason"],
        duration=analysis.get("duration"),
        summary=analysis["summary"],
        suggested_action=analysis["suggested_action"],
        confidence=analysis["confidence"],
        needs_review=analysis["needs_review"],
        status=initial_status,
        assigned_to=assignment["assigned_to"],
        assigned_team_id=assignment["assigned_team_id"],
        assignment_score=assignment["assignment_score"],
        assignment_reason=assignment["assignment_reason"],
        officer_notes=None,
        photo_path=None,
        ai_source=analysis["ai_source"],
        tracking_token=tracking_token,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(complaint)

    hist1 = StatusHistory(
        complaint_id=complaint_id,
        from_status=None,
        to_status="New",
        actor="Citizen (Public Portal)",
        notes="Grievance logged via citizen portal",
        changed_at=datetime.utcnow()
    )
    db.add(hist1)

    if initial_status == "Assigned":
        hist2 = StatusHistory(
            complaint_id=complaint_id,
            from_status="New",
            to_status="Assigned",
            actor="Nagrik Dispatch Engine",
            notes=assignment["assignment_reason"],
            changed_at=datetime.utcnow()
        )
        db.add(hist2)

    db.commit()
    db.refresh(complaint)

    background_tasks.add_task(bg_send_email_task, complaint_id, "lodged")
    if initial_status == "Assigned":
        background_tasks.add_task(bg_send_email_task, complaint_id, "assigned")
    if analysis["urgency"] == "Critical":
        background_tasks.add_task(bg_send_email_task, complaint_id, "escalation")

    complaint_summary = {
        "id": complaint.id,
        "category": complaint.category,
        "department": complaint.department,
        "urgency": complaint.urgency,
        "summary": complaint.summary,
        "location": complaint.location_text,
        "assigned_to": complaint.assigned_to,
        "needs_review": complaint.needs_review
    }
    background_tasks.add_task(dispatch_n8n_event_sync, "complaint_created", complaint_summary)
    if analysis["urgency"] == "Critical":
        background_tasks.add_task(dispatch_n8n_event_sync, "critical_safety_escalation", complaint_summary)

    return complaint

# ----------------- SECURE CITIZEN TRACKING -----------------

@app.get("/api/track/{identifier}")
def track_complaint(
    identifier: str,
    email: Optional[str] = Query(None),
    token: Optional[str] = Query(None),
    current_officer: Optional[Officer] = Depends(get_current_officer_optional),
    db: Session = Depends(get_db)
):
    """
    Secure public tracking endpoint.
    Retrieves case status by Tracking Token or Ticket ID.
    Masks private citizen contact info unless verified by secure token, citizen email, or active officer session.
    """
    clean_id = identifier.strip()
    complaint = (
        db.query(Complaint)
        .filter(or_(Complaint.tracking_token == clean_id, Complaint.id == clean_id))
        .first()
    )
    if not complaint:
        raise HTTPException(
            status_code=404,
            detail=f"No grievance record found for '{identifier}'. Please verify your ticket reference number or tracking token."
        )

    # Authorization verification
    is_authorized = (
        current_officer is not None or
        (complaint.tracking_token and complaint.tracking_token == clean_id) or
        (token and complaint.tracking_token and token.strip() == complaint.tracking_token) or
        (email and complaint.citizen_email and email.strip().lower() == complaint.citizen_email.strip().lower())
    )

    data = ComplaintResponse.model_validate(complaint).model_dump()
    if not is_authorized:
        # Mask citizen privacy
        em = complaint.citizen_email or ""
        if "@" in em:
            u, d = em.split("@", 1)
            masked_em = f"{u[:2]}***@{d}"
        else:
            masked_em = "***"
        data["citizen_email"] = masked_em
        parts = complaint.citizen_name.split()
        data["citizen_name"] = f"{parts[0][0]}. {' '.join(parts[1:])}" if len(parts) > 1 else complaint.citizen_name[:2] + "***"

    return data

# ----------------- COMPLAINTS LIST & DETAILS -----------------

VALID_STATUSES = {"New", "Assigned", "In Progress", "Resolved", "Reopened", "Closed", "Dismissed"}

FORWARD_TRANSITIONS = {
    "New": {"Assigned", "In Progress"},
    "Assigned": {"In Progress"},
    "In Progress": {"Resolved"},
    "Reopened": {"Assigned", "In Progress", "Resolved"},
    "Resolved": set(),
    "Closed": set(),
    "Dismissed": set()
}

@app.get("/api/complaints", response_model=List[ComplaintResponse])
def get_complaints(
    urgency: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    needs_review: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)

    if urgency:
        query = query.filter(Complaint.urgency == urgency)
    if category:
        query = query.filter(Complaint.category == category)
    if department:
        query = query.filter(Complaint.department == department)
    if status:
        query = query.filter(Complaint.status == status)
    if needs_review is not None:
        query = query.filter(Complaint.needs_review == needs_review)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Complaint.id.ilike(search_pattern),
                Complaint.summary.ilike(search_pattern),
                Complaint.raw_text.ilike(search_pattern),
                Complaint.category.ilike(search_pattern),
                Complaint.department.ilike(search_pattern),
                Complaint.location_text.ilike(search_pattern),
                Complaint.assigned_to.ilike(search_pattern)
            )
        )

    urgency_case = case(
        (Complaint.urgency == "Critical", 4),
        (Complaint.urgency == "High", 3),
        (Complaint.urgency == "Medium", 2),
        (Complaint.urgency == "Low", 1),
        else_=0
    )

    numeric_id = func.cast(
        func.substr(Complaint.id, func.instr(Complaint.id, "-") + 1),
        Integer
    )

    results = query.order_by(
        desc(urgency_case),
        desc(numeric_id),
        desc(Complaint.created_at)
    ).all()
    return results

@app.get("/api/complaints/{id}", response_model=ComplaintResponse)
def get_complaint(id: str, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")
    return complaint

@app.patch("/api/complaints/{id}", response_model=ComplaintResponse)
def update_complaint(
    id: str,
    payload: ComplaintUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")

    old_status = complaint.status

    if payload.status is not None and payload.status != old_status:
        if payload.status not in VALID_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{payload.status}'. Allowed statuses: {', '.join(sorted(VALID_STATUSES))}"
            )

        if old_status == "Resolved":
            raise HTTPException(
                status_code=400,
                detail="Resolved complaints cannot be transitioned backward via standard updates. To reactivate this ticket, please use the explicit 'Reopen Case' action with a documented reason."
            )

        if old_status in {"Closed", "Dismissed"}:
            raise HTTPException(
                status_code=400,
                detail=f"Complaints in '{old_status}' state are closed and cannot be updated via standard workflow."
            )

        allowed_targets = FORWARD_TRANSITIONS.get(old_status, set())
        if payload.status not in allowed_targets:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status transition: cannot change status from '{old_status}' to '{payload.status}'. Nagrik enforces a strict forward-only workflow (New → Assigned → In Progress → Resolved)."
            )

        complaint.status = payload.status

        # Record status history
        actor = payload.actor or (payload.assigned_to if payload.status == "In Progress" else "Officer")
        notes = payload.officer_notes or f"Status transitioned from {old_status} to {payload.status}"
        
        history = StatusHistory(
            complaint_id=complaint.id,
            from_status=old_status,
            to_status=payload.status,
            actor=actor,
            notes=notes,
            changed_at=datetime.utcnow()
        )
        db.add(history)

        # Transition to Resolved
        if payload.status == "Resolved":
            if not complaint.resolved_at:
                complaint.resolved_at = datetime.utcnow()

            has_resolved_email = (
                db.query(EmailLog)
                .filter(EmailLog.complaint_id == complaint.id, EmailLog.email_type == "resolved")
                .first()
            )
            if not has_resolved_email:
                background_tasks.add_task(bg_send_email_task, complaint.id, "resolved")

        background_tasks.add_task(
            dispatch_n8n_event_sync,
            "status_changed",
            {"id": complaint.id, "from_status": old_status, "to_status": payload.status}
        )

    if payload.assigned_to is not None:
        complaint.assigned_to = payload.assigned_to
        if complaint.status == "New" and payload.status is None:
            complaint.status = "Assigned"
            hist = StatusHistory(
                complaint_id=complaint.id,
                from_status="New",
                to_status="Assigned",
                actor=payload.actor or "Officer",
                notes=f"Squad assigned: {payload.assigned_to}",
                changed_at=datetime.utcnow()
            )
            db.add(hist)
            background_tasks.add_task(bg_send_email_task, complaint.id, "assigned")

    if payload.assigned_team_id is not None:
        complaint.assigned_team_id = payload.assigned_team_id
    if payload.officer_notes is not None:
        complaint.officer_notes = payload.officer_notes
    if payload.category is not None:
        complaint.category = payload.category
    if payload.department is not None:
        complaint.department = payload.department
    if payload.urgency is not None:
        complaint.urgency = payload.urgency
    if payload.latitude is not None:
        complaint.latitude = payload.latitude
    if payload.longitude is not None:
        complaint.longitude = payload.longitude

    complaint.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(complaint)
    return complaint

# ----------------- REOPEN & DISMISS ENDPOINTS -----------------

@app.post("/api/complaints/{id}/reopen", response_model=ComplaintResponse)
def reopen_complaint(
    id: str,
    payload: ComplaintReopenRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")

    if complaint.status not in {"Resolved", "Closed", "Dismissed"}:
        raise HTTPException(
            status_code=400,
            detail=f"Only resolved or closed complaints can be reopened. Current ticket status is '{complaint.status}'."
        )

    reason_text = (payload.reason or "").strip()
    if len(reason_text) < 3:
        raise HTTPException(status_code=400, detail="A valid explanation of at least 3 characters is mandatory to reopen a case.")

    old_status = complaint.status
    complaint.status = "Reopened"
    complaint.reopen_count = (complaint.reopen_count or 0) + 1
    complaint.reopened_at = datetime.utcnow()
    complaint.updated_at = datetime.utcnow()

    history = StatusHistory(
        complaint_id=complaint.id,
        from_status=old_status,
        to_status="Reopened",
        actor=payload.actor or "Supervisor",
        notes=f"Case Reopened: {reason_text}",
        changed_at=datetime.utcnow()
    )
    db.add(history)
    db.commit()
    db.refresh(complaint)

    background_tasks.add_task(bg_send_email_task, complaint.id, "reopened")
    background_tasks.add_task(
        dispatch_n8n_event_sync,
        "status_changed",
        {"id": complaint.id, "from_status": old_status, "to_status": "Reopened", "reason": reason_text}
    )
    return complaint

@app.post("/api/complaints/{id}/dismiss", response_model=ComplaintResponse)
@app.post("/api/complaints/{id}/close", response_model=ComplaintResponse)
def dismiss_complaint(
    id: str,
    payload: ComplaintDismissRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")

    actor_role = (payload.role or "Supervisor").strip()
    authorized_roles = {"Supervisor", "Admin", "Commissioner", "Municipal Lead"}
    if actor_role not in authorized_roles:
        raise HTTPException(
            status_code=403,
            detail=f"Unauthorized: Role '{actor_role}' does not have administrative permission to close or dismiss cases. Authorized roles: {', '.join(sorted(authorized_roles))}."
        )

    reason_text = (payload.reason or "").strip()
    if len(reason_text) < 3:
        raise HTTPException(status_code=400, detail="A mandatory justification of at least 3 characters is required to administratively close/dismiss this complaint.")

    old_status = complaint.status
    complaint.status = "Closed"
    complaint.closed_at = datetime.utcnow()
    complaint.closure_reason = reason_text
    complaint.updated_at = datetime.utcnow()

    history = StatusHistory(
        complaint_id=complaint.id,
        from_status=old_status,
        to_status="Closed",
        actor=f"{payload.actor} ({actor_role})",
        notes=f"Administrative Closure: {reason_text}",
        changed_at=datetime.utcnow()
    )
    db.add(history)
    db.commit()
    db.refresh(complaint)

    background_tasks.add_task(bg_send_email_task, complaint.id, "closed")
    background_tasks.add_task(
        dispatch_n8n_event_sync,
        "status_changed",
        {"id": complaint.id, "from_status": old_status, "to_status": "Closed", "reason": reason_text}
    )
    return complaint

# ----------------- RESEND EMAIL ENDPOINT -----------------

@app.post("/api/complaints/{id}/resend-email", response_model=ComplaintResponse)
def resend_complaint_email(
    id: str,
    payload: ResendEmailRequest,
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")

    send_complaint_email(db, complaint, payload.email_type)
    db.refresh(complaint)
    return complaint

# ----------------- STATS & MAP ENDPOINTS -----------------

@app.get("/api/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    complaints = db.query(Complaint).all()
    total = len(complaints)
    critical_open = sum(1 for c in complaints if c.urgency == "Critical" and c.status not in ("Resolved", "Closed"))
    resolved = sum(1 for c in complaints if c.status in ("Resolved", "Closed"))

    today_date = date.today()
    new_today = sum(1 for c in complaints if c.created_at and c.created_at.date() == today_date)

    by_category: Dict[str, int] = {}
    by_urgency: Dict[str, int] = {}
    by_status: Dict[str, int] = {}
    needs_review_count = 0
    unmapped_count = 0

    for c in complaints:
        by_category[c.category] = by_category.get(c.category, 0) + 1
        by_urgency[c.urgency] = by_urgency.get(c.urgency, 0) + 1
        by_status[c.status] = by_status.get(c.status, 0) + 1
        if c.needs_review:
            needs_review_count += 1
        if c.latitude is None or c.longitude is None:
            unmapped_count += 1

    return StatsResponse(
        total=total,
        critical_open=critical_open,
        new_today=new_today,
        resolved=resolved,
        by_category=by_category,
        by_urgency=by_urgency,
        by_status=by_status,
        needs_review_count=needs_review_count,
        unmapped_count=unmapped_count
    )

@app.get("/api/map", response_model=List[ComplaintMapItem])
def get_map_items(
    include_resolved: bool = Query(False),
    urgency: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint).filter(Complaint.latitude.isnot(None), Complaint.longitude.isnot(None))

    if not include_resolved:
        query = query.filter(Complaint.status != "Resolved")
    if urgency:
        query = query.filter(Complaint.urgency == urgency)
    if category:
        query = query.filter(Complaint.category == category)
    if department:
        query = query.filter(Complaint.department == department)

    return query.all()

# ----------------- SEED & RESET (DEMO PURPOSES) -----------------

@app.post("/api/seed")
def seed_demo_data(db: Session = Depends(get_db)):
    from .seed import seed_database
    count = seed_database(db)
    return {"message": f"Successfully seeded {count} sample complaints.", "seeded": count}

@app.post("/api/reset")
def reset_database(db: Session = Depends(get_db)):
    from .models import StatusHistory, EmailLog, Complaint
    from .seed import seed_database
    db.query(EmailLog).delete()
    db.query(StatusHistory).delete()
    db.query(Complaint).delete()
    db.commit()
    count = seed_database(db)
    return {"message": f"Database reset and re-seeded with {count} complaints.", "seeded": count}
