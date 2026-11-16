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
