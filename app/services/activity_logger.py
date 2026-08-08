import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import ActivityLog

logger = logging.getLogger(__name__)

class ActivityLogger:
    @staticmethod
    def log_event(
        db: Session,
        agent_id: str,
        event_type: str,
        title: str,
        description: str = "",
        metadata_json: Optional[Dict[str, Any]] = None
    ) -> ActivityLog:
        """
        Persists a real-time autonomous event log for the activity stream timeline.
        """
        try:
            log_entry = ActivityLog(
                agent_id=agent_id,
                event_type=event_type,
                title=title,
                description=description,
                metadata_json=metadata_json or {}
            )
            db.add(log_entry)
            db.commit()
            db.refresh(log_entry)
            logger.info(f"[{event_type}] {title} - {description[:60]}")
            return log_entry
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to record activity log: {e}")
            return None
