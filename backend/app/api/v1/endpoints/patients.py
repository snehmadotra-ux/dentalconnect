from fastapi import APIRouter, HTTPException, Depends
from app.api.deps import get_current_user, get_current_dentist
from app.core.db import query_all, query_one

router = APIRouter()

@router.get("/")
async def list_patients(current_dentist: dict = Depends(get_current_dentist)):
    """List all registered patients (Dentist / Admin only)."""
    sql = """
    SELECT p.id, p.user_id, u.full_name, u.email, u.phone,
           p.date_of_birth, p.gender, p.blood_group,
           p.emergency_contact, p.medical_allergies, p.past_dental_history
    FROM patient_profiles p
    JOIN users u ON p.user_id = u.id
    ORDER BY u.full_name ASC
    """
    return query_all(sql)

@router.get("/{patient_id}")
async def get_patient(patient_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieve detailed clinical profile of a patient."""
    # If patient, verify they are only requesting their own record
    if current_user.get("role") == "PATIENT":
        user_pat = query_one("SELECT id FROM patient_profiles WHERE user_id = %s", (current_user["id"],))
        if not user_pat or (user_pat["id"] != patient_id and current_user["id"] != patient_id):
            raise HTTPException(status_code=403, detail="Forbidden: You can only view your own patient profile")

    sql = """
    SELECT p.id, p.user_id, u.full_name, u.email, u.phone,
           p.date_of_birth, p.gender, p.blood_group,
           p.emergency_contact, p.medical_allergies, p.past_dental_history
    FROM patient_profiles p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = %s OR p.user_id = %s
    """
    patient = query_one(sql, (patient_id, patient_id))
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return patient
