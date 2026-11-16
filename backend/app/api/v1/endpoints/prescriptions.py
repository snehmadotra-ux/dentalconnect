import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.api.deps import get_current_user, get_current_dentist
from app.core.db import query_all, query_one, execute

router = APIRouter()

class RxItemCreate(BaseModel):
    medication_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None

class RxCreate(BaseModel):
    patient_id: str
    appointment_id: Optional[str] = None
    clinical_notes: Optional[str] = None
    items: List[RxItemCreate]

@router.get("/")
async def list_prescriptions(current_user: dict = Depends(get_current_user)):
    """Retrieve prescriptions filtered by role (Patient or Dentist/Admin)."""
    role = current_user.get("role", "PATIENT")
    user_id = current_user["id"]

    if role == "PATIENT":
        pat = query_one("SELECT id FROM patient_profiles WHERE user_id = %s", (user_id,))
        if not pat:
            return []
        sql = """
            SELECT p.id, p.patient_id, p.dentist_id, p.appointment_id,
                   p.clinical_notes, p.issued_at,
                   du.full_name as dentist_name,
                   pu.full_name as patient_name
            FROM prescriptions p
            JOIN patient_profiles pt ON p.patient_id = pt.id
            JOIN users pu ON pt.user_id = pu.id
            JOIN dentist_profiles d ON p.dentist_id = d.id
            JOIN users du ON d.user_id = du.id
            WHERE p.patient_id = %s
            ORDER BY p.issued_at DESC
        """
        prescriptions = query_all(sql, (pat["id"],))
    else:
        sql = """
            SELECT p.id, p.patient_id, p.dentist_id, p.appointment_id,
                   p.clinical_notes, p.issued_at,
                   du.full_name as dentist_name,
                   pu.full_name as patient_name
            FROM prescriptions p
            JOIN patient_profiles pt ON p.patient_id = pt.id
            JOIN users pu ON pt.user_id = pu.id
            JOIN dentist_profiles d ON p.dentist_id = d.id
            JOIN users du ON d.user_id = du.id
            ORDER BY p.issued_at DESC
        """
        prescriptions = query_all(sql)

    for p in prescriptions:
        items = query_all(
            "SELECT * FROM prescription_items WHERE prescription_id = %s",
            (p["id"],),
        )
        p["items"] = items

    return prescriptions

@router.post("/")
async def create_prescription(
    data: RxCreate,
    current_dentist: dict = Depends(get_current_dentist),
):
    """Issue a new digital prescription (Dentist or Admin only)."""
    # Find dentist profile
    dentist = query_one("SELECT id FROM dentist_profiles WHERE user_id = %s", (current_dentist["id"],))
    if not dentist:
        # Fallback to first dentist
        dentist = query_one("SELECT id FROM dentist_profiles LIMIT 1")
        if not dentist:
            raise HTTPException(status_code=400, detail="Dentist profile required to issue prescription")

    # Verify patient profile
    patient = query_one("SELECT id FROM patient_profiles WHERE id = %s", (data.patient_id,))
    if not patient:
        patient = query_one("SELECT id FROM patient_profiles WHERE user_id = %s", (data.patient_id,))
        if patient:
            data.patient_id = patient["id"]
        else:
            raise HTTPException(status_code=404, detail="Patient profile not found")

    rx_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    execute(
        """
        INSERT INTO prescriptions (id, patient_id, dentist_id, appointment_id, clinical_notes, issued_at)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (rx_id, data.patient_id, dentist["id"], data.appointment_id, data.clinical_notes, now_iso),
    )

    for item in data.items:
        execute(
            """
            INSERT INTO prescription_items (id, prescription_id, medication_name, dosage, frequency, duration, instructions)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (str(uuid.uuid4()), rx_id, item.medication_name, item.dosage, item.frequency, item.duration, item.instructions),
        )

    # Return created Rx
    sql = """
        SELECT p.id, p.patient_id, p.dentist_id, p.appointment_id,
               p.clinical_notes, p.issued_at,
               du.full_name as dentist_name,
               pu.full_name as patient_name
        FROM prescriptions p
        JOIN patient_profiles pt ON p.patient_id = pt.id
        JOIN users pu ON pt.user_id = pu.id
        JOIN dentist_profiles d ON p.dentist_id = d.id
        JOIN users du ON d.user_id = du.id
        WHERE p.id = %s
    """
    rx = query_one(sql, (rx_id,))
    if rx:
        rx["items"] = query_all("SELECT * FROM prescription_items WHERE prescription_id = %s", (rx_id,))
    return rx
