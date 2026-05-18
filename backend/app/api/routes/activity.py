from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.activity_service import activity_service
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class ActivityLogResponse(BaseModel):
    id: int
    action: str
    details: str
    created_at: datetime

    class Config:
        from_attributes = True

class ActivityLogCreate(BaseModel):
    action: str
    details: str

@router.get("/", response_model=List[ActivityLogResponse])
async def get_activity_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch the latest activity logs for the current user."""
    return activity_service.get_user_logs(db, current_user.id)

@router.post("/", response_model=ActivityLogResponse)
async def create_activity_log(
    activity_in: ActivityLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Log a custom activity from the frontend."""
    return activity_service.log_action(
        db,
        user_id=current_user.id,
        action=activity_in.action.upper(),
        details=activity_in.details
    )
