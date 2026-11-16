from typing import List, Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel

class PrescriptionItemBase(BaseModel):
    medication_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None

class PrescriptionItemCreate(PrescriptionItemBase):
    pass

class PrescriptionItemResponse(PrescriptionItemBase):
    id: UUID
    prescription_id: UUID

    class Config:
        from_attributes = True

class PrescriptionCreate(BaseModel):
    patient_id: UUID
    appointment_id: Optional[UUID] = None
    clinical_notes: Optional[str] = None
    items: List[PrescriptionItemCreate]

class PrescriptionResponse(BaseModel):
    id: UUID
    patient_id: UUID
    dentist_id: UUID
    appointment_id: Optional[UUID] = None
    clinical_notes: Optional[str] = None
    issued_at: datetime
    items: List[PrescriptionItemResponse] = []
    dentist_name: Optional[str] = None
    patient_name: Optional[str] = None

    class Config:
        from_attributes = True
