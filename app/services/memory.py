from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import Post, Topic, Evaluation

class MemoryService:
    @staticmethod
    def get_published_posts(db: Session, agent_id: str, limit: int = 10) -> List[Post]:
        """Retrieve recent published posts for an agent."""
        return (
            db.query(Post)
            .filter(Post.agent_id == agent_id)
            .order_by(Post.created_at.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_rejected_evaluations(db: Session, agent_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Retrieve recent rejected topics and their reasons for rationale generation."""
        results = (
            db.query(Topic, Evaluation)
            .join(Evaluation, Topic.id == Evaluation.topic_id)
            .filter(Topic.agent_id == agent_id, Evaluation.is_approved == False)
            .order_by(Evaluation.created_at.desc())
            .limit(limit)
            .all()
        )
        rejected = []
        for topic, eval in results:
            rejected.append({
                "title": topic.title,
                "reason": eval.rejection_reason or "Low overall editorial score"
            })
        return rejected

    @staticmethod
    def build_memory_context(db: Session, agent_id: str) -> Dict[str, Any]:
        """Build historical memory context to provide editorial continuity."""
        recent_posts = MemoryService.get_published_posts(db, agent_id, limit=5)
        recent_rejected = MemoryService.get_rejected_evaluations(db, agent_id, limit=5)

        previous_titles = [post.topic.title if post.topic else "Insight" for post in recent_posts]
        previous_snippets = [post.text[:100] + "..." for post in recent_posts]

        return {
            "previous_titles": previous_titles,
            "previous_snippets": previous_snippets,
            "recent_rejected": recent_rejected,
            "post_count": len(recent_posts)
        }
