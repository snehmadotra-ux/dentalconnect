import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.api.deps import get_current_user, get_current_dentist
from app.core.db import query_all, query_one, execute

router = APIRouter()

# Schemas
class TreatmentCreate(BaseModel):
    patient_id: str
    appointment_id: Optional[str] = None
    tooth_number: Optional[int] = None
    procedure_code: Optional[str] = "D0120"
    description: str
    fee: Optional[float] = 0.0
    status: Optional[str] = "COMPLETED"
    notes: Optional[str] = None

class DocumentCreate(BaseModel):
    patient_id: str
    category: str = "XRAY" # XRAY, CONSENT_FORM, LAB_SLIP, REFERRAL
    title: str
    file_name: str
    s3_key: str
    mime_type: Optional[str] = "image/jpeg"
    file_size: Optional[int] = None
    notes: Optional[str] = None

@router.get("/patients/{patient_id}/treatments")
async def get_patient_treatments(
    patient_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Retrieve treatment and procedure ledger records for a patient."""
    role = current_user.get("role", "PATIENT")
    if role == "PATIENT":
        # Verify caller owns this patient profile
        caller_pat = query_one("SELECT id FROM patient_profiles WHERE user_id = %s", (current_user["id"],))
        if not caller_pat or caller_pat["id"] != patient_id:
            raise HTTPException(status_code=403, detail="Cannot access another patient's clinical ledger")

    sql = """
        SELECT t.*, d_u.full_name as dentist_name
        FROM treatment_records t
        JOIN dentist_profiles d ON t.dentist_id = d.id
        JOIN users d_u ON d.user_id = d_u.id
        WHERE t.patient_id = %s
        ORDER BY t.performed_at DESC
    """
    return query_all(sql, (patient_id,))

@router.post("/treatments")
async def create_treatment_record(
    data: TreatmentCreate,
    current_dentist: dict = Depends(get_current_dentist),
):
    """Record a clinical procedure or ledger entry in patient history (Dentist or Admin)."""
    dentist = query_one("SELECT id FROM dentist_profiles WHERE user_id = %s", (current_dentist["id"],))
    if not dentist:
        raise HTTPException(status_code=400, detail="Dentist profile not configured")

    patient = query_one("SELECT id FROM patient_profiles WHERE id = %s", (data.patient_id,))
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    rec_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    execute(
        """
        INSERT INTO treatment_records (id, patient_id, dentist_id, appointment_id, tooth_number, procedure_code, description, fee, status, notes, performed_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            rec_id,
            data.patient_id,
            dentist["id"],
            data.appointment_id,
            data.tooth_number,
            data.procedure_code,
            data.description,
            data.fee or 0.0,
            data.status or "COMPLETED",
            data.notes,
            now_iso,
        ),
    )

    return {
        "id": rec_id,
        "patient_id": data.patient_id,
        "dentist_id": dentist["id"],
        "tooth_number": data.tooth_number,
        "procedure_code": data.procedure_code,
        "description": data.description,
        "fee": data.fee or 0.0,
        "status": data.status or "COMPLETED",
        "notes": data.notes,
        "performed_at": now_iso,
    }

@router.get("/patients/{patient_id}/documents")
async def get_patient_documents(
    patient_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Retrieve clinical document metadata (X-Rays, Scans, Consents) for a patient."""
    role = current_user.get("role", "PATIENT")
    if role == "PATIENT":
        caller_pat = query_one("SELECT id FROM patient_profiles WHERE user_id = %s", (current_user["id"],))
        if not caller_pat or caller_pat["id"] != patient_id:
            raise HTTPException(status_code=403, detail="Cannot access another patient's documents")

    sql = """
        SELECT cd.*, d_u.full_name as dentist_name
        FROM clinical_documents cd
        LEFT JOIN dentist_profiles d ON cd.dentist_id = d.id
        LEFT JOIN users d_u ON d.user_id = d_u.id
        WHERE cd.patient_id = %s
        ORDER BY cd.uploaded_at DESC
    """
    return query_all(sql, (patient_id,))

@router.post("/documents")
async def create_document_record(
    data: DocumentCreate,
    current_dentist: dict = Depends(get_current_dentist),
):
    """Attach metadata for a clinical document, radiograph or lab slip (Dentist/Admin)."""
    dentist = query_one("SELECT id FROM dentist_profiles WHERE user_id = %s", (current_dentist["id"],))
    dentist_id = dentist["id"] if dentist else None

    doc_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    execute(
        """
        INSERT INTO clinical_documents (id, patient_id, dentist_id, category, title, file_name, s3_key, mime_type, file_size, notes, uploaded_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            doc_id,
            data.patient_id,
            dentist_id,
            data.category,
            data.title,
            data.file_name,
            data.s3_key,
            data.mime_type or "image/jpeg",
            data.file_size,
            data.notes,
            now_iso,
        ),
    )

    return {
        "id": doc_id,
        "patient_id": data.patient_id,
        "category": data.category,
        "title": data.title,
        "file_name": data.file_name,
        "s3_key": data.s3_key,
        "uploaded_at": now_iso,
    }
