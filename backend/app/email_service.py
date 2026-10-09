import logging
import re
import time
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple
from sqlalchemy.orm import Session

import os
from .config import (
    RESEND_API_KEY,
    EMAIL_FROM,
    ADMIN_NOTIFICATION_EMAIL,
    DEMO_EMAIL_OVERRIDE,
    FRONTEND_URL
)
from .models import Complaint, EmailLog

def _get_resend_api_key() -> str:
    if "RESEND_API_KEY" in globals() and globals()["RESEND_API_KEY"] is not None:
        v = globals()["RESEND_API_KEY"]
        return v.strip() if isinstance(v, str) else str(v)
    return os.getenv("RESEND_API_KEY", "").strip()

def _get_email_from() -> str:
    if "EMAIL_FROM" in globals() and globals()["EMAIL_FROM"] is not None:
        v = globals()["EMAIL_FROM"]
        return v.strip() if isinstance(v, str) else str(v)
    return os.getenv("EMAIL_FROM", "Nagrik Alerts <onboarding@resend.dev>").strip()

def _get_admin_notification_email() -> Optional[str]:
    if "ADMIN_NOTIFICATION_EMAIL" in globals():
        v = globals()["ADMIN_NOTIFICATION_EMAIL"]
        if v is None:
            return None
        if isinstance(v, str):
            return v.strip() or None
        return str(v)
    env_v = os.getenv("ADMIN_NOTIFICATION_EMAIL", "").strip()
    return env_v or None

def _get_demo_email_override() -> Optional[str]:
    if "DEMO_EMAIL_OVERRIDE" in globals():
        v = globals()["DEMO_EMAIL_OVERRIDE"]
        if v is None:
            return None
        if isinstance(v, str):
            return v.strip() or None
        return str(v)
    env_v = os.getenv("DEMO_EMAIL_OVERRIDE", "").strip()
    return env_v or None

def _get_frontend_url() -> str:
    if "FRONTEND_URL" in globals() and globals()["FRONTEND_URL"] is not None:
        v = globals()["FRONTEND_URL"]
        return v.strip() if isinstance(v, str) else str(v)
    return os.getenv("FRONTEND_URL", "http://localhost:5173").strip()

logger = logging.getLogger("civic_ai.email_service")

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def is_valid_email(email: Optional[str]) -> bool:
    """Validate RFC-compliant email address format."""
    if not email:
        return False
    return bool(EMAIL_REGEX.match(email.strip()))

def sanitize_error_message(err: Exception) -> Tuple[str, bool]:
    """
    Sanitizes raw provider exceptions so no secrets, API keys, or raw tokens
    are written to logs or database columns.
    Returns (sanitized_message, is_retryable).
    """
    raw_str = str(err)
    
    # Strip any potential API key patterns (re_...)
    sanitized = re.sub(r're_[a-zA-Z0-9_]{16,}', '[REDACTED_API_KEY]', raw_str)
    sanitized = re.sub(r'Bearer\s+[a-zA-Z0-9_.-]+', 'Bearer [REDACTED_TOKEN]', sanitized, flags=re.IGNORECASE)

    is_retryable = False

    # Detect specific known Resend domain restriction
    if "You can only send testing emails to your own email address" in sanitized or "verify a domain" in sanitized:
        sanitized = (
            "Resend Account Restriction: Free tier 'onboarding@resend.dev' can only deliver to the registered "
            "account owner's email address. To deliver to arbitrary citizen addresses, verify a custom domain at "
            "resend.com/domains or configure DEMO_EMAIL_OVERRIDE in .env."
        )
        is_retryable = False
    elif "rate_limit" in sanitized.lower() or "429" in sanitized:
        sanitized = f"Resend API rate limit reached (HTTP 429). {sanitized[:150]}"
        is_retryable = True
    elif "timeout" in sanitized.lower() or "connection" in sanitized.lower():
        sanitized = f"Network timeout communicating with Resend API: {sanitized[:150]}"
        is_retryable = True
    elif "500" in sanitized or "502" in sanitized or "503" in sanitized:
        sanitized = f"Resend upstream server error: {sanitized[:150]}"
        is_retryable = True

    return sanitized, is_retryable

# ------------------------------------------------------------------------------
# Email Templates: Citizen Lodged Confirmation
# ------------------------------------------------------------------------------

def get_lodged_email_html(complaint: Complaint) -> str:
    urgency_color = {
        "Critical": "#DC2626",
        "High": "#D97706",
        "Medium": "#2563EB",
        "Low": "#16A34A"
    }.get(complaint.urgency, "#2563EB")

    tracking_url = f"{_get_frontend_url()}/track?id={complaint.id}"

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nagrik — Complaint Received [{complaint.id}]</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F7FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #172B4D;">
  <div style="max-width: 600px; margin: 24px auto; background: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.06); border: 1px solid #DCE4EC;">
    
    <!-- Municipal Header -->
    <div style="background-color: #0B1F3A; padding: 22px 24px; text-align: left; border-bottom: 3px solid #0D9488;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
        Nagrik Public Portal
      </h1>
      <p style="color: #94A3B8; margin: 4px 0 0 0; font-size: 12px;">Your City. Your Voice. &bull; Municipal Grievance Redressal</p>
    </div>

    <!-- Body -->
    <div style="padding: 28px 24px;">
      
      <div style="display: inline-block; background-color: #F4F7FA; border: 1px solid #DCE4EC; color: #0B1F3A; padding: 6px 14px; border-radius: 4px; font-size: 13px; font-weight: 700; font-family: monospace; letter-spacing: 0.5px; margin-bottom: 18px;">
        Reference ID: {complaint.id}
      </div>

      <h2 style="color: #172B4D; font-size: 19px; margin: 0 0 12px 0; font-weight: 700;">
        Your complaint has been recorded
      </h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">
        Dear <strong>{complaint.citizen_name}</strong>,<br>
        Thank you for reporting this issue. Your complaint has been registered in the municipal intake system and routed to the responsible department for triage and inspection.
      </p>

      <!-- Ticket Details Card -->
      <div style="background-color: #F8FAFC; border: 1px solid #DCE4EC; border-radius: 6px; padding: 18px; margin-bottom: 22px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748B; width: 34%;"><strong>Summary:</strong></td>
            <td style="padding: 6px 0; color: #172B4D; font-weight: 600;">{complaint.summary}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>Category:</strong></td>
            <td style="padding: 6px 0; color: #172B4D;">{complaint.category} &bull; {complaint.issue_type}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>Responsible Dept:</strong></td>
            <td style="padding: 6px 0; color: #0B1F3A; font-weight: 700;">{complaint.department}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>Status:</strong></td>
            <td style="padding: 6px 0; color: #172B4D;">
              <span style="background-color: #E2E8F0; color: #334155; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                {complaint.status}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>Assigned Urgency:</strong></td>
            <td style="padding: 6px 0;">
              <span style="background-color: {urgency_color}; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">
                {complaint.urgency}
              </span>
            </td>
          </tr>
          {f'<tr><td style="padding: 6px 0; color: #64748B;"><strong>Location:</strong></td><td style="padding: 6px 0; color: #172B4D;">{complaint.location_text}</td></tr>' if complaint.location_text else ''}
        </table>
      </div>

      <!-- Action Box -->
      <div style="border-left: 3px solid #0D9488; background-color: #F0FDFA; padding: 14px 16px; margin-bottom: 22px; font-size: 13px; color: #134E4A; line-height: 1.5;">
        <strong>Track your request progress:</strong><br>
        You can check live milestone updates using your reference ID on the portal:
        <div style="margin-top: 8px;">
          <a href="{tracking_url}" style="display: inline-block; background-color: #0D9488; color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 12px;">
            Track Request Timeline &rarr;
          </a>
        </div>
      </div>

      <p style="color: #64748B; font-size: 12px; margin: 20px 0 0 0; line-height: 1.4;">
        Submitted at: {complaint.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')} &bull; Reference #{complaint.id}
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #F8FAFC; padding: 14px 24px; text-align: center; border-top: 1px solid #E2E8F0; font-size: 11px; color: #64748B;">
      Nagrik &bull; Your City. Your Voice. &bull; Please do not reply directly to this automated email.
    </div>
  </div>
</body>
</html>"""

def get_lodged_email_text(complaint: Complaint) -> str:
    tracking_url = f"{FRONTEND_URL}/track?id={complaint.id}"
    return f"""Nagrik Public Portal — Complaint Received
Reference ID: {complaint.id}

Dear {complaint.citizen_name},

Thank you for reporting this issue. Your complaint has been registered in the municipal intake system and routed to {complaint.department}.

Ticket Details:
- Summary: {complaint.summary}
- Category: {complaint.category} ({complaint.issue_type})
- Department: {complaint.department}
- Urgency: {complaint.urgency}
- Status: {complaint.status}
- Location: {complaint.location_text or 'Not specified'}

To track your complaint status in real-time, visit:
{tracking_url}

Submitted at: {complaint.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}
Reference ID: {complaint.id}

Nagrik — Your City. Your Voice.
"""

# ------------------------------------------------------------------------------
# Email Templates: Administrative New-Complaint Notification
# ------------------------------------------------------------------------------

def get_admin_notification_html(complaint: Complaint) -> str:
    dashboard_url = f"{_get_frontend_url()}/dashboard"
    urgency_color = {
        "Critical": "#DC2626",
        "High": "#D97706",
        "Medium": "#2563EB",
        "Low": "#16A34A"
    }.get(complaint.urgency, "#2563EB")

    safety_flag = "Yes (Safety escalation triggered)" if "Safety Rule" in (complaint.urgency_reason or "") else "Standard"

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Nagrik Officer Alert] New Grievance: {complaint.id}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B1F3A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #172B4D;">
  <div style="max-width: 600px; margin: 24px auto; background: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.15);">
    
    <!-- Admin Header Strip -->
    <div style="background-color: #142B48; padding: 18px 24px; border-bottom: 3px solid #D97706; text-align: left;">
      <span style="background-color: #D97706; color: #ffffff; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
        Officer Alert
      </span>
      <h1 style="color: #ffffff; margin: 6px 0 0 0; font-size: 18px; font-weight: 700;">
        New Grievance Lodged: {complaint.id}
      </h1>
      <p style="color: #94A3B8; margin: 2px 0 0 0; font-size: 12px;">Automated intake dispatch notice</p>
    </div>

    <!-- Body -->
    <div style="padding: 24px;">
      
      <div style="margin-bottom: 18px;">
        <span style="background-color: {urgency_color}; color: #ffffff; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 700;">
          Priority: {complaint.urgency}
        </span>
        <span style="margin-left: 8px; background-color: #E2E8F0; color: #334155; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600;">
          Status: {complaint.status}
        </span>
      </div>

      <div style="background-color: #F8FAFC; border: 1px solid #DCE4EC; border-radius: 6px; padding: 16px; margin-bottom: 20px; font-size: 13px;">
        <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #0B1F3A;">
          {complaint.summary}
        </p>

        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tr>
            <td style="padding: 5px 0; color: #64748B; width: 36%;"><strong>Department:</strong></td>
            <td style="padding: 5px 0; color: #0B1F3A; font-weight: 700;">{complaint.department}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748B;"><strong>Category / Type:</strong></td>
            <td style="padding: 5px 0; color: #172B4D;">{complaint.category} &bull; {complaint.issue_type}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748B;"><strong>Location Mention:</strong></td>
            <td style="padding: 5px 0; color: #172B4D;">{complaint.location_text or 'No specific landmark'}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748B;"><strong>Assigned Squad:</strong></td>
            <td style="padding: 5px 0; color: #172B4D; font-weight: 600;">{complaint.assigned_to or 'Unassigned (In Intake Queue)'}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748B;"><strong>Safety Trigger:</strong></td>
            <td style="padding: 5px 0; color: #172B4D;">{safety_flag}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748B;"><strong>Review Required:</strong></td>
            <td style="padding: 5px 0; color: #DC2626 if complaint.needs_review else #16A34A; font-weight: 700;">
              {'Yes (Supervisor action required)' if complaint.needs_review else 'No'}
            </td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748B;"><strong>Intake Source:</strong></td>
            <td style="padding: 5px 0; color: #172B4D;">{complaint.ai_source.upper()} ({int(complaint.confidence * 100)}% confidence)</td>
          </tr>
        </table>
      </div>

      <!-- Action Link -->
      <div style="text-align: center; margin: 20px 0;">
        <a href="{dashboard_url}" style="display: inline-block; background-color: #0B1F3A; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: 700; font-size: 13px;">
          Open Municipal Officer Dashboard &rarr;
        </a>
      </div>

      <p style="color: #64748B; font-size: 11px; margin: 15px 0 0 0; text-align: center;">
        Note: Citizen contact details have been omitted from administrative broadcast for privacy.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #F8FAFC; padding: 12px 24px; text-align: center; border-top: 1px solid #E2E8F0; font-size: 11px; color: #64748B;">
      Nagrik Internal Administrative Dispatch &bull; Automated System Notice
    </div>
  </div>
</body>
</html>"""

def get_admin_notification_text(complaint: Complaint) -> str:
    dashboard_url = f"{_get_frontend_url()}/dashboard"
    safety_flag = "Yes (Safety escalation triggered)" if "Safety Rule" in (complaint.urgency_reason or "") else "Standard"

    return f"""[Nagrik Officer Alert] New Grievance Lodged: {complaint.id}
Priority: {complaint.urgency} | Status: {complaint.status}

Department: {complaint.department}
Category: {complaint.category} ({complaint.issue_type})
Summary: {complaint.summary}
Location: {complaint.location_text or 'None'}
Assigned Squad: {complaint.assigned_to or 'Unassigned'}
Safety Trigger: {safety_flag}
Needs Review: {'Yes' if complaint.needs_review else 'No'}

Dashboard URL:
{dashboard_url}

Timestamp: {complaint.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}
"""

# ------------------------------------------------------------------------------
# Email Templates: Complaint Resolved Notification
# ------------------------------------------------------------------------------

def get_resolved_email_html(complaint: Complaint) -> str:
    resolved_time = complaint.resolved_at.strftime('%Y-%m-%d %H:%M:%S UTC') if complaint.resolved_at else datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    tracking_url = f"{_get_frontend_url()}/track?id={complaint.id}"

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nagrik — Complaint Resolved [{complaint.id}]</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F7FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #172B4D;">
  <div style="max-width: 600px; margin: 24px auto; background: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.06); border: 1px solid #DCE4EC;">
    
    <div style="background-color: #0B1F3A; padding: 22px 24px; text-align: left; border-bottom: 3px solid #16A34A;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">
        Nagrik Public Portal
      </h1>
      <p style="color: #94A3B8; margin: 4px 0 0 0; font-size: 12px;">Your City. Your Voice. &bull; Municipal Grievance Redressal</p>
    </div>

    <div style="padding: 28px 24px;">
      
      <div style="display: inline-block; background-color: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; padding: 6px 14px; border-radius: 4px; font-size: 13px; font-weight: 700; margin-bottom: 18px;">
        Status: Resolved &bull; {complaint.id}
      </div>

      <h2 style="color: #172B4D; font-size: 19px; margin: 0 0 12px 0; font-weight: 700;">
        Your reported issue has been resolved
      </h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">
        Dear <strong>{complaint.citizen_name}</strong>,<br>
        Municipal operations from <strong>{complaint.department}</strong> have certified remediation for this complaint and marked it as resolved.
      </p>

      <div style="background-color: #F8FAFC; border: 1px solid #DCE4EC; border-radius: 6px; padding: 18px; margin-bottom: 22px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748B; width: 34%;"><strong>Summary:</strong></td>
            <td style="padding: 6px 0; color: #172B4D; font-weight: 600;">{complaint.summary}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>Department:</strong></td>
            <td style="padding: 6px 0; color: #0B1F3A; font-weight: 700;">{complaint.department}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>Resolved At:</strong></td>
            <td style="padding: 6px 0; color: #172B4D;">{resolved_time}</td>
          </tr>
          {f'<tr><td style="padding: 6px 0; color: #64748B;"><strong>Officer Notes:</strong></td><td style="padding: 6px 0; color: #172B4D; font-style: italic;">{complaint.officer_notes}</td></tr>' if complaint.officer_notes else ''}
        </table>
      </div>

      <div style="background-color: #F0FDF4; border-left: 3px solid #16A34A; padding: 14px 16px; margin-bottom: 22px; font-size: 13px; color: #166534; line-height: 1.5;">
        Thank you for helping keep our city clean, functional, and safe. If the condition reoccurs or requires further remediation, you may submit a follow-up request via the portal.
      </div>

      <div style="text-align: left; margin: 15px 0;">
        <a href="{tracking_url}" style="display: inline-block; background-color: #0D9488; color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 12px;">
          View Full Resolution Record &rarr;
        </a>
      </div>
    </div>

    <div style="background-color: #F8FAFC; padding: 14px 24px; text-align: center; border-top: 1px solid #E2E8F0; font-size: 11px; color: #64748B;">
      Nagrik &bull; Your City. Your Voice. &bull; Reference #{complaint.id}
    </div>
  </div>
</body>
</html>"""

def get_resolved_email_text(complaint: Complaint) -> str:
    resolved_time = complaint.resolved_at.strftime('%Y-%m-%d %H:%M:%S UTC') if complaint.resolved_at else datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    notes = f"\nOfficer Notes: {complaint.officer_notes}" if complaint.officer_notes else ""
    return f"""Nagrik Public Portal — Complaint Resolved
Reference ID: {complaint.id}

Dear {complaint.citizen_name},

Your complaint [{complaint.id}] has been marked resolved by {complaint.department}.

Summary: {complaint.summary}
Resolved Date: {resolved_time}{notes}

Thank you for helping keep our city clean and safe.
Nagrik — Your City. Your Voice.
"""

# ------------------------------------------------------------------------------
# Core Dispatch Engine (Resend)
# ------------------------------------------------------------------------------

def send_email_with_resend(
    db: Session,
    complaint: Complaint,
    email_type: str,
    recipient: str,
    subject: str,
    html_content: str,
    text_content: str,
    is_admin: bool = False
) -> EmailLog:
    """
    Sends an email using the official Resend Python SDK with bounded retries,
    sanitized error logging, and duplicate prevention.
    Never raises an uncaught exception that would abort the caller.
    """
    dest_email = recipient.strip() if recipient else ""

    # Check demo override for citizen-bound emails
    demo_override = _get_demo_email_override()
    if not is_admin and demo_override:
        dest_email = demo_override.strip()
    elif not is_admin and dest_email.lower().endswith("@example.com"):
        # Resend test domain rejects example.com; safely route to official verified testing sink
        dest_email = "delivered@resend.dev"

    # Validate email address format
    if not is_valid_email(dest_email):
        log_entry = EmailLog(
            complaint_id=complaint.id,
            email_type=email_type,
            to_email=dest_email or "EMPTY_OR_INVALID",
            status="skipped",
            error=f"Recipient email is empty or invalid format: '{dest_email}'",
            provider_id=None,
            sent_at=datetime.utcnow(),
            attempt_count=0,
            retryable=False
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        logger.warning(f"Email {email_type} skipped: invalid recipient '{dest_email}'")
        return log_entry

    # Check for configured API key
    api_key = _get_resend_api_key()
    if not api_key:
        log_entry = EmailLog(
            complaint_id=complaint.id,
            email_type=email_type,
            to_email=dest_email,
            status="skipped",
            error="RESEND_API_KEY is not configured in backend environment.",
            provider_id=None,
            sent_at=datetime.utcnow(),
            attempt_count=0,
            retryable=False
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        logger.info(f"Email {email_type} skipped: RESEND_API_KEY not configured.")
        return log_entry

    # Prevent duplicate resolution emails
    if email_type == "resolved":
        already_sent = (
            db.query(EmailLog)
            .filter(
                EmailLog.complaint_id == complaint.id,
                EmailLog.email_type == "resolved",
                EmailLog.status == "sent"
            )
            .first()
        )
        if already_sent:
            logger.info(f"Resolution email already sent for {complaint.id} (provider_id={already_sent.provider_id}). Skipping duplicate.")
            return already_sent

    import resend
    resend.api_key = api_key

    params: Dict[str, Any] = {
        "from": _get_email_from(),
        "to": [dest_email],
        "subject": subject,
        "html": html_content,
        "text": text_content,
    }

    max_attempts = 2
    attempt = 0
    last_error_msg = ""
    is_retryable = False
    provider_id = None

    while attempt < max_attempts:
        attempt += 1
        try:
            logger.info(f"Sending {email_type} email to {dest_email} via Resend (attempt {attempt}/{max_attempts})...")
            response = resend.Emails.send(params)

            if isinstance(response, dict):
                provider_id = response.get("id")
            elif hasattr(response, "id"):
                provider_id = getattr(response, "id")

            log_entry = EmailLog(
                complaint_id=complaint.id,
                email_type=email_type,
                to_email=dest_email,
                status="sent",
                error=None,
                provider_id=provider_id,
                sent_at=datetime.utcnow(),
                attempt_count=attempt,
                retryable=False
            )
            db.add(log_entry)
            db.commit()
            db.refresh(log_entry)
            logger.info(f"Successfully sent {email_type} email to {dest_email} (provider_id={provider_id})")
            return log_entry

        except Exception as e:
            last_error_msg, is_retryable = sanitize_error_message(e)
            logger.warning(f"Resend attempt {attempt} failed for {email_type} -> {dest_email}: {last_error_msg}")
            if is_retryable and attempt < max_attempts:
                time.sleep(1.0)
            else:
                break

    # If all attempts failed, record failed state
    log_entry = EmailLog(
        complaint_id=complaint.id,
        email_type=email_type,
        to_email=dest_email,
        status="failed",
        error=last_error_msg,
        provider_id=None,
        sent_at=datetime.utcnow(),
        attempt_count=attempt,
        retryable=is_retryable
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry

# ------------------------------------------------------------------------------
# High-Level Trigger Functions
# ------------------------------------------------------------------------------

def send_citizen_lodged_email(db: Session, complaint: Complaint) -> EmailLog:
    """Dispatches the official intake confirmation email to the citizen."""
    subject = f"Nagrik — Complaint Received [{complaint.id}]"
    html = get_lodged_email_html(complaint)
    text = get_lodged_email_text(complaint)
    return send_email_with_resend(
        db=db,
        complaint=complaint,
        email_type="lodged",
        recipient=complaint.citizen_email,
        subject=subject,
        html_content=html,
        text_content=text,
        is_admin=False
    )

def send_admin_new_complaint_notification(db: Session, complaint: Complaint) -> EmailLog:
    """
    Dispatches a structured alert to the administrative coordinator (ADMIN_NOTIFICATION_EMAIL).
    Omits citizen private data for security and privacy.
    """
    admin_email = _get_admin_notification_email()
    if not admin_email:
        log_entry = EmailLog(
            complaint_id=complaint.id,
            email_type="admin_notification",
            to_email="UNCONFIGURED",
            status="skipped",
            error="ADMIN_NOTIFICATION_EMAIL is not configured in backend environment.",
            provider_id=None,
            sent_at=datetime.utcnow(),
            attempt_count=0,
            retryable=False
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        logger.info(f"Administrative notification skipped for {complaint.id}: ADMIN_NOTIFICATION_EMAIL not set.")
        return log_entry

    subject = f"[Nagrik Officer Alert] New Grievance Lodged: {complaint.id} [{complaint.urgency}]"
    html = get_admin_notification_html(complaint)
    text = get_admin_notification_text(complaint)

    return send_email_with_resend(
        db=db,
        complaint=complaint,
        email_type="admin_notification",
        recipient=admin_email,
        subject=subject,
        html_content=html,
        text_content=text,
        is_admin=True
    )

def send_complaint_resolved_email(db: Session, complaint: Complaint) -> EmailLog:
    """Dispatches the official resolution notice to the citizen."""
    subject = f"Nagrik — Complaint Resolved [{complaint.id}]"
    html = get_resolved_email_html(complaint)
    text = get_resolved_email_text(complaint)
    return send_email_with_resend(
        db=db,
        complaint=complaint,
        email_type="resolved",
        recipient=complaint.citizen_email,
        subject=subject,
        html_content=html,
        text_content=text,
        is_admin=False
    )

def send_complaint_assigned_email(db: Session, complaint: Complaint) -> EmailLog:
    """Dispatches assignment notification to the citizen when an operational squad is assigned."""
    subject = f"Nagrik — Squad Assigned [{complaint.id}]"
    html = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; background-color: #F4F7FA; padding: 20px; color: #172B4D;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; border: 1px solid #DCE4EC; overflow: hidden;">
    <div style="background: #0B1F3A; padding: 18px 24px; border-bottom: 3px solid #0D9488; color: #fff;">
      <h2 style="margin: 0; font-size: 18px;">Nagrik — Squad Assigned</h2>
      <p style="margin: 4px 0 0; font-size: 12px; color: #94A3B8;">Grievance Ref: {complaint.id}</p>
    </div>
    <div style="padding: 24px;">
      <p>Dear {complaint.citizen_name},</p>
      <p>Your grievance has been assigned to an operational team for remediation:</p>
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 8px;"><strong>Department:</strong> {complaint.department}</p>
        <p style="margin: 0 0 8px;"><strong>Assigned Lead:</strong> {complaint.assigned_to or 'Municipal Response Squad'}</p>
        <p style="margin: 0 0 8px;"><strong>Team ID:</strong> {complaint.assigned_team_id or 'Operational Squad'}</p>
        <p style="margin: 0;"><strong>Summary:</strong> {complaint.summary}</p>
      </div>
      <p><a href="{_get_frontend_url()}/track?id={complaint.id}" style="display: inline-block; background: #0B1F3A; color: #fff; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 13px;">Track Progress Online &rarr;</a></p>
    </div>
    <div style="background: #F8FAFC; padding: 12px; text-align: center; font-size: 11px; color: #64748B;">
      Nagrik Automated Municipal Notification System &bull; Your City. Your Voice.
    </div>
  </div>
</body>
</html>"""
    text = f"Nagrik: Squad assigned for {complaint.id}. Department: {complaint.department}. Assigned: {complaint.assigned_to}. Track at {_get_frontend_url()}/track?id={complaint.id}"
    return send_email_with_resend(
        db=db,
        complaint=complaint,
        email_type="assigned",
        recipient=complaint.citizen_email,
        subject=subject,
        html_content=html,
        text_content=text,
        is_admin=False
    )

def send_complaint_reopened_email(db: Session, complaint: Complaint) -> EmailLog:
    """Dispatches notice to citizen when grievance case is reopened."""
    subject = f"Nagrik — Grievance Reopened [{complaint.id}]"
    html = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; background-color: #F4F7FA; padding: 20px; color: #172B4D;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; border: 1px solid #DCE4EC; overflow: hidden;">
    <div style="background: #0B1F3A; padding: 18px 24px; border-bottom: 3px solid #E11D48; color: #fff;">
      <h2 style="margin: 0; font-size: 18px;">Nagrik — Grievance Reopened</h2>
      <p style="margin: 4px 0 0; font-size: 12px; color: #94A3B8;">Grievance Ref: {complaint.id}</p>
    </div>
    <div style="padding: 24px;">
      <p>Dear {complaint.citizen_name},</p>
      <p>Your grievance case <strong>{complaint.id}</strong> has been reopened for additional inspection and remediation.</p>
      <p>Our municipal team will conduct a follow-up review. Track updates at <a href="{_get_frontend_url()}/track?id={complaint.id}">Online Portal</a>.</p>
    </div>
    <div style="background: #F8FAFC; padding: 12px; text-align: center; font-size: 11px; color: #64748B;">
      Nagrik Automated Municipal Notification System &bull; Your City. Your Voice.
    </div>
  </div>
</body>
</html>"""
    text = f"Nagrik: Grievance {complaint.id} has been reopened for follow-up inspection. Track at {_get_frontend_url()}/track?id={complaint.id}"
    return send_email_with_resend(
        db=db,
        complaint=complaint,
        email_type="reopened",
        recipient=complaint.citizen_email,
        subject=subject,
        html_content=html,
        text_content=text,
        is_admin=False
    )

def send_complaint_closed_email(db: Session, complaint: Complaint) -> EmailLog:
    """Dispatches notice to citizen when grievance case is administratively closed."""
    subject = f"Nagrik — Case Closed [{complaint.id}]"
    html = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; background-color: #F4F7FA; padding: 20px; color: #172B4D;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; border: 1px solid #DCE4EC; overflow: hidden;">
    <div style="background: #0B1F3A; padding: 18px 24px; border-bottom: 3px solid #64748B; color: #fff;">
      <h2 style="margin: 0; font-size: 18px;">Nagrik — Case Closed</h2>
      <p style="margin: 4px 0 0; font-size: 12px; color: #94A3B8;">Grievance Ref: {complaint.id}</p>
    </div>
    <div style="padding: 24px;">
      <p>Dear {complaint.citizen_name},</p>
      <p>Your grievance case <strong>{complaint.id}</strong> has been closed by municipal supervisory review.</p>
      {f"<p><strong>Note:</strong> {complaint.closure_reason}</p>" if complaint.closure_reason else ""}
      <p>Thank you for engaging with Nagrik.</p>
    </div>
    <div style="background: #F8FAFC; padding: 12px; text-align: center; font-size: 11px; color: #64748B;">
      Nagrik Automated Municipal Notification System &bull; Your City. Your Voice.
    </div>
  </div>
</body>
</html>"""
    text = f"Nagrik: Case {complaint.id} has been closed by municipal review. {complaint.closure_reason or ''}"
    return send_email_with_resend(
        db=db,
        complaint=complaint,
        email_type="closed",
        recipient=complaint.citizen_email,
        subject=subject,
        html_content=html,
        text_content=text,
        is_admin=False
    )

def send_safety_escalation_email(db: Session, complaint: Complaint) -> EmailLog:
    """Dispatches critical emergency hazard escalation to administrative coordinator."""
    admin_email = _get_admin_notification_email()
    if not admin_email:
        return send_admin_new_complaint_notification(db, complaint)
    subject = f"[NAGRIK CRITICAL HAZARD ESCALATION] Imminent Danger Alert: {complaint.id}"
    html = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; background-color: #7F1D1D; padding: 20px; color: #172B4D;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; border: 2px solid #DC2626;">
    <div style="background: #DC2626; padding: 18px 24px; color: #fff;">
      <h2 style="margin: 0; font-size: 18px; text-transform: uppercase;">⚠️ CRITICAL LIFE-SAFETY HAZARD ESCALATION</h2>
      <p style="margin: 4px 0 0; font-size: 12px; color: #FEE2E2;">Immediate Municipal Squad Intervention Required</p>
    </div>
    <div style="padding: 24px;">
      <p><strong>Grievance ID:</strong> {complaint.id}</p>
      <p><strong>Urgency:</strong> <span style="color: #DC2626; font-weight: bold;">CRITICAL</span></p>
      <p><strong>Escalation Reason:</strong> {complaint.urgency_reason}</p>
      <p><strong>Department:</strong> {complaint.department}</p>
      <p><strong>Location:</strong> {complaint.location_text or 'GPS Coordinates Plotted'}</p>
      <p><strong>Summary:</strong> {complaint.summary}</p>
      <p><a href="{_get_frontend_url()}/dashboard" style="display: inline-block; background: #DC2626; color: #fff; padding: 10px 18px; text-decoration: none; border-radius: 4px; font-weight: bold;">Open Officer Console &rarr;</a></p>
    </div>
  </div>
</body>
</html>"""
    text = f"CRITICAL HAZARD ESCALATION: {complaint.id}. Reason: {complaint.urgency_reason}. Location: {complaint.location_text}. Console: {_get_frontend_url()}/dashboard"
    return send_email_with_resend(
        db=db,
        complaint=complaint,
        email_type="escalation",
        recipient=admin_email,
        subject=subject,
        html_content=html,
        text_content=text,
        is_admin=True
    )

# Backward compatibility adapter for send_complaint_email
def send_complaint_email(db: Session, complaint: Complaint, email_type: str) -> EmailLog:
    """Legacy entry point routing to specific event handlers."""
    if email_type == "lodged":
        return send_citizen_lodged_email(db, complaint)
    elif email_type == "assigned":
        return send_complaint_assigned_email(db, complaint)
    elif email_type == "admin_notification":
        return send_admin_new_complaint_notification(db, complaint)
    elif email_type == "resolved":
        return send_complaint_resolved_email(db, complaint)
    elif email_type == "reopened":
        return send_complaint_reopened_email(db, complaint)
    elif email_type == "closed":
        return send_complaint_closed_email(db, complaint)
    elif email_type == "escalation":
        return send_safety_escalation_email(db, complaint)
    else:
        log_entry = EmailLog(
            complaint_id=complaint.id,
            email_type=email_type,
            to_email=complaint.citizen_email,
            status="skipped",
            error=f"Unsupported email event type: '{email_type}'",
            sent_at=datetime.utcnow()
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry
