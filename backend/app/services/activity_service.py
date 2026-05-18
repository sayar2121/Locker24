from sqlalchemy.orm import Session
from app.models.activity import ActivityLog

class ActivityService:
    def log_action(
        self, 
        db: Session, 
        user_id: int, 
        action: str, 
        details: str, 
        ip_address: str = None
    ):
        """Creates a new activity log entry."""
        log_entry = ActivityLog(
            user_id=user_id,
            action=action,
            details=details,
            ip_address=ip_address
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry

    def get_user_logs(self, db: Session, user_id: int, limit: int = 50):
        """Retrieves the latest logs for a user."""
        return db.query(ActivityLog)\
                 .filter(ActivityLog.user_id == user_id)\
                 .order_by(ActivityLog.created_at.desc())\
                 .limit(limit)\
                 .all()

activity_service = ActivityService()
