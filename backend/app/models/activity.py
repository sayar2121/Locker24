from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False) # e.g., "UPLOAD", "DELETE", "LOGIN"
    details = Column(String) # e.g., "Uploaded Aadhar_Card.pdf"
    ip_address = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
