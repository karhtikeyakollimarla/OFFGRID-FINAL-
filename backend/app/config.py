import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend folder or project root
backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(backend_dir / ".env", override=True)
load_dotenv(backend_dir.parent / ".env", override=True)

# AI Service Configuration (Groq with fallback)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b").strip()
GROQ_TIMEOUT_SECONDS = float(os.getenv("GROQ_TIMEOUT_SECONDS", "8.0"))
GROQ_MAX_RETRIES = int(os.getenv("GROQ_MAX_RETRIES", "1"))

# Backward-compatibility fallback for Gemini if present
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

# Resend Email Configuration
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()
EMAIL_FROM = os.getenv("EMAIL_FROM", "Nagrik Alerts <onboarding@resend.dev>").strip()
ADMIN_NOTIFICATION_EMAIL = os.getenv("ADMIN_NOTIFICATION_EMAIL", "").strip() or None
DEMO_EMAIL_OVERRIDE = os.getenv("DEMO_EMAIL_OVERRIDE", "").strip() or None
RESEND_TEST_RECIPIENT = os.getenv("RESEND_TEST_RECIPIENT", "").strip() or None

# n8n Automation Webhook Configuration
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "").strip() or None
N8N_WEBHOOK_SECRET = os.getenv("N8N_WEBHOOK_SECRET", "").strip() or None

# Auto-Assignment Engine Settings
ASSIGNMENT_MIN_CONFIDENCE = float(os.getenv("ASSIGNMENT_MIN_CONFIDENCE", "0.6"))

# Geospatial & Server Settings
DEFAULT_MAP_CENTER_LAT = float(os.getenv("DEFAULT_MAP_CENTER_LAT", "28.6139"))
DEFAULT_MAP_CENTER_LNG = float(os.getenv("DEFAULT_MAP_CENTER_LNG", "77.2090"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").strip()

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{backend_dir / 'civic_ai.db'}")
UPLOAD_DIR = backend_dir / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
