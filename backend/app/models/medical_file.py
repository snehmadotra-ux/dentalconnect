import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base

class FileType(str, enum.Enum):
    XRAY_PANORAMIC = "XRAY_PANORAMIC"
    XRAY_BITEWING = "XRAY_BITEWING"
    XRAY_PERIAPICAL = "XRAY_PERIAPICAL"
    PHOTO_INTRAORAL = "PHOTO_INTRAORAL"
    SCAN_3D = "SCAN_3D"
    REPORT_PDF = "REPORT_PDF"

class MedicalFile(Base):
    __tablename__ = "medical_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False)
    file_type = Column(Enum(FileType), default=FileType.XRAY_PANORAMIC, nullable=False)
    s3_key = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=True) # bytes
    content_type = Column(String(100), default="image/jpeg")
    uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    patient = relationship("PatientProfile", back_populates="medical_files")
