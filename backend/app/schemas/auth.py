from typing import Optional
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    full_name: str
    email: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class PatientRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    medical_allergies: Optional[str] = None
    past_dental_history: Optional[str] = None

class InviteRegisterRequest(BaseModel):
    token: str
    password: str
    full_name: str
    phone: Optional[str] = None
    license_number: str
    specialization: Optional[str] = None
    years_of_experience: Optional[str] = None
    bio: Optional[str] = None
    consultation_fee: Optional[float] = 90.0

class SyncProfileRequest(BaseModel):
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    medical_allergies: Optional[str] = None
    license_number: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
