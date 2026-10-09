from datetime import datetime
from sqlalchemy import Column, String, Text, Float, Boolean, DateTime, Integer, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String, primary_key=True, index=True) # e.g. CIV-00001
    raw_text = Column(Text, nullable=False)
    citizen_name = Column(String, nullable=False)
    citizen_email = Column(String, nullable=False)
    location_text = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    category = Column(String, nullable=False) # Roads | Sanitation | Water Supply | Drainage | Streetlights & Electrical | Other
    issue_type = Column(String, nullable=False) # e.g. Pothole
    department = Column(String, nullable=False)
    urgency = Column(String, nullable=False) # Critical | High | Medium | Low
    urgency_reason = Column(String, nullable=False)
    duration = Column(String, nullable=True)
    summary = Column(String, nullable=False)
    suggested_action = Column(String, nullable=False)
    confidence = Column(Float, nullable=False, default=1.0)
    needs_review = Column(Boolean, nullable=False, default=False)
    
    status = Column(String, nullable=False, default="New") # New | Assigned | In Progress | Resolved
    assigned_to = Column(String, nullable=True)
    assigned_team_id = Column(String, nullable=True)
    assignment_score = Column(Float, nullable=True)
    assignment_reason = Column(Text, nullable=True)
    officer_notes = Column(Text, nullable=True)
    photo_path = Column(String, nullable=True)
    ai_source = Column(String, nullable=False, default="llm") # llm | fallback | groq
    is_demo = Column(Boolean, default=False, nullable=True)
    
    reopen_count = Column(Integer, default=0, nullable=True)
    reopened_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    closure_reason = Column(Text, nullable=True)
    tracking_token = Column(String, unique=True, index=True, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    status_history = relationship("StatusHistory", back_populates="complaint", cascade="all, delete-orphan", order_by="StatusHistory.changed_at.asc()")
    email_logs = relationship("EmailLog", back_populates="complaint", cascade="all, delete-orphan", order_by="EmailLog.sent_at.desc()")

class StatusHistory(Base):
    __tablename__ = "status_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False, index=True)
    from_status = Column(String, nullable=True)
    to_status = Column(String, nullable=False)
    actor = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    complaint = relationship("Complaint", back_populates="status_history")

class EmailLog(Base):
    __tablename__ = "email_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False, index=True)
    email_type = Column(String, nullable=False) # lodged | resolved | admin_notification | assignment | escalation
    to_email = Column(String, nullable=False)
    status = Column(String, nullable=False) # sent | failed | skipped | pending
    error = Column(Text, nullable=True)
    provider_id = Column(String, nullable=True)
    sent_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    attempt_count = Column(Integer, default=1, nullable=True)
    retryable = Column(Boolean, default=False, nullable=True)

    complaint = relationship("Complaint", back_populates="email_logs")

class Officer(Base):
    __tablename__ = "officers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    badge_number = Column(String, nullable=False)
    department = Column(String, nullable=False)
    role = Column(String, nullable=False, default="Officer") # Officer | Supervisor | Admin | Commissioner
    password_hash = Column(String, nullable=False)
    salt = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

