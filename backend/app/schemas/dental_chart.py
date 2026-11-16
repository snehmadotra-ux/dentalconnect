from typing import List, Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.dental_chart import ToothCondition

class ToothRecordBase(BaseModel):
    tooth_number: int = Field(..., ge=1, le=32)
    condition: ToothCondition = ToothCondition.HEALTHY
    surfaces: Optional[str] = None # e.g. "MOD", "B", "L"
    notes: Optional[str] = None

class ToothRecordUpdate(BaseModel):
    condition: Optional[ToothCondition] = None
    surfaces: Optional[str] = None
    notes: Optional[str] = None

class ToothRecordResponse(ToothRecordBase):
    id: UUID
    chart_id: UUID
    updated_at: datetime

    class Config:
        from_attributes = True

class DentalChartResponse(BaseModel):
    id: UUID
    patient_id: UUID
    created_at: datetime
    updated_at: datetime
    teeth: List[ToothRecordResponse] = []

    class Config:
        from_attributes = True
