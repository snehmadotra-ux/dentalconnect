# DentalConnect — Project Summary
*Accurate as of current codebase — November 2026*

> **A modern full-stack clinical platform connecting dentists with their patients,** built with Python FastAPI (direct psycopg2 SQL), Next.js 14 (React), and PostgreSQL — featuring real JWT auth, role-based portals, an interactive 32-tooth dental chart (odontogram), appointment booking, digital prescriptions, a treatment procedure ledger, clinical document management, and an Admin control panel.

---

## The Problem

Dental clinics still rely on paper-based records, phone bookings, and hand-written prescriptions. This creates friction on both sides:

- **Patients** struggle to remember past treatments, track prescriptions, or book appointments outside office hours.
- **Dentists** waste time hunting through physical files, re-drawing tooth diagrams per visit, and manually issuing duplicate paperwork.
- **Clinic administrators** have no live visibility into practice performance, pending license verifications, or staff onboarding.

---

## The Solution — DentalConnect

DentalConnect replaces the clipboard and paper chart with a **unified digital platform** where:

- Patients log in and see their own dental health history, upcoming appointments, and issued prescriptions.
- Dentists open a patient file and immediately see a live, color-coded **32-tooth odontogram** (interactive dental chart) — click any tooth to record a cavity, crown, root canal, filling, extraction, or implant.
- Appointments are booked online and tracked through their lifecycle (Pending → Confirmed → In Progress → Completed).
- Prescriptions are issued digitally with itemized medications, dosage, frequency, and clinical notes.
- Clinic admins see live practice-wide stats, verify dentist licenses, manage invitations, and control user access.

---

## What's Actually Built (Current Codebase)

### Backend: Python 3.12 + FastAPI + Direct SQL (psycopg2)

8 endpoint groups registered on the API router:

| Route Prefix | Module | What it does |
|---|---|---|
| `/api/v1/auth` | `auth.py` | Login (JWT), `/me` profile fetch |
| `/api/v1/dentists` | `dentists.py` | Public directory of specialists |
| `/api/v1/patients` | `patients.py` | Patient directory (staff/dentist guarded) |
| `/api/v1/appointments` | `appointments.py` | Book, list, update status |
| `/api/v1/charts` | `charts.py` | 32-tooth odontogram fetch & per-tooth updates |
| `/api/v1/prescriptions` | `prescriptions.py` | Issue and retrieve digital Rx |
| `/api/v1/admin` | `admin.py` | Clinic stats, user management, invitations, license verification |
| `/api/v1/records` | `records.py` | Treatment procedure ledger + clinical document metadata |

**Database layer**: Zero ORM. Pure `psycopg2` with `RealDictCursor` for dictionary results, with automatic SQLite fallback for local testing without Docker (`USE_SQLITE=true`).

---

### Frontend: Next.js 14 + TypeScript + Tailwind CSS

Three separate authenticated portals, each guarded by `useRoleGuard`:

**1. `/login` and `/register` pages (real auth)**
- Full login form wired to JWT backend via `AuthContext`.
- On success, auto-redirects by role: Admin → `/admin`, Dentist → `/doctor`, Patient → `/patient`.
- Password visibility toggle, error handling, loading states.

**2. `/doctor` — Dentist Clinical Dashboard (~1200 lines)**
- Patient directory with search and filtering.
- Interactive odontogram (click any tooth to diagnose surfaces and record condition).
- Appointment calendar view — confirm, complete, or cancel bookings.
- Digital prescription builder — add medications with dosage/frequency/duration.
- **Treatment procedure ledger** — log clinical procedures by ADA/CDT code, tooth number, and fee.
- Clinical documents panel — view attached X-rays and lab slips per patient.

**3. `/patient` — Patient Self-Service Portal**
- Read-only tooth chart — same odontogram but view-only with patient-friendly labels.
- Dentist directory to browse specialists and book directly.
- Appointment booking modal with dentist selection, reason, date, and time.
- Digital prescription card view.

**4. `/admin` — Clinic Administration Panel (~755 lines)**
- Live practice metrics: total patients, dentists, appointments, prescriptions, active cavities detected.
- Full user directory with activate/deactivate controls.
- **Dentist license verification queue** — approve or reject practitioners pending board verification.
- **Invitation system** — generate secure invite links (7-day expiry) for new doctors or staff.
- Invitation history and tracking.

**5. Landing Page (`/`)**
- Unauthenticated marketing/product page with role-aware redirect for logged-in users.

---

## Key Features

### Interactive Odontogram (Dental Chart)
- Full **32-tooth adult dentition map** — Universal Numbering (1–32) with toggle to FDI World Dental notation (11–48).
- Anatomical SVG teeth with clickable crowns, roots, and surface areas.
- Per-tooth **surface recording**: Occlusal (O), Mesial (M), Distal (D), Buccal (B), Lingual (L).
- **Color-coded clinical states**:

| Color | Condition |
|---|---|
| ⬜ White | Healthy |
| 🔴 Rose | Caries (Active Cavity) |
| 🔵 Blue | Composite Filling / Restoration |
| 🟡 Amber | Crown / Porcelain Cap |
| 🟣 Purple | Root Canal (Endodontic Treatment) |
| 🔷 Indigo | Dental Implant |
| ⬛ Slate | Missing / Extracted |
| 🔴 Dark Red | Extraction Needed |

### Role-Based Access Control (RBAC)
Fully enforced on both backend (FastAPI `Depends`) and frontend (`useRoleGuard` hook + `AuthContext`):

| Role | Access |
|---|---|
| `PATIENT` | Own chart (read-only), own appointments, own prescriptions |
| `DENTIST` | Full clinical panel, all patient charts, prescription issuing, treatment ledger |
| `STAFF` | Patient directory, appointments |
| `ADMIN` | Everything above + user management, invitations, license verification |

### Admin: Dentist License Verification
Practitioners register in `PENDING_VERIFICATION` state. Admin reviews, then clicks Approve (or Reject). On approval, the dentist's `is_active` flag is set and they can begin seeing patients.

### Treatment Procedure Ledger
Dentists log completed procedures with ADA/CDT procedure codes (e.g., `D0120` for periodic exam), linked tooth number, clinical description, and fee. Buildable into itemized billing.

### Clinical Documents
Metadata records for X-rays, panoramic scans, consent forms, lab slips, and referral letters — stored with S3 key references for MinIO/AWS object storage.

### Invitation System
Admin generates a secure invite URL (`/invite?token=...`) for a future doctor or staff member. The invite carries role, specialization, and a 7-day expiry. Used invites are tracked.

---

## Technical Architecture

```
┌────────────────────────────────────────────────────────────┐
│                   Browser (All Devices)                     │
│                                                            │
│  Landing /    /login    /doctor     /patient    /admin     │
│  (Public)  (Auth Form) (Dentist)   (Patient)  (Admin)     │
│                Next.js 14 · TypeScript · Tailwind CSS      │
│          AuthContext (JWT) · useRoleGuard (RBAC)           │
└───────────────────────────┬────────────────────────────────┘
                            │  HTTPS REST (JSON)
┌───────────────────────────▼────────────────────────────────┐
│               FastAPI Backend (Python 3.12)                 │
│                                                            │
│  Direct SQL via psycopg2  ·  RealDictCursor                │
│  JWT Auth (python-jose)   ·  bcrypt passwords              │
│  Pydantic v2 Validation   ·  Auto Swagger Docs at /docs    │
│                                                            │
│  /auth  /dentists  /patients  /appointments                │
│  /charts  /prescriptions  /admin  /records                 │
└──────────┬────────────────────┬──────────────────┬─────────┘
           │ psycopg2           │ redis-py          │ boto3
┌──────────▼──────┐  ┌──────────▼─────────┐  ┌────▼─────────┐
│ PostgreSQL 16   │  │   Redis 7           │  │  MinIO (S3)  │
│ (All clinical   │  │   (Cache / queue)   │  │  (X-Rays &   │
│  data + auth)   │  │                    │  │   documents) │
└─────────────────┘  └────────────────────┘  └─────────────-┘
         All three run in Docker via docker-compose.yml
```

---

## Database Tables

| Table | Purpose |
|---|---|
| `users` | Shared identity: email, hashed password, role, `is_active`, `zitadel_id` (SSO ready) |
| `patient_profiles` | DOB, gender, blood group, allergies, dental history |
| `dentist_profiles` | License, specialization, fee, `verification_status`, `verified_at` |
| `appointments` | Bookings with status lifecycle |
| `dental_charts` | One chart per patient (anchor for tooth records) |
| `tooth_records` | 32 rows per chart: condition, surfaces, clinical notes |
| `prescriptions` | Linked to appointment and dentist |
| `prescription_items` | Medication name, dosage, frequency, duration, instructions |
| `treatment_records` | Procedure ledger per patient (ADA code, tooth, fee) |
| `clinical_documents` | X-Ray/scan/form metadata with S3 key |
| `invitations` | Invite tokens for onboarding doctors and staff |

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Backend** | Python 3.12 + FastAPI | Fast async REST API, auto Swagger docs |
| **Database Driver** | psycopg2 (direct SQL) | Raw SQL control, no ORM abstraction overhead |
| **Local Fallback** | sqlite3 (built-in) | Runs without Docker for instant testing |
| **Auth** | JWT (python-jose) + bcrypt | Stateless token auth, secure password storage |
| **Frontend** | Next.js 14 + TypeScript | App Router, type-safe, SEO-ready |
| **Styling** | Tailwind CSS + Lucide Icons | Utility-first, clinically clean aesthetic |
| **State/Auth** | React Context API | Global session and role management |
| **Database** | PostgreSQL 16 (Docker) | Relational integrity, production-proven |
| **Storage** | MinIO / S3-compatible | Secure X-Ray and document file storage |
| **Cache/Queue** | Redis 7 (Docker) | Session caching, reminder task queue |
| **Containerization** | Docker + Docker Compose | One command to boot the entire stack |

---

## Project Repository Layout

```
dentalconnect/
├── docker-compose.yml              ← Boots PostgreSQL 16, Redis 7, MinIO, Backend & Frontend
├── .env.example                    ← All environment variables documented
├── PLAN.md                         ← Architecture plan
├── README.md
│
├── backend/                        ← Python 3.12 FastAPI Application
│   ├── app/
│   │   ├── core/
│   │   │   ├── db.py               ← psycopg2 helpers: get_connection, query_all, query_one, execute
│   │   │   ├── config.py           ← Pydantic settings (env vars)
│   │   │   └── security.py         ← JWT create/verify + bcrypt
│   │   ├── api/
│   │   │   ├── deps.py             ← get_current_user / get_current_dentist / get_current_admin
│   │   │   └── v1/endpoints/
│   │   │       ├── auth.py         ← /login, /me
│   │   │       ├── dentists.py     ← Specialist directory
│   │   │       ├── patients.py     ← Patient records
│   │   │       ├── appointments.py ← Booking & status lifecycle
│   │   │       ├── charts.py       ← 32-Tooth odontogram API
│   │   │       ├── prescriptions.py← Digital Rx
│   │   │       ├── admin.py        ← Stats, users, invitations, license verification
│   │   │       └── records.py      ← Treatment ledger + clinical documents
│   │   ├── main.py                 ← App entrypoint, CORS, table init on startup
│   │   └── seed.py                 ← Seeds demo dentist, patient, 32-tooth chart, appointment, Rx
│   ├── tests/test_api.py           ← Unit tests (security + config)
│   └── requirements.txt
│
└── frontend/                       ← Next.js 14 TypeScript Application
    └── src/
        ├── app/
        │   ├── page.tsx            ← Public landing page
        │   ├── (auth)/
        │   │   ├── login/page.tsx  ← Login form with JWT auth
        │   │   └── register/page.tsx
        │   ├── doctor/page.tsx     ← Dentist clinical dashboard (~1200 lines)
        │   ├── patient/page.tsx    ← Patient self-service portal
        │   ├── admin/page.tsx      ← Clinic admin panel (~755 lines)
        │   └── invite/page.tsx     ← Invitation acceptance flow
        ├── components/
        │   ├── layout/AppNavbar.tsx           ← Authenticated nav with logout + role badge
        │   ├── odontogram/
        │   │   ├── DentalChart.tsx            ← Interactive 32-tooth SVG chart (Dentist)
        │   │   └── ToothModal.tsx             ← Condition picker + surface selector
        │   ├── patient/
        │   │   ├── PatientOdontogram.tsx      ← Read-only tooth chart (Patient view)
        │   │   └── PatientToothModal.tsx      ← Info-only tooth detail modal
        │   ├── appointments/AppointmentBookingModal.tsx
        │   └── prescriptions/PrescriptionCard.tsx
        ├── context/AuthContext.tsx  ← JWT session, login/logout, refreshUser
        ├── hooks/useRoleGuard.ts    ← Protects pages by role, redirects unauthorized
        ├── lib/api.ts              ← Typed API client (all endpoints)
        └── types/dental.ts         ← TypeScript interfaces for all clinical data
```

---

## How to Run

### Option A: Full Docker Stack (one command)
```bash
docker compose up -d
```

### Option B: Local Development (fastest iteration)
```bash
# 1. Start infrastructure
docker compose up -d db redis minio

# 2. Backend
cd backend
source venv/bin/activate
python app/seed.py           # Seeds demo data into the DB
uvicorn app.main:app --reload --port 8000

# 3. Frontend (new terminal)
cd frontend
npm run dev
```

**Access:**
- **Web App**: http://localhost:3000
- **Swagger API Docs**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001 (user: `minio_admin`, pass: `minio_secret_key`)

---

## Demo Credentials

| Role | Email | Password | Portal |
|---|---|---|---|
| Dentist | dr.vance@dentalconnect.com | Password123! | http://localhost:3000/doctor |
| Patient | alex@example.com | Password123! | http://localhost:3000/patient |

> To access `/admin`, register a new user via API and manually set `role = 'ADMIN'` in the database.

---

## What You Can Demo (Live Flow)

1. **Open** `http://localhost:3000` → click "Get Started" → lands at `/login`.
2. **Log in as Dentist** → auto-redirected to `/doctor` dashboard.
3. **Search for patient "Alex Miller"** → open their profile → see the interactive odontogram.
4. **Click Tooth #14** (shown in rose/red) → see the caries record → change condition to "Filling".
5. **Switch to Appointments tab** → confirm or complete an appointment.
6. **Issue a Prescription** → add Amoxicillin with dosage and instructions.
7. **Log out** → log in as Patient (alex@example.com) → see the read-only dental chart.
8. **Book an appointment** via the patient portal with dentist selection.
9. **API Explorer** → visit `http://localhost:8000/docs` for all 20+ live REST endpoints.

---

## Potential Next Steps

- **Email Notifications**: Celery + Redis worker to send appointment reminders 24h before visits.
- **PDF Prescriptions**: Print-ready prescription view with clinic branding and QR code.
- **X-Ray Upload UI**: Drag-and-drop to MinIO/S3 with presigned URL generation.
- **WebSocket Chat**: Real-time doctor–patient messaging for follow-up questions.
- **Mobile App**: REST API is fully mobile-ready — plug in React Native or Flutter.
- **Zitadel SSO**: `zitadel_id` column is already on the `users` table, ready for enterprise SSO integration.
- **HIPAA Audit Log**: Append-only table tracking every access to patient records.
- **Billing Module**: Extend treatment ledger with invoice generation and insurance codes.

---

*Built with Python 3.12 · FastAPI · psycopg2 (direct SQL) · Next.js 14 · TypeScript · Tailwind CSS · PostgreSQL 16 · Redis · MinIO · Docker*
