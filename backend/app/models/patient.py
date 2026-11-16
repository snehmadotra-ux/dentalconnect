import uuid
from sqlalchemy import Column, String, Date, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base, GUID

class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    blood_group = Column(String(10), nullable=True)
    emergency_contact = Column(String(100), nullable=True)
    medical_allergies = Column(Text, nullable=True)
    past_dental_history = Column(Text, nullable=True)

    user = relationship("User", back_populates="patient_profile")
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    dental_chart = relationship("DentalChart", back_populates="patient", uselist=False, cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="patient", cascade="all, delete-orphan")
    medical_files = relationship("MedicalFile", back_populates="patient", cascade="all, delete-orphan")
