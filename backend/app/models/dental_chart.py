import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base

class ToothCondition(str, enum.Enum):
    HEALTHY = "HEALTHY"
    CARIES = "CARIES"
    FILLING = "FILLING"
    CROWN = "CROWN"
    ROOT_CANAL = "ROOT_CANAL"
    IMPLANT = "IMPLANT"
    MISSING = "MISSING"
    EXTRACTION_NEEDED = "EXTRACTION_NEEDED"

class DentalChart(Base):
    __tablename__ = "dental_charts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patient_profiles.id", ondelete="CASCADE"), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    patient = relationship("PatientProfile", back_populates="dental_chart")
    tooth_records = relationship("ToothRecord", back_populates="chart", cascade="all, delete-orphan", order_by="ToothRecord.tooth_number")

class ToothRecord(Base):
    __tablename__ = "tooth_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    chart_id = Column(UUID(as_uuid=True), ForeignKey("dental_charts.id", ondelete="CASCADE"), nullable=False)
    tooth_number = Column(Integer, nullable=False)  # 1 to 32
    condition = Column(Enum(ToothCondition), default=ToothCondition.HEALTHY, nullable=False)
    surfaces = Column(String(50), nullable=True)     # e.g. "MOD" (Mesial, Occlusal, Distal), "B", "L"
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    chart = relationship("DentalChart", back_populates="tooth_records")
