import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
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
    __tablename__ = "evaluations"

    id = Column(String, primary_key=True, default=generate_uuid)
    topic_id = Column(String, ForeignKey("topics.id"), nullable=False, unique=True)
    score_domain_relevance = Column(Float, default=0.0)
    score_industry_impact = Column(Float, default=0.0)
    score_novelty = Column(Float, default=0.0)
    score_source_quality = Column(Float, default=0.0)
    score_long_term_value = Column(Float, default=0.0)
    score_persona_alignment = Column(Float, default=0.0)
    score_uniqueness = Column(Float, default=0.0)
    total_score = Column(Float, default=0.0)
    is_approved = Column(Boolean, default=False)
    rejection_reason = Column(Text, nullable=True)
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
    event_type = Column(String, nullable=False)  # AGENT_INITIALIZED, TOPICS_DISCOVERED, TOPIC_EVALUATED, etc.
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
    status = Column(String, default="QUEUED")  # QUEUED, PUBLISHED, EXPIRED
    discovered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    published_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    metadata_json = Column(JSON, nullable=True, default=dict)

    agent = relationship("Agent", backref="queued_topics")


