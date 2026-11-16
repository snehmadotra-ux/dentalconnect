import uuid
from sqlalchemy import Column, String, Text, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base, GUID

class DentistProfile(Base):
    __tablename__ = "dentist_profiles"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    license_number = Column(String(100), unique=True, nullable=False)
    specialization = Column(String(150), default="General Dentistry")
    years_of_experience = Column(String(50), nullable=True)
    bio = Column(Text, nullable=True)
    consultation_fee = Column(Numeric(10, 2), default=75.00)

    user = relationship("User", back_populates="dentist_profile")
    appointments = relationship("Appointment", back_populates="dentist")
    prescriptions = relationship("Prescription", back_populates="dentist")
