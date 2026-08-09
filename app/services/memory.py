"""
Memory Engine
=============
Provides editorial memory for the Navarachna intelligence platform.

Responsibilities:
- Retrieve published post history for editorial continuity
- Check new topics against past publications using lightweight Jaccard similarity
- Detect and explain memory-based rejections
- Build memory context for post generation
"""
import re
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.db.models import Post, Topic, Evaluation


def _tokenize(text: str) -> set:
    """Lowercase + split into word tokens, removing stop words."""
    stop_words = {"the", "a", "an", "of", "in", "to", "for", "is", "are", "was", "and",
                  "or", "that", "this", "with", "from", "at", "by", "on", "as", "it"}
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    return {t for t in tokens if t not in stop_words and len(t) > 2}


def jaccard_similarity(text_a: str, text_b: str) -> float:
    """
    Computes Jaccard similarity between two text strings.
    Returns a float between 0.0 (no overlap) and 1.0 (identical).
    """
    tokens_a = _tokenize(text_a)
    tokens_b = _tokenize(text_b)
    if not tokens_a or not tokens_b:
        return 0.0
    intersection = tokens_a & tokens_b
    union = tokens_a | tokens_b
    return round(len(intersection) / len(union), 4)


# Similarity threshold above which a topic is considered a memory duplicate
MEMORY_SIMILARITY_THRESHOLD = 0.45


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
        """Retrieve recent rejected topics for rationale context."""
        results = (
            db.query(Topic, Evaluation)
            .join(Evaluation, Topic.id == Evaluation.topic_id)
            .filter(Topic.agent_id == agent_id, Evaluation.is_approved == False)
            .order_by(Evaluation.created_at.desc())
            .limit(limit)
            .all()
        )
        rejected = []
        for topic, eval_obj in results:
            rejected.append({
                "title": topic.title,
                "reason": eval_obj.rejection_reason or "Low overall editorial score"
            })
        return rejected

    @staticmethod
    def check_similarity(
        candidate_title: str,
        candidate_summary: str,
        db: Session,
        agent_id: str,
        limit: int = 15
    ) -> Dict[str, Any]:
        """
        Checks a candidate topic against recent publications using Jaccard similarity.

        Returns:
            {
                "similar": bool,
                "score": float,          # 0.0–1.0
                "linked_post_id": str,   # ID of most similar past post (or None)
                "reason": str            # Human-readable explanation
            }
        """
        candidate_text = f"{candidate_title} {candidate_summary}"
        recent_posts = (
            db.query(Post)
            .filter(Post.agent_id == agent_id)
            .order_by(Post.created_at.desc())
            .limit(limit)
            .all()
        )

        best_score = 0.0
        best_post_id = None
        best_title = ""

        for post in recent_posts:
            past_title = post.topic.title if post.topic else ""
            past_text = f"{past_title} {post.text[:200]}"
            sim = jaccard_similarity(candidate_text, past_text)
            if sim > best_score:
                best_score = sim
                best_post_id = post.id
                best_title = past_title

        is_similar = best_score >= MEMORY_SIMILARITY_THRESHOLD

        reason = ""
        if is_similar:
            short_title = best_title[:60] + "..." if len(best_title) > 60 else best_title
            reason = (
                f"Rejected by memory engine: A highly similar topic was recently published "
                f"(similarity score: {best_score:.2f}). Past post: '{short_title}' [ID: {best_post_id}]."
            )
        return {
            "similar": is_similar,
            "score": best_score,
            "linked_post_id": best_post_id,
            "reason": reason
        }

    @staticmethod
    def build_memory_context(db: Session, agent_id: str) -> Dict[str, Any]:
        """Build full memory context for post generation and editorial continuity."""
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

    @staticmethod
    def get_diversity_penalty(
        candidate_title: str,
        db: Session,
        agent_id: str,
        window: int = 10
    ) -> float:
        """
        Computes a diversity penalty (0.0–1.0) if the candidate topic's keywords
        heavily overlap with the most recent publications.

        A penalty of 1.0 means heavy repetition; 0.0 means diverse content.
        Used to reduce editorial score — NOT to outright reject.
        """
        recent_posts = (
            db.query(Post)
            .filter(Post.agent_id == agent_id)
            .order_by(Post.created_at.desc())
            .limit(window)
            .all()
        )
        if not recent_posts:
            return 0.0

        candidate_tokens = _tokenize(candidate_title)
        if not candidate_tokens:
            return 0.0

        overlap_count = 0
        for post in recent_posts:
            past_title = post.topic.title if post.topic else ""
            past_tokens = _tokenize(past_title)
            shared = candidate_tokens & past_tokens
            if len(shared) >= 2:  # 2+ shared meaningful words = repetition signal
                overlap_count += 1

        penalty = min(1.0, overlap_count / max(1, len(recent_posts)))
        return round(penalty, 3)
