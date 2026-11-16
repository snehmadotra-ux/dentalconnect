import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from app.api.deps import get_current_user
from app.core.config import settings
from app.core.db import query_one, execute
from app.core.security import verify_password, get_password_hash, create_access_token
from app.schemas.auth import (
    Token,
    LoginRequest,
    PatientRegisterRequest,
    InviteRegisterRequest,
    SyncProfileRequest,
)

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest):
    """Authenticate with email and password via database."""
    user = query_one("SELECT * FROM users WHERE email = %s", (login_data.email.lower(),))
    if not user or not verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    if not user.get("is_active"):
        raise HTTPException(status_code=400, detail="Account is disabled")

    access_token = create_access_token(
        subject=user["id"],
        role=user["role"],
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user["role"],
        user_id=str(user["id"]),
        full_name=user["full_name"],
        email=user["email"],
    )

@router.post("/register/patient", response_model=Token)
async def register_patient(data: PatientRegisterRequest):
    """Public Patient Registration: Intakes patient demographics and initializes an adult 32-tooth odontogram."""
    existing = query_one("SELECT id FROM users WHERE email = %s", (data.email.lower(),))
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    now_iso = datetime.now(timezone.utc).isoformat()
    user_id = str(uuid.uuid4())
    patient_profile_id = str(uuid.uuid4())
    chart_id = str(uuid.uuid4())

    # 1. Create Patient User
    execute(
        """
        INSERT INTO users (id, email, hashed_password, full_name, phone, role, is_active, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            user_id,
            data.email.lower(),
            get_password_hash(data.password),
            data.full_name,
            data.phone,
            "PATIENT",
            1,
            now_iso,
        ),
    )

    # 2. Create Clinical Patient Profile
    execute(
        """
        INSERT INTO patient_profiles (id, user_id, date_of_birth, gender, blood_group, emergency_contact, medical_allergies, past_dental_history)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            patient_profile_id,
            user_id,
            data.date_of_birth,
            data.gender,
            data.blood_group,
            data.emergency_contact,
            data.medical_allergies,
            data.past_dental_history,
        ),
    )

    # 3. Initialize Adult 32-Tooth Dental Chart
    execute(
        "INSERT INTO dental_charts (id, patient_id, created_at, updated_at) VALUES (%s, %s, %s, %s)",
        (chart_id, patient_profile_id, now_iso, now_iso),
    )
    for tooth_num in range(1, 33):
        execute(
            """
            INSERT INTO tooth_records (id, chart_id, tooth_number, condition, surfaces, notes, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (str(uuid.uuid4()), chart_id, tooth_num, "HEALTHY", None, None, now_iso),
        )

    access_token = create_access_token(subject=user_id, role="PATIENT")

    return Token(
        access_token=access_token,
        token_type="bearer",
        role="PATIENT",
        user_id=user_id,
        full_name=data.full_name,
        email=data.email.lower(),
    )

@router.get("/invitations/{token}")
async def validate_invitation(token: str):
    """Public verification of a practitioner invitation token."""
    invite = query_one("SELECT * FROM invitations WHERE token = %s", (token,))
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid invitation token")

    if invite.get("used_at"):
        raise HTTPException(status_code=400, detail="This invitation has already been accepted")

    now_iso = datetime.now(timezone.utc).isoformat()
    if invite["expires_at"] < now_iso:
        raise HTTPException(status_code=400, detail="This invitation has expired")

    return {
        "email": invite["email"],
        "full_name": invite["full_name"],
        "role": invite["role"],
        "specialization": invite.get("specialization") or "General Dentistry",
    }

@router.post("/register/invite", response_model=Token)
async def register_with_invite(data: InviteRegisterRequest):
    """Invite-Only Practitioner Registration: Completes onboarding using a verified invitation token."""
    invite = query_one("SELECT * FROM invitations WHERE token = %s", (data.token,))
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid invitation token")

    if invite.get("used_at"):
        raise HTTPException(status_code=400, detail="This invitation has already been accepted")

    now_iso = datetime.now(timezone.utc).isoformat()
    if invite["expires_at"] < now_iso:
        raise HTTPException(status_code=400, detail="This invitation has expired")

    existing = query_one("SELECT id FROM users WHERE email = %s", (invite["email"].lower(),))
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    user_id = str(uuid.uuid4())
    dentist_profile_id = str(uuid.uuid4())
    role = invite["role"]

    # 1. Create Practitioner User
    execute(
        """
        INSERT INTO users (id, email, hashed_password, full_name, phone, role, is_active, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            user_id,
            invite["email"].lower(),
            get_password_hash(data.password),
            data.full_name or invite["full_name"],
            data.phone,
            role,
            1,
            now_iso,
        ),
    )

    # 2. Create Dentist Profile if DENTIST
    if role == "DENTIST":
        execute(
            """
            INSERT INTO dentist_profiles (id, user_id, license_number, specialization, years_of_experience, bio, consultation_fee)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                dentist_profile_id,
                user_id,
                data.license_number,
                data.specialization or invite.get("specialization") or "General Dentistry",
                data.years_of_experience or "5 years",
                data.bio,
                data.consultation_fee or 90.0,
            ),
        )

    # 3. Mark invite as used
    execute("UPDATE invitations SET used_at = %s WHERE id = %s", (now_iso, invite["id"]))

    access_token = create_access_token(subject=user_id, role=role)

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=role,
        user_id=user_id,
        full_name=data.full_name or invite["full_name"],
        email=invite["email"].lower(),
    )

@router.post("/sync")
async def sync_profile(data: SyncProfileRequest, current_user: dict = Depends(get_current_user)):
    """Update profile fields for an authenticated user (Zitadel or direct)."""
    user_id = current_user["id"]
    role = current_user.get("role", "PATIENT")

    if data.phone:
        execute("UPDATE users SET phone = %s WHERE id = %s", (data.phone, user_id))

    if role == "PATIENT":
        patient = query_one("SELECT id FROM patient_profiles WHERE user_id = %s", (user_id,))
        if patient:
            p_id = patient["id"]
            if data.date_of_birth:
                execute("UPDATE patient_profiles SET date_of_birth = %s WHERE id = %s", (data.date_of_birth, p_id))
            if data.gender:
                execute("UPDATE patient_profiles SET gender = %s WHERE id = %s", (data.gender, p_id))
            if data.blood_group:
                execute("UPDATE patient_profiles SET blood_group = %s WHERE id = %s", (data.blood_group, p_id))
            if data.emergency_contact:
                execute("UPDATE patient_profiles SET emergency_contact = %s WHERE id = %s", (data.emergency_contact, p_id))
            if data.medical_allergies:
                execute("UPDATE patient_profiles SET medical_allergies = %s WHERE id = %s", (data.medical_allergies, p_id))

    elif role in ["DENTIST", "ADMIN"]:
        dentist = query_one("SELECT id FROM dentist_profiles WHERE user_id = %s", (user_id,))
        if dentist:
            d_id = dentist["id"]
            if data.license_number:
                execute("UPDATE dentist_profiles SET license_number = %s WHERE id = %s", (data.license_number, d_id))
            if data.specialization:
                execute("UPDATE dentist_profiles SET specialization = %s WHERE id = %s", (data.specialization, d_id))

    return {"status": "success", "message": "Profile updated successfully"}

@router.get("/me")
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Retrieve the current logged-in user and their profile information."""
    user_id = current_user["id"]
    patient = query_one("SELECT * FROM patient_profiles WHERE user_id = %s", (user_id,))
    dentist = query_one("SELECT * FROM dentist_profiles WHERE user_id = %s", (user_id,))
    
    res = dict(current_user)
    res.pop("hashed_password", None)
    res["patient_profile"] = patient
    res["dentist_profile"] = dentist
    return res

@router.post("/bootstrap-admin")
async def bootstrap_admin():
    """One-time administrative setup: provisions default super admin if not present."""
    existing_admin = query_one("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1")
    if existing_admin:
        return {"status": "already_configured", "message": "Admin account already exists"}

    now_iso = datetime.now(timezone.utc).isoformat()
    admin_id = str(uuid.uuid4())
    admin_pass = settings.ADMIN_PASSWORD

    execute(
        """
        INSERT INTO users (id, email, hashed_password, full_name, phone, role, is_active, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            admin_id,
            "admin@dentalconnect.com",
            get_password_hash(admin_pass),
            "System Administrator",
            "+1 (555) 000-0001",
            "ADMIN",
            1,
            now_iso,
        ),
    )

    return {
        "status": "created",
        "message": "Super Administrator provisioned successfully",
        "email": "admin@dentalconnect.com",
    }
