import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.core.db import query_all, query_one, execute

router = APIRouter()

class AppointmentCreate(BaseModel):
    dentist_id: str
    patient_id: Optional[str] = None
    start_time: str
    end_time: str
    reason: str
    clinical_notes: Optional[str] = None

class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    clinical_notes: Optional[str] = None

@router.get("/")
async def list_appointments(current_user: dict = Depends(get_current_user)):
    """List appointments filtered by the caller's role (Patient, Dentist, or Admin)."""
    role = current_user.get("role", "PATIENT")
    user_id = current_user["id"]

    if role == "PATIENT":
        pat = query_one("SELECT id FROM patient_profiles WHERE user_id = %s", (user_id,))
        if not pat:
            return []
        sql = """
        SELECT a.id, a.patient_id, a.dentist_id, a.start_time, a.end_time,
               a.status, a.reason, a.clinical_notes, a.created_at,
               pu.full_name as patient_name,
               du.full_name as dentist_name
        FROM appointments a
        JOIN patient_profiles p ON a.patient_id = p.id
        JOIN users pu ON p.user_id = pu.id
        JOIN dentist_profiles d ON a.dentist_id = d.id
        JOIN users du ON d.user_id = du.id
        WHERE a.patient_id = %s
        ORDER BY a.start_time ASC
        """
        return query_all(sql, (pat["id"],))

    elif role == "DENTIST":
        dentist = query_one("SELECT id FROM dentist_profiles WHERE user_id = %s", (user_id,))
        if not dentist:
            return []
        sql = """
        SELECT a.id, a.patient_id, a.dentist_id, a.start_time, a.end_time,
               a.status, a.reason, a.clinical_notes, a.created_at,
               pu.full_name as patient_name,
               du.full_name as dentist_name
        FROM appointments a
        JOIN patient_profiles p ON a.patient_id = p.id
        JOIN users pu ON p.user_id = pu.id
        JOIN dentist_profiles d ON a.dentist_id = d.id
        JOIN users du ON d.user_id = du.id
        WHERE a.dentist_id = %s
        ORDER BY a.start_time ASC
        """
        return query_all(sql, (dentist["id"],))

    else:
        # Admin / Staff: sees all appointments
        sql = """
        SELECT a.id, a.patient_id, a.dentist_id, a.start_time, a.end_time,
               a.status, a.reason, a.clinical_notes, a.created_at,
               pu.full_name as patient_name,
               du.full_name as dentist_name
        FROM appointments a
        JOIN patient_profiles p ON a.patient_id = p.id
        JOIN users pu ON p.user_id = pu.id
        JOIN dentist_profiles d ON a.dentist_id = d.id
        JOIN users du ON d.user_id = du.id
        ORDER BY a.start_time ASC
        """
        return query_all(sql)

@router.post("/")
async def create_appointment(data: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    """Book a new appointment with slot conflict check."""
    role = current_user.get("role", "PATIENT")
    user_id = current_user["id"]

    patient_id = data.patient_id
    if role == "PATIENT" or not patient_id:
        pat = query_one("SELECT id FROM patient_profiles WHERE user_id = %s", (user_id,))
        if pat:
            patient_id = pat["id"]
        elif not patient_id:
            first_pat = query_one("SELECT id FROM patient_profiles LIMIT 1")
            patient_id = first_pat["id"] if first_pat else str(uuid.uuid4())

    # Verify dentist exists
    dentist = query_one("SELECT id FROM dentist_profiles WHERE id = %s", (data.dentist_id,))
    if not dentist:
        raise HTTPException(status_code=404, detail="Selected dentist not found")

    # Conflict check: prevent double booking for the same dentist
    conflict = query_one(
        """
        SELECT id FROM appointments 
        WHERE dentist_id = %s 
          AND status != 'CANCELLED' 
          AND start_time < %s 
          AND end_time > %s
        LIMIT 1
        """,
        (data.dentist_id, data.end_time, data.start_time),
    )
    if conflict:
        raise HTTPException(
            status_code=409,
            detail="Dentist already has an appointment booked in this time window",
        )

    appt_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    
    execute(
        """
        INSERT INTO appointments (id, patient_id, dentist_id, start_time, end_time, status, reason, clinical_notes, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (appt_id, patient_id, data.dentist_id, data.start_time, data.end_time, "CONFIRMED", data.reason, data.clinical_notes, now_iso),
    )

    sql = """
    SELECT a.id, a.patient_id, a.dentist_id, a.start_time, a.end_time,
           a.status, a.reason, a.clinical_notes, a.created_at,
           pu.full_name as patient_name,
           du.full_name as dentist_name
    FROM appointments a
    JOIN patient_profiles p ON a.patient_id = p.id
    JOIN users pu ON p.user_id = pu.id
    JOIN dentist_profiles d ON a.dentist_id = d.id
    JOIN users du ON d.user_id = du.id
    WHERE a.id = %s
    """
    return query_one(sql, (appt_id,))

@router.patch("/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    data: AppointmentUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update appointment status or clinical notes."""
    appt = query_one("SELECT * FROM appointments WHERE id = %s", (appointment_id,))
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if data.status:
        execute("UPDATE appointments SET status = %s WHERE id = %s", (data.status, appointment_id))
    if data.clinical_notes:
        execute("UPDATE appointments SET clinical_notes = %s WHERE id = %s", (data.clinical_notes, appointment_id))

    sql = """
    SELECT a.id, a.patient_id, a.dentist_id, a.start_time, a.end_time,
           a.status, a.reason, a.clinical_notes, a.created_at,
           pu.full_name as patient_name,
           du.full_name as dentist_name
    FROM appointments a
    JOIN patient_profiles p ON a.patient_id = p.id
    JOIN users pu ON p.user_id = pu.id
    JOIN dentist_profiles d ON a.dentist_id = d.id
    JOIN users du ON d.user_id = du.id
    WHERE a.id = %s
    """
    return query_one(sql, (appointment_id,))
