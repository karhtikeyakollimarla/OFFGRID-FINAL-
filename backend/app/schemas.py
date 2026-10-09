from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, ConfigDict

class ComplaintCreate(BaseModel):
    raw_text: str = Field(..., min_length=3, description="Citizen's free-text complaint")
    citizen_name: str = Field(..., min_length=1, description="Citizen's name")
    citizen_email: str = Field(..., min_length=3, description="Citizen's email for status alerts")
    location_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ComplaintUpdate(BaseModel):
    status: Optional[str] = None # New, Assigned, In Progress, Resolved
    assigned_to: Optional[str] = None
    assigned_team_id: Optional[str] = None
    officer_notes: Optional[str] = None
    actor: Optional[str] = None
    category: Optional[str] = None
    department: Optional[str] = None
    urgency: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ComplaintReopenRequest(BaseModel):
    reason: str = Field(..., min_length=3, description="Mandatory reason for reopening the resolved case")
    actor: Optional[str] = Field("Supervisor", description="Officer or supervisor identity")

class ComplaintDismissRequest(BaseModel):
    reason: str = Field(..., min_length=3, description="Mandatory administrative justification for closing/dismissing the case")
    actor: Optional[str] = Field("Supervisor", description="Authorized officer or supervisor identity")
    role: Optional[str] = Field("Supervisor", description="Authorized role: Supervisor, Admin, or Commissioner")

class StatusHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    complaint_id: str
    from_status: Optional[str] = None
    to_status: str
    actor: Optional[str] = None
    notes: Optional[str] = None
    changed_at: datetime

class EmailLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    complaint_id: str
    email_type: str
    to_email: str
    status: str
    error: Optional[str] = None
    provider_id: Optional[str] = None
    sent_at: datetime
    attempt_count: Optional[int] = 1
    retryable: Optional[bool] = False

class ComplaintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    raw_text: str
    citizen_name: str
    citizen_email: str
    location_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    category: str
    issue_type: str
    department: str
    urgency: str
    urgency_reason: str
    duration: Optional[str] = None
    summary: str
    suggested_action: str
    confidence: float
    needs_review: bool
    status: str
    assigned_to: Optional[str] = None
    assigned_team_id: Optional[str] = None
    assignment_score: Optional[float] = None
    assignment_reason: Optional[str] = None
    officer_notes: Optional[str] = None
    photo_path: Optional[str] = None
    ai_source: str
    is_demo: Optional[bool] = False
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    reopen_count: Optional[int] = 0
    reopened_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    closure_reason: Optional[str] = None
    tracking_token: Optional[str] = None
    status_history: List[StatusHistoryResponse] = []
    email_logs: List[EmailLogResponse] = []

class ComplaintMapItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    urgency: str
    category: str
    status: str
    summary: str
    issue_type: str
    created_at: datetime

class StatsResponse(BaseModel):
    total: int
    critical_open: int
    new_today: int
    resolved: int
    by_category: Dict[str, int]
    by_urgency: Dict[str, int]
    by_status: Dict[str, int]
    needs_review_count: int
    unmapped_count: int

class ResendEmailRequest(BaseModel):
    email_type: str # lodged | resolved | admin_notification

class OfficerLoginRequest(BaseModel):
    email: str = Field(..., description="Officer municipal email")
    password: str = Field(..., description="Officer password")

class OfficerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    badge_number: str
    department: str
    role: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    officer: OfficerResponse

