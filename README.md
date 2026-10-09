# CivicAI — AI-Powered Civic Complaint Triage (Problem Statement 10)

An end-to-end municipal grievance management platform powered by **Google Gemini**, **Resend**, and interactive **Leaflet Hotspot Maps**. Citizens submit complaints in unstructured, colloquial natural language (English, Hindi, or Hinglish), and CivicAI automatically parses, classifies urgency, extracts landmarks, routes to the responsible municipal department, plots geographic hotspots, and keeps citizens notified via automated emails.

---

## Architecture Overview

```
                                      ┌──────────────────────────────────────────────┐
                                      │         Citizen Portal (React + Vite)        │
                                      │  - Natural language complaint form           │
                                      │  - Web Speech voice input (en-IN / hi-IN)    │
                                      │  - Interactive pin dropping & geolocation    │
                                      └──────────────────────┬───────────────────────┘
                                                             │ POST /api/complaints
                                                             ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│                              FastAPI Backend Service                               │
│                                                                                    │
│   ┌────────────────────────────────┐         ┌─────────────────────────────────┐   │
│   │   AI Triage Analysis Engine    │         │      Nominatim Geocoding        │   │
│   │ - Google Gemini Structured JSON│         │ - OpenStreetMap rate-limited    │   │
│   │ - Deterministic Safety Rules   │         │ - 1 req/sec caching layer       │   │
│   │ - Rule-based keyword fallback  │         └────────────────┬────────────────┘   │
│   └───────────────┬────────────────┘                          │                    │
│                   │                                           │                    │
│                   ▼                                           ▼                    │
│   ┌────────────────────────────────────────────────────────────────────────────┐   │
│   │                   SQLite Persistence (SQLAlchemy ORM)                      │   │
│   │          complaints  •  status_history  •  email_log                       │   │
│   └──────────────────────────────────────┬─────────────────────────────────────┘   │
│                                          │                                         │
│                                          ▼ (FastAPI BackgroundTask)                │
│                         ┌───────────────────────────────────┐                      │
│                         │        Resend Email Engine        │                      │
│                         │ - Lodged & Resolved notifications │                      │
│                         │ - Branded HTML + Plaintext        │                      │
│                         │ - DEMO_EMAIL_OVERRIDE support     │                      │
│                         └───────────────────────────────────┘                      │
└──────────────────────────────────────────┬─────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│                       Municipal Officer Command Dashboard                          │
│   - KPI Summary Cards (Total, Critical Open, New Today, Resolved, Needs Review)   │
│   - Recharts Category Distribution Bar Chart                                       │
│   - Urgency-sorted queue & multi-criteria filtering                                │
│   - Geographic Hotspot Map (Urgency Circle Markers + Density Heatmap)              │
│   - Officer Detail Drawer (AI vs Original comparison, Reclassification, Resend)    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, Lucide Icons, Recharts.
- **Mapping**: Leaflet + `react-leaflet` with OpenStreetMap tiles (no API key required) and `leaflet.heat` density layer.
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, SQLite, Pydantic v2, `python-multipart`.
- **LLM**: Google Gemini API (`google-genai` SDK) with structured JSON output + deterministic safety layer + resilient keyword fallback.
- **Email**: Resend Python SDK (`resend`) with background dispatch and audit logging.

---

## Quick Start (Under 5 Minutes)

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Backend Setup & Run (One Command)
In a terminal:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*The database automatically initializes and creates tables on startup.*

### 2. Frontend Setup & Run (One Command)
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## Seed Data for Live Hackathon Demo

To instantly populate the dashboard with 40 realistic municipal complaints, deliberate geographic clusters (hotspots around market centers and school zones), Hinglish examples, and status histories:

**Option A (Via Dashboard UI):**
Click the **"Seed Sample Data"** button at the top right of the Officer Dashboard (`/dashboard`).

**Option B (Via Terminal or cURL):**
```bash
curl -X POST http://127.0.0.1:8000/api/dev/seed
```

To clean and reset the entire database:
```bash
curl -X POST http://127.0.0.1:8000/api/dev/reset
```

---

## Configuration & Environment Variables

Copy `.env.example` in `backend/` to `backend/.env`:
```ini
# Google Gemini API Key
# If omitted or invalid, CivicAI seamlessly falls back to the deterministic keyword triage classifier.
GEMINI_API_KEY=your_gemini_api_key_here

# Resend Email API Key
# If omitted, email attempts are safely logged as 'skipped' without failing requests.
RESEND_API_KEY=your_resend_api_key_here

# Sender address (Resend free test accounts use onboarding@resend.dev)
EMAIL_FROM=CivicAI Alerts <onboarding@resend.dev>

# Live Hackathon Demo Override (Recommended)
# For demoing without a custom domain, Resend requires sending to the account owner's email.
# Set this to your email to safely receive all citizen test notifications during the demo:
DEMO_EMAIL_OVERRIDE=your_email@example.com

# Default Map Center Coordinates (Default: New Delhi Center 28.6139, 77.2090)
DEFAULT_MAP_CENTER_LAT=28.6139
DEFAULT_MAP_CENTER_LNG=77.2090

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```

> [!IMPORTANT]
> **Resend Delivery Note:** With Resend's free test sender `onboarding@resend.dev`, emails can only be delivered to the account owner's registered email address. For real recipients a verified domain is needed. Set `DEMO_EMAIL_OVERRIDE` to your registered Resend email address during live hackathon demos!

---

## Core Features & Workflow

### 1. Citizen Submission (`/`)
- Natural free-text complaint input (handles typos, colloquial Hindi/Hinglish).
- **Web Speech API**: Dictate complaints hands-free in English (`en-IN`) or Hindi (`hi-IN`).
- Clickable sample complaints to test critical triggers instantly.
- Mini interactive map for manual pin drop or GPS geolocation detection.
- Optional photo attachment.

### 2. AI Triage & Safety Rules Layer
- Structured output adheres strictly to department mappings:
  - Roads → `Public Works – Roads`
  - Sanitation → `Sanitation & Solid Waste`
  - Water Supply → `Water Supply Board`
  - Drainage → `Drainage & Sewerage`
  - Streetlights & Electrical → `Electrical & Street Lighting`
  - Other → `General Administration`
- **Deterministic Safety Layer**: Scans for imminent life hazards (`live wire`, `sparking`, `open manhole`, `injury`, `accident`, `children`, `flood`). Guarantees urgency is elevated to **Critical** or **High** with an appended safety override reason, and never downgraded.
- **Fail-Safe Fallback**: If Gemini times out (8s limit) or errors, the rule-based keyword classifier runs, marking `confidence=0.4` and `needs_review=true`. The citizen submit flow **never fails**.

### 3. Structured Ticket Card (`/ticket/:id`)
- Displays unique tracking ID (`CIV-00001`), AI summary, urgency badge, department, suggested action, and triage confidence score.
- Real-time confirmation that a notification email has been dispatched.
- Quick lookup box to check status for any tracking ID.

### 4. Municipal Officer Command Dashboard (`/dashboard`)
- **KPI Metrics**: Real-time counts of Total, Critical Open, New Today, Resolved, and Needs Review.
- **Recharts Bar Chart**: Live breakdown across all 6 civic categories.
- **Hotspot Map**:
  - Interactive Leaflet map with urgency circle markers (Critical: Red, High: Amber, Medium: Blue, Low: Green).
  - Density Heatmap toggle powered by `leaflet.heat` weighted by urgency.
  - Resolved filter toggle.
  - Unmapped complaints counter badge.
  - Interactive popups with single-click "Open ticket" action.
- **Officer Detail Drawer**:
  - Side-by-side comparison of citizen input vs AI triage.
  - Editable classification, department, urgency, and assignee.
  - Status progression workflow (New → Assigned → In Progress → Resolved).
  - Transitioning to **Resolved** sends a branded resolution email exactly once (preventing duplicates on toggle).
  - Full audit trail of status transitions and email dispatches with a manual **Resend Email** button.
  - Manual map pin setter for unmapped complaints.
  - Duplicate / Cluster detection: Flags complaints within ~150 meters in the same category.

---

## Running Verification & Acceptance Tests

Execute the automated end-to-end verification suite:
```bash
cd backend
python verify_acceptance.py
```
Validates:
1. Pothole complaint triage & department routing.
2. Safety rules elevation for live wire / children hazards.
3. Fallback classifier resilience and `needs_review` tagging.
4. Email logging in background tasks without request blocking.
5. Single resolution email guarantee on status toggle.
6. Graceful tolerance of invalid email addresses.
7. Bi-directional filtering across table and hotspot map.
