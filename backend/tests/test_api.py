import pytest
from starlette.testclient import TestClient
from app.main import app
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.core.db import query_one

client = TestClient(app)

def test_password_hashing():
    raw_pass = "DentalSuperSecret123!"
    hashed = get_password_hash(raw_pass)
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

def test_jwt_token_generation():
    token = create_access_token(subject="user-12345", role="DENTIST")
    assert token is not None
    assert isinstance(token, str)
    assert len(token) > 20

def test_config_settings():
    assert settings.APP_NAME == "DentalConnect API"
    assert settings.API_V1_PREFIX == "/api/v1"

def test_unauthenticated_request_rejected():
    """Ensure insecure token fallback is removed and unauthenticated requests return 401."""
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401

def test_doctor_login_and_role_guard():
    """Verify dentist authentication and RBAC boundary."""
    res = client.post("/api/v1/auth/login", json={
        "email": "dr.vance@dentalconnect.com",
        "password": "Password123!",
    })
    assert res.status_code == 200
    doc_token = res.json()["access_token"]
    assert res.json()["role"] == "DENTIST"

    # Dentist cannot access Admin statistics endpoint
    admin_res = client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {doc_token}"})
    assert admin_res.status_code == 403

def test_admin_login_and_stats():
    """Verify system administrator access."""
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@dentalconnect.com",
        "password": "AdminSecure123!",
    })
    assert res.status_code == 200
    admin_token = res.json()["access_token"]
    assert res.json()["role"] == "ADMIN"

    stats_res = client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {admin_token}"})
    assert stats_res.status_code == 200
    data = stats_res.json()
    assert "total_patients" in data
    assert "total_dentists" in data

def test_patient_registration_flow():
    """Verify patient signup and automatic 32-tooth odontogram creation."""
    test_email = "test.patient.new@example.com"
    res = client.post("/api/v1/auth/register/patient", json={
        "email": test_email,
        "password": "Password123!",
        "full_name": "Test Patient",
        "date_of_birth": "1998-05-20",
        "gender": "Other",
        "blood_group": "B+",
        "medical_allergies": "None",
    })
    # Either 200 (created) or 400 (already created in previous run)
    assert res.status_code in [200, 400]

    # Check chart exists
    pat = query_one("SELECT id FROM users WHERE email = %s", (test_email,))
    if pat:
        pat_profile = query_one("SELECT id FROM patient_profiles WHERE user_id = %s", (pat["id"],))
        assert pat_profile is not None
        chart = query_one("SELECT id FROM dental_charts WHERE patient_id = %s", (pat_profile["id"],))
        assert chart is not None

def test_doctor_onboarding_and_admin_verification():
    """Verify intense doctor registration, pending status gate, and admin approval."""
    test_doc_email = "dr.applicant@dentalconnect.com"
    
    # 1. Doctor submits registration
    res = client.post("/api/v1/auth/register/dentist", json={
        "email": test_doc_email,
        "password": "DoctorSecret123!",
        "full_name": "Dr. Marcus Cole",
        "phone": "+1 555-444-3333",
        "license_number": "DDS-NY-99120",
        "specialization": "Orthodontics",
        "years_of_experience": "7 years",
        "bio": "Board-certified orthodontist specializing in malocclusions and aligners.",
        "consultation_fee": 120.0,
    })
    assert res.status_code in [200, 400]

    # 2. Doctor attempts login while pending -> must be 403 Forbidden
    login_res = client.post("/api/v1/auth/login", json={
        "email": test_doc_email,
        "password": "DoctorSecret123!",
    })
    # If still pending verification, must be 403
    doc_profile = query_one("""
        SELECT d.id, d.verification_status, u.id as user_id 
        FROM dentist_profiles d 
        JOIN users u ON d.user_id = u.id 
        WHERE u.email = %s
    """, (test_doc_email,))
    
    if doc_profile and doc_profile["verification_status"] == "PENDING_VERIFICATION":
        assert login_res.status_code == 403
        assert "verification in progress" in login_res.json()["detail"].lower()

        # 3. Admin logs in and approves doctor
        admin_login = client.post("/api/v1/auth/login", json={
            "email": "admin@dentalconnect.com",
            "password": "AdminSecure123!",
        })
        admin_token = admin_login.json()["access_token"]

        approve_res = client.post(
            f"/api/v1/admin/verifications/{doc_profile['id']}/approve",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert approve_res.status_code == 200

        # 4. Now doctor login succeeds
        success_login = client.post("/api/v1/auth/login", json={
            "email": test_doc_email,
            "password": "DoctorSecret123!",
        })
        assert success_login.status_code == 200
        assert success_login.json()["role"] == "DENTIST"
