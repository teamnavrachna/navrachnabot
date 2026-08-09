"""
Activity Logger
===============
Persists real-time autonomous event logs.
Uses flush() instead of commit() so callers control the transaction boundary.
Provides both log_event() (positional) and log() (keyword) interfaces.
"""
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
    ) -> Optional[ActivityLog]:
        """
        Persists an autonomous event log entry.
        Uses db.flush() — the caller is responsible for committing.
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
            db.flush()
            logger.info(f"[Activity] [{event_type}] {title}")
            return log_entry
        except Exception as e:
            logger.error(f"[ActivityLogger] Failed to record event '{event_type}': {e}")
            return None

    @staticmethod
    def log(
        db: Session,
        agent_id: str,
        event_type: str,
        title: str,
        description: str = "",
        metadata_json: Optional[Dict[str, Any]] = None
    ) -> Optional[ActivityLog]:
        """Alias for log_event with keyword arguments."""
        return ActivityLogger.log_event(
            db=db,
            agent_id=agent_id,
            event_type=event_type,
            title=title,
            description=description,
            metadata_json=metadata_json
        )
