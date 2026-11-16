import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.api.deps import get_current_user, get_current_dentist
from app.core.db import query_all, query_one, execute

router = APIRouter()

class ToothUpdate(BaseModel):
    condition: Optional[str] = None
    surfaces: Optional[str] = None
    notes: Optional[str] = None

@router.get("/patients/{patient_id}")
async def get_chart(patient_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieve 32-tooth odontogram records for a patient."""
    # Verify patient profile exists
    patient = query_one("SELECT * FROM patient_profiles WHERE id = %s", (patient_id,))
    if not patient:
        # Also check if user passed their user_id instead of profile id
        patient = query_one("SELECT * FROM patient_profiles WHERE user_id = %s", (patient_id,))
        if patient:
            patient_id = patient["id"]
        else:
            raise HTTPException(status_code=404, detail="Patient profile not found")

    # Authorization: Patients can only view their own chart; Dentists and Admins can view any chart
    if current_user.get("role") == "PATIENT":
        user_patient = query_one("SELECT id FROM patient_profiles WHERE user_id = %s", (current_user["id"],))
        if not user_patient or user_patient["id"] != patient_id:
            raise HTTPException(status_code=403, detail="You can only access your own dental chart")

    chart = query_one("SELECT * FROM dental_charts WHERE patient_id = %s", (patient_id,))
    now_iso = datetime.now(timezone.utc).isoformat()

    # If chart does not exist yet, provision an adult 32-tooth chart for this patient
    if not chart:
        chart_id = str(uuid.uuid4())
        execute(
            "INSERT INTO dental_charts (id, patient_id, created_at, updated_at) VALUES (%s, %s, %s, %s)",
            (chart_id, patient_id, now_iso, now_iso),
        )
        for t_num in range(1, 33):
            execute(
                "INSERT INTO tooth_records (id, chart_id, tooth_number, condition, surfaces, notes, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (str(uuid.uuid4()), chart_id, t_num, "HEALTHY", None, None, now_iso),
            )
        chart = query_one("SELECT * FROM dental_charts WHERE id = %s", (chart_id,))

    teeth = query_all(
        "SELECT * FROM tooth_records WHERE chart_id = %s ORDER BY tooth_number ASC",
        (chart["id"],)
    )

    return {
        "id": chart["id"],
        "patient_id": chart["patient_id"],
        "created_at": chart["created_at"],
        "updated_at": chart["updated_at"],
        "teeth": teeth,
    }

@router.patch("/patients/{patient_id}/teeth/{tooth_number}")
async def update_tooth(
    patient_id: str,
    tooth_number: int,
    data: ToothUpdate,
    current_dentist: dict = Depends(get_current_dentist),
):
    """Update a tooth's condition, surfaces, or notes (Dentist or Admin only)."""
    if tooth_number < 1 or tooth_number > 32:
        raise HTTPException(status_code=400, detail="Tooth number must be between 1 and 32")

    patient = query_one("SELECT * FROM patient_profiles WHERE id = %s", (patient_id,))
    if not patient:
        patient = query_one("SELECT * FROM patient_profiles WHERE user_id = %s", (patient_id,))
        if patient:
            patient_id = patient["id"]
        else:
            raise HTTPException(status_code=404, detail="Patient profile not found")

    chart = query_one("SELECT * FROM dental_charts WHERE patient_id = %s", (patient_id,))
    now_iso = datetime.now(timezone.utc).isoformat()

    if not chart:
        chart_id = str(uuid.uuid4())
        execute(
            "INSERT INTO dental_charts (id, patient_id, created_at, updated_at) VALUES (%s, %s, %s, %s)",
            (chart_id, patient_id, now_iso, now_iso),
        )
        for t_num in range(1, 33):
            execute(
                "INSERT INTO tooth_records (id, chart_id, tooth_number, condition, surfaces, notes, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (str(uuid.uuid4()), chart_id, t_num, "HEALTHY", None, None, now_iso),
            )
        chart = query_one("SELECT * FROM dental_charts WHERE id = %s", (chart_id,))

    # Update tooth
    if data.condition:
        execute(
            "UPDATE tooth_records SET condition = %s, updated_at = %s WHERE chart_id = %s AND tooth_number = %s",
            (data.condition, now_iso, chart["id"], tooth_number),
        )
    if data.surfaces is not None:
        execute(
            "UPDATE tooth_records SET surfaces = %s, updated_at = %s WHERE chart_id = %s AND tooth_number = %s",
            (data.surfaces, now_iso, chart["id"], tooth_number),
        )
    if data.notes is not None:
        execute(
            "UPDATE tooth_records SET notes = %s, updated_at = %s WHERE chart_id = %s AND tooth_number = %s",
            (data.notes, now_iso, chart["id"], tooth_number),
        )

    # Touch chart updated_at
    execute("UPDATE dental_charts SET updated_at = %s WHERE id = %s", (now_iso, chart["id"]))

    return query_one(
        "SELECT * FROM tooth_records WHERE chart_id = %s AND tooth_number = %s",
        (chart["id"], tooth_number),
    )
