from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from app.models.appointment import AppointmentStatus

class AppointmentBase(BaseModel):
    dentist_id: UUID
    start_time: datetime
    end_time: datetime
    reason: str
    clinical_notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    patient_id: Optional[UUID] = None # Inferred from current user if patient

class AppointmentUpdate(BaseModel):
    status: Optional[AppointmentStatus] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    clinical_notes: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: UUID
    patient_id: UUID
    dentist_id: UUID
    start_time: datetime
    end_time: datetime
    status: AppointmentStatus
    reason: str
    clinical_notes: Optional[str] = None
    created_at: datetime
    patient_name: Optional[str] = None
    dentist_name: Optional[str] = None

    class Config:
        from_attributes = True
