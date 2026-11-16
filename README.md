# DentalConnect 🦷

> **A modern, specialized clinical platform connecting dentists with their patients.** Features an interactive 32-tooth odontogram (dental chart), appointment scheduling, digital prescriptions, and an open REST API ready for mobile applications.

---

## 🌟 Key Features

* **Interactive Odontogram (Dental Chart)**:
  * Visual 32-tooth adult dentition map with **Universal (1–32)** and **FDI (11–48)** notation toggle.
  * Clickable tooth anatomy: crown, surfaces (Occlusal, Mesial, Distal, Buccal, Lingual), and roots.
  * Color-coded clinical diagnoses: Healthy, Caries (Decay), Restored (Filling), Crown, Root Canal, Implant, and Missing.
* **Patient Portal**:
  * Seamless online appointment booking with dentist selection and symptoms.
  * Digital prescriptions (medications, dosage, frequency, and instructions).
  * Treatment history and tooth status tracking.
* **Dentist Clinical Dashboard**:
  * Inspect patient odontograms tooth-by-tooth.
  * Update diagnostic records, record caries, and log treatment notes.
  * Issue digital prescriptions.
* **Full-Stack Architecture**:
  * **Backend**: Python 3.12 + FastAPI + SQLAlchemy 2.0 (Async) + Alembic.
  * **Frontend**: Next.js 14+ (App Router) + TypeScript + Tailwind CSS + Lucide Icons.
  * **Database & Infrastructure**: PostgreSQL 16, Redis 7, MinIO (S3 object storage for X-Rays) in Docker.

---

## 🚀 Quick Start with Docker (Recommended)

Run the entire ecosystem (Database, Redis, MinIO, FastAPI Backend, and Next.js Frontend) in one command:

```bash
docker compose up -d
```

Once started:
* **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
* **FastAPI Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **MinIO Object Storage Console**: [http://localhost:9001](http://localhost:9001) (User: `minio_admin`, Password: `minio_secret_key`)

To seed sample clinical data:
```bash
docker compose exec backend python app/seed.py
```

---

## 💻 Native Local Development (Without Docker for App)

You can also run PostgreSQL, Redis, and MinIO in Docker while running the Backend and Frontend on your machine with live hot-reloading:

### 1. Start Database & Infrastructure
```bash
docker compose up -d db redis minio
```

### 2. Run Backend (FastAPI)
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python app/seed.py      # Seed demo dentist, patient & dental chart
uvicorn app.main:app --reload --port 8000
```

### 3. Run Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Demo Credentials

* **Dentist Account**:
  * Email: `dr.vance@dentalconnect.com`
  * Password: `Password123!`
* **Patient Account**:
  * Email: `alex@example.com`
  * Password: `Password123!`

---

## 📁 Repository Structure

```
dentalconnect/
├── docker-compose.yml       # PostgreSQL 16, Redis, MinIO, Backend & Frontend
├── .env.example             # Configuration template
├── setup-prereqs.sh         # System prerequisites installer
│
├── backend/                 # FastAPI REST API
│   ├── app/
│   │   ├── api/v1/          # Endpoints (auth, dentists, patients, appointments, charts, prescriptions)
│   │   ├── core/            # Config, security, database session
│   │   ├── models/          # SQLAlchemy ORM models (ToothRecord, DentalChart, User, Appointment)
│   │   ├── schemas/         # Pydantic v2 validation models
│   │   ├── main.py          # FastAPI application entrypoint
│   │   └── seed.py          # Demo database seeder
│   ├── alembic/             # Database migrations
│   └── requirements.txt
│
└── frontend/                # Next.js 14+ App Router
    ├── src/
    │   ├── app/             # App pages & layouts
    │   ├── components/
    │   │   ├── odontogram/  # 32-Tooth interactive Dental Chart & ToothModal
    │   │   ├── appointments/# Booking modals
    │   │   └── prescriptions/# Digital Rx cards
    │   ├── lib/             # API client
    │   └── types/           # TypeScript definitions
    └── package.json
```
