from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.core.database import Base

class SharedLink(Base):
    __tablename__ = "shared_links"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())