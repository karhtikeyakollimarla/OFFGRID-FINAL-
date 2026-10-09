import hmac
import hashlib
import base64
import json
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session

from .database import get_db
from .models import Officer

# Secret key for JWT/HMAC token signing
AUTH_SECRET = secrets.token_hex(32)

def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """Hashes a password with PBKDF2-HMAC-SHA256 and a random cryptographic salt."""
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000
    ).hex()
    return hashed, salt

def verify_password(password: str, password_hash: str, salt: str) -> bool:
    """Verifies a plaintext password against the stored PBKDF2 hash and salt."""
    calculated, _ = hash_password(password, salt)
    return hmac.compare_digest(calculated, password_hash)

def b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")

def b64_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding and padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data)

def create_access_token(payload: Dict[str, Any], expires_hours: int = 24) -> str:
    """Generates a tamper-proof signed session token using HMAC-SHA256."""
    header = {"alg": "HS256", "typ": "JWT"}
    claims = dict(payload)
    claims["exp"] = (datetime.utcnow() + timedelta(hours=expires_hours)).isoformat()
    claims["iat"] = datetime.utcnow().isoformat()
    
    header_b64 = b64_encode(json.dumps(header).encode("utf-8"))
    payload_b64 = b64_encode(json.dumps(claims).encode("utf-8"))
    
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(AUTH_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    sig_b64 = b64_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{sig_b64}"

def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Verifies and decodes an access token."""
    try:
        parts = token.strip().split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_sig = hmac.new(AUTH_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
        actual_sig = b64_decode(sig_b64)
        
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
            
        claims = json.loads(b64_decode(payload_b64).decode("utf-8"))
        exp_str = claims.get("exp")
        if exp_str:
            exp_dt = datetime.fromisoformat(exp_str)
            if datetime.utcnow() > exp_dt:
                return None # Token expired
                
        return claims
    except Exception:
        return None

def get_current_officer_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[Officer]:
    """
    Extracts current authenticated officer if Authorization header is provided.
    Does not raise exception if absent, allowing public access fallback.
    """
    if not authorization:
        return None
        
    token = authorization
    if token.startswith("Bearer "):
        token = token[7:].strip()
        
    claims = verify_access_token(token)
    if not claims or "email" not in claims:
        return None
        
    officer = db.query(Officer).filter(Officer.email == claims["email"], Officer.is_active == True).first()
    return officer

def get_current_officer_required(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Officer:
    """Enforces active officer authentication for restricted administrative endpoints."""
    officer = get_current_officer_optional(authorization, db)
    if not officer:
        raise HTTPException(
            status_code=401,
            detail="Authentication required: please sign in with authorized municipal officer credentials."
        )
    return officer

DEFAULT_SEEDED_OFFICERS = [
    {
        "email": "admin@nagrik.local",
        "full_name": "Commissioner R. Sharma",
        "badge_number": "MNC-001",
        "department": "General Administration",
        "role": "Commissioner",
        "password": "NagrikAdmin2026!"
    },
    {
        "email": "supervisor@nagrik.local",
        "full_name": "Supervisor V. Kulkarni",
        "badge_number": "SUP-104",
        "department": "Electrical & Street Lighting",
        "role": "Supervisor",
        "password": "NagrikSupervisor2026!"
    },
    {
        "email": "officer.roads@nagrik.local",
        "full_name": "Officer R. Sharma",
        "badge_number": "PWD-042",
        "department": "Public Works – Roads",
        "role": "Officer",
        "password": "NagrikOfficer2026!"
    },
    {
        "email": "officer.sanitation@nagrik.local",
        "full_name": "Officer M. Khan",
        "badge_number": "SSW-088",
        "department": "Sanitation & Solid Waste",
        "role": "Officer",
        "password": "NagrikOfficer2026!"
    },
    {
        "email": "officer.water@nagrik.local",
        "full_name": "Officer A. Iyer",
        "badge_number": "WSB-015",
        "department": "Water Supply Board",
        "role": "Officer",
        "password": "NagrikOfficer2026!"
    }
]
