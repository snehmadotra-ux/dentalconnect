import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr

from app.api.deps import get_current_admin
from app.core.db import query_all, query_one, execute

router = APIRouter()

class UserStatusUpdate(BaseModel):
    is_active: bool

class InviteCreate(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "DENTIST"
    specialization: Optional[str] = "General Dentistry"

@router.get("/stats")
async def get_clinic_stats(current_admin: dict = Depends(get_current_admin)):
    """Retrieve practice performance and operational metrics (Admin only)."""
    patients_count = query_one("SELECT COUNT(*) as count FROM patient_profiles")
    dentists_count = query_one("SELECT COUNT(*) as count FROM dentist_profiles")
    appointments_count = query_one("SELECT COUNT(*) as count FROM appointments")
    prescriptions_count = query_one("SELECT COUNT(*) as count FROM prescriptions")
    caries_count = query_one("SELECT COUNT(*) as count FROM tooth_records WHERE condition = 'CARIES'")

    return {
        "total_patients": patients_count["count"] if patients_count else 0,
        "total_dentists": dentists_count["count"] if dentists_count else 0,
        "total_appointments": appointments_count["count"] if appointments_count else 0,
        "total_prescriptions": prescriptions_count["count"] if prescriptions_count else 0,
        "active_caries_detected": caries_count["count"] if caries_count else 0,
    }

@router.get("/users")
async def list_all_users(current_admin: dict = Depends(get_current_admin)):
    """List all accounts across the clinic system (Admin only)."""
    users = query_all("""
        SELECT id, email, full_name, phone, role, is_active, zitadel_id, created_at
        FROM users
        ORDER BY created_at DESC
    """)
    return users

@router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    data: UserStatusUpdate,
    current_admin: dict = Depends(get_current_admin),
):
    """Enable or disable user access (Admin only)."""
    user = query_one("SELECT id, role FROM users WHERE id = %s", (user_id,))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent disabling self
    if user_id == current_admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own administrator account")

    active_val = 1 if data.is_active else 0
    execute("UPDATE users SET is_active = %s WHERE id = %s", (active_val, user_id))
    return {"status": "success", "user_id": user_id, "is_active": data.is_active}

@router.post("/invitations")
async def create_invitation(
    data: InviteCreate,
    current_admin: dict = Depends(get_current_admin),
):
    """Generate an invite for a doctor or staff member (Admin only)."""
    # Check if user already exists
    existing = query_one("SELECT id FROM users WHERE email = %s", (data.email.lower(),))
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    invite_id = str(uuid.uuid4())
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    expires = (now + timedelta(days=7)).isoformat()
    now_iso = now.isoformat()

    execute(
        """
        INSERT INTO invitations (id, email, full_name, role, specialization, token, invited_by, expires_at, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            invite_id,
            data.email.lower(),
            data.full_name,
            data.role.upper(),
            data.specialization,
            token,
            current_admin["id"],
            expires,
            now_iso,
        ),
    )

    return {
        "id": invite_id,
        "token": token,
        "email": data.email.lower(),
        "role": data.role.upper(),
        "invite_url": f"/invite?token={token}",
        "expires_at": expires,
    }

@router.get("/invitations")
async def list_invitations(current_admin: dict = Depends(get_current_admin)):
    """List pending practitioner invitations (Admin only)."""
    return query_all("""
        SELECT id, email, full_name, role, specialization, token, expires_at, used_at, created_at
        FROM invitations
        ORDER BY created_at DESC
    """)

@router.get("/verifications/pending")
async def list_pending_verifications(current_admin: dict = Depends(get_current_admin)):
    """List doctor license applications awaiting administrator board verification."""
    sql = """
        SELECT d.id as dentist_id, d.user_id, u.full_name, u.email, u.phone,
               d.license_number, d.specialization, d.years_of_experience,
               d.consultation_fee, d.bio, d.verification_status, u.created_at
        FROM dentist_profiles d
        JOIN users u ON d.user_id = u.id
        WHERE d.verification_status = 'PENDING_VERIFICATION' OR u.is_active = 0
        ORDER BY u.created_at DESC
    """
    return query_all(sql)

@router.post("/verifications/{dentist_id}/approve")
async def approve_dentist_license(
    dentist_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    """Approve a doctor's medical/dental board license and activate their clinical operatory account."""
    dentist = query_one("SELECT * FROM dentist_profiles WHERE id = %s", (dentist_id,))
    if not dentist:
        raise HTTPException(status_code=404, detail="Dentist profile not found")

    now_iso = datetime.now(timezone.utc).isoformat()
    # 1. Update dentist_profiles
    execute(
        """
        UPDATE dentist_profiles
        SET verification_status = 'ACTIVE', verified_at = %s, verified_by = %s
        WHERE id = %s
        """,
        (now_iso, current_admin["id"], dentist_id),
    )

    # 2. Activate user account
    execute(
        """
        UPDATE users
        SET is_active = 1, verification_status = 'ACTIVE'
        WHERE id = %s
        """,
        (dentist["user_id"],),
    )

    return {
        "status": "approved",
        "dentist_id": dentist_id,
        "message": f"License {dentist['license_number']} verified and approved. Doctor account is now active.",
    }

@router.post("/verifications/{dentist_id}/reject")
async def reject_dentist_license(
    dentist_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    """Reject a doctor's credential submission."""
    dentist = query_one("SELECT * FROM dentist_profiles WHERE id = %s", (dentist_id,))
    if not dentist:
        raise HTTPException(status_code=404, detail="Dentist profile not found")

    execute("UPDATE dentist_profiles SET verification_status = 'REJECTED' WHERE id = %s", (dentist_id,))
    execute("UPDATE users SET is_active = 0, verification_status = 'REJECTED' WHERE id = %s", (dentist["user_id"],))

    return {
        "status": "rejected",
        "dentist_id": dentist_id,
        "message": "Practitioner application rejected.",
    }
