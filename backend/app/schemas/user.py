from typing import Optional
from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

# Base User schema
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.PATIENT

# User Registration schema
class UserCreate(UserBase):
    password: str
    # Optional dentist details if registering as dentist
    license_number: Optional[str] = None
    specialization: Optional[str] = "General Dentistry"
    consultation_fee: Optional[float] = 75.00
    # Optional patient details if registering as patient
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None

# Response schemas
class PatientProfileResponse(BaseModel):
    id: UUID
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    medical_allergies: Optional[str] = None
    past_dental_history: Optional[str] = None

    class Config:
        from_attributes = True

class DentistProfileResponse(BaseModel):
    id: UUID
    license_number: str
    specialization: str
    years_of_experience: Optional[str] = None
    bio: Optional[str] = None
    consultation_fee: float

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime
    patient_profile: Optional[PatientProfileResponse] = None
    dentist_profile: Optional[DentistProfileResponse] = None

    class Config:
        from_attributes = True
