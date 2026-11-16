import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False)
    dentist_id = Column(UUID(as_uuid=True), ForeignKey("dentist_profiles.id", ondelete="CASCADE"), nullable=False)
    clinical_notes = Column(Text, nullable=True)
    issued_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    appointment = relationship("Appointment", back_populates="prescriptions")
    patient = relationship("PatientProfile", back_populates="prescriptions")
    dentist = relationship("DentistProfile", back_populates="prescriptions")
    items = relationship("PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan")

class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    prescription_id = Column(UUID(as_uuid=True), ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False)
    medication_name = Column(String(200), nullable=False) # e.g. "Amoxicillin 500mg"
    dosage = Column(String(100), nullable=False)          # e.g. "1 capsule"
    frequency = Column(String(100), nullable=False)       # e.g. "Every 8 hours"
    duration = Column(String(100), nullable=False)        # e.g. "7 days"
    instructions = Column(Text, nullable=True)            # e.g. "Take after food with full glass of water"

    prescription = relationship("Prescription", back_populates="items")
