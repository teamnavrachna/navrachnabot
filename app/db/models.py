import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Integer
from sqlalchemy.orm import relationship
from app.db.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, default="Navarachna")
    domain = Column(String, nullable=False)
    style = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    topics = relationship("Topic", back_populates="agent", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="agent", cascade="all, delete-orphan")
    logs = relationship("PublishingLog", back_populates="agent", cascade="all, delete-orphan")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(String, primary_key=True, default=generate_uuid)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=True)
    source_url = Column(String, nullable=True)
    source_name = Column(String, nullable=True)
    published_date = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    agent = relationship("Agent", back_populates="topics")
    evaluation = relationship("Evaluation", back_populates="topic", uselist=False, cascade="all, delete-orphan")
    post = relationship("Post", back_populates="topic", uselist=False)


class Evaluation(Base):
    """
    Full editorial scoring breakdown for every evaluated topic.
    Includes source credibility, confidence, and memory similarity scores.
    """
    __tablename__ = "evaluations"

    id = Column(String, primary_key=True, default=generate_uuid)
    topic_id = Column(String, ForeignKey("topics.id"), nullable=False, unique=True)

    # Core editorial scores
    score_domain_relevance = Column(Float, default=0.0)
    score_industry_impact = Column(Float, default=0.0)
    score_novelty = Column(Float, default=0.0)
    score_source_quality = Column(Float, default=0.0)
    score_long_term_value = Column(Float, default=0.0)
    score_persona_alignment = Column(Float, default=0.0)
    score_uniqueness = Column(Float, default=0.0)
    total_score = Column(Float, default=0.0)

    # Enriched evaluation fields
    source_credibility_score = Column(Float, default=0.0)   # 0-100: credibility of source
    confidence_score = Column(Float, default=0.0)           # 0-100: publication confidence
    confidence_level = Column(String, default="LOW")         # LOW / MEDIUM / HIGH
    memory_similarity_score = Column(Float, default=0.0)    # 0-1: similarity to past content
    memory_linked_post_id = Column(String, nullable=True)   # ID of similar past post

    is_approved = Column(Boolean, default=False)
    rejection_reason = Column(Text, nullable=True)

    # Decision timeline: ISO timestamps for each stage
    timeline_found = Column(String, nullable=True)
    timeline_evaluated = Column(String, nullable=True)
    timeline_memory_checked = Column(String, nullable=True)
    timeline_approved = Column(String, nullable=True)
    timeline_rejected = Column(String, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    topic = relationship("Topic", back_populates="evaluation")


class Post(Base):
    __tablename__ = "posts"

    id = Column(String, primary_key=True, default=generate_uuid)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    topic_id = Column(String, ForeignKey("topics.id"), nullable=True)
    text = Column(Text, nullable=False)
    rationale = Column(Text, nullable=False)
    sources = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    agent = relationship("Agent", back_populates="posts")
    topic = relationship("Topic", back_populates="post")


class PublishingLog(Base):
    __tablename__ = "publishing_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    status = Column(String, nullable=False)  # SUCCESS, NO_TOPIC, ERROR
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    agent = relationship("Agent", back_populates="logs")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    event_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    metadata_json = Column(JSON, nullable=True, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ApprovedTopicsQueue(Base):
    __tablename__ = "approved_topics_queue"

    id = Column(String, primary_key=True, default=generate_uuid)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=True)
    source = Column(String, nullable=True)
    source_url = Column(String, nullable=True)
    score = Column(Float, default=0.0)
    priority_score = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    confidence_level = Column(String, default="MEDIUM")
    memory_similarity_score = Column(Float, default=0.0)
    source_credibility_score = Column(Float, default=0.0)
    competing_candidates_count = Column(Integer, default=0)
    status = Column(String, default="QUEUED")  # QUEUED, PUBLISHED, EXPIRED
    discovered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    published_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    metadata_json = Column(JSON, nullable=True, default=dict)

    agent = relationship("Agent", backref="queued_topics")


class RejectedTopicRecord(Base):
    """
    Persistent storage for every rejected topic with full audit trail.
    Separate from evaluations table for fast querying and judge inspection.
    """
    __tablename__ = "rejected_topics"

    id = Column(String, primary_key=True, default=generate_uuid)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    title = Column(String, nullable=False)
    source_name = Column(String, nullable=True)
    source_url = Column(String, nullable=True)
    domain = Column(String, nullable=True)
    total_score = Column(Float, default=0.0)
    source_credibility_score = Column(Float, default=0.0)
    memory_similarity_score = Column(Float, default=0.0)
    memory_linked_post_id = Column(String, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    rejection_category = Column(String, nullable=True)  # LOW_RELEVANCE, DUPLICATE, LOW_CREDIBILITY, MEMORY_MATCH, LOW_NOVELTY, DIVERSITY_VIOLATION
    rejected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    agent = relationship("Agent", backref="rejected_records")


class DiscoveryCycleStats(Base):
    """
    Per-cycle discovery statistics for autonomy proof and judge audit.
    Every scan creates one record here.
    """
    __tablename__ = "discovery_cycle_stats"

    id = Column(String, primary_key=True, default=generate_uuid)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    cycle_number = Column(Integer, default=0)
    topics_discovered = Column(Integer, default=0)
    topics_evaluated = Column(Integer, default=0)
    topics_approved = Column(Integer, default=0)
    topics_rejected = Column(Integer, default=0)
    topics_published = Column(Integer, default=0)
    memory_rejections = Column(Integer, default=0)
    duplicate_rejections = Column(Integer, default=0)
    diversity_rejections = Column(Integer, default=0)
    source_failures = Column(Integer, default=0)
    sources_used = Column(JSON, nullable=True, default=list)
    cycle_started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    cycle_completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, nullable=True)

    agent = relationship("Agent", backref="cycle_stats")


class AutonomyProof(Base):
    """
    Persistent autonomy status record. Updated on every cycle.
    Proves the system runs without human intervention.
    """
    __tablename__ = "autonomy_proof"

    id = Column(String, primary_key=True, default=generate_uuid)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False, unique=True)
    total_cycles = Column(Integer, default=0)
    total_publications = Column(Integer, default=0)
    total_topics_evaluated = Column(Integer, default=0)
    total_topics_rejected = Column(Integer, default=0)
    total_memory_rejections = Column(Integer, default=0)
    total_source_failures = Column(Integer, default=0)
    scheduler_status = Column(String, default="ACTIVE")
    last_scan_at = Column(DateTime, nullable=True)
    next_scan_at = Column(DateTime, nullable=True)
    last_publication_at = Column(DateTime, nullable=True)
    system_start_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    agent = relationship("Agent", backref="autonomy_proof", uselist=False)


class DiversityTracker(Base):
    """
    Tracks published domain and theme distribution to prevent repetitive feed.
    """
    __tablename__ = "diversity_tracker"

    id = Column(String, primary_key=True, default=generate_uuid)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    domain = Column(String, nullable=False)
    subtopic = Column(String, nullable=True)
    publication_count = Column(Integer, default=1)
    last_published_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    agent = relationship("Agent", backref="diversity_records")


class SystemHealthLog(Base):
    """
    Tracks system health events for failure tracking and judge audit.
    """
    __tablename__ = "system_health_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    agent_id = Column(String, nullable=True)
    component = Column(String, nullable=False)  # DISCOVERY, EDITORIAL, MEMORY, PUBLISHING, DATABASE, SCHEDULER
    event = Column(String, nullable=False)       # SUCCESS, FAILURE, RECOVERY
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
