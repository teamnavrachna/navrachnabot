import logging
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import Agent, Topic, Evaluation, Post, PublishingLog, ApprovedTopicsQueue
from app.services.discovery import DiscoveryService
from app.services.editorial import EditorialEngine
from app.services.memory import MemoryService
from app.services.generator import PostGenerator
from app.services.activity_logger import ActivityLogger

logger = logging.getLogger(__name__)

# Global state tracker for real-time activity display
CURRENT_ACTIVITY = "Idle (Waiting for Next Scan)"

def run_continuous_discovery_engine_for_agent(agent_id: str):
    """
    ENGINE 1: Continuous Discovery Engine (Runs every 30 seconds)
    Discovers candidates -> Scores -> Filters -> Pushes Approved Candidates to ApprovedTopicsQueue
    """
    global CURRENT_ACTIVITY
    db: Session = SessionLocal()
    try:
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            return

        CURRENT_ACTIVITY = "Scanning Sources"
        ActivityLogger.log_event(
            db, agent_id, "DISCOVERY_CYCLE_STARTED",
            f"Discovery Engine Activated (30s Cycle)",
            f"Scanning live sources for domain '{agent.domain}'..."
        )

        candidates = DiscoveryService.discover_topics(domain=agent.domain, limit=8)
        ActivityLogger.log_event(
            db, agent_id, "TOPICS_DISCOVERED",
            f"Discovered {len(candidates)} Candidate Topics",
            f"Sources scanned: arXiv, IEEE Spectrum, Hacker News, TechCrunch."
        )

        CURRENT_ACTIVITY = "Evaluating Topics"
        memory_context = MemoryService.build_memory_context(db, agent_id)
        previous_titles = memory_context.get("previous_titles", [])

        new_approved_count = 0

        for item in candidates:
            # Check if topic already queued or published
            existing_queue = db.query(ApprovedTopicsQueue).filter(
                ApprovedTopicsQueue.agent_id == agent_id,
                ApprovedTopicsQueue.source_url == item["source_url"]
            ).first()

            if existing_queue:
                continue

            topic_obj = Topic(
                agent_id=agent_id,
                title=item["title"],
                summary=item.get("summary", ""),
                source_url=item.get("source_url", ""),
                source_name=item.get("source_name", ""),
                published_date=item.get("published_date", "")
            )
            db.add(topic_obj)
            db.flush()

            eval_result = EditorialEngine.evaluate_topic(
                topic=item,
                domain=agent.domain,
                style=agent.style,
                previous_post_titles=previous_titles
            )

            eval_obj = Evaluation(
                topic_id=topic_obj.id,
                score_domain_relevance=eval_result.get("score_domain_relevance", 0.0),
                score_industry_impact=eval_result.get("score_industry_impact", 0.0),
                score_novelty=eval_result.get("score_novelty", 0.0),
                score_source_quality=eval_result.get("score_source_quality", 0.0),
                score_long_term_value=eval_result.get("score_long_term_value", 0.0),
                score_persona_alignment=eval_result.get("score_persona_alignment", 0.0),
                score_uniqueness=eval_result.get("score_uniqueness", 0.0),
                total_score=eval_result.get("total_score", 0.0),
                is_approved=eval_result.get("is_approved", False),
                rejection_reason=eval_result.get("rejection_reason")
            )
            db.add(eval_obj)
            db.flush()

            if eval_result.get("is_approved"):
                queued_topic = ApprovedTopicsQueue(
                    agent_id=agent_id,
                    title=topic_obj.title,
                    summary=topic_obj.summary,
                    source=topic_obj.source_name or "RSS Source",
                    source_url=topic_obj.source_url,
                    score=eval_result.get("total_score", 85.0),
                    priority_score=eval_result.get("priority_score", 85.0),
                    status="QUEUED"
                )
                db.add(queued_topic)
                new_approved_count += 1
                ActivityLogger.log_event(
                    db, agent_id, "TOPIC_ACCEPTED",
                    f"Approved Topic Added to Queue: '{topic_obj.title[:40]}...'",
                    f"Score: {eval_result.get('total_score')}/100 | Priority: {eval_result.get('priority_score')}/100."
                )
            else:
                ActivityLogger.log_event(
                    db, agent_id, "TOPIC_REJECTED",
                    f"Rejected Candidate: '{topic_obj.title[:40]}...'",
                    f"Reason: {eval_result.get('rejection_reason')}"
                )

        CURRENT_ACTIVITY = "Updating Queue"
        db.commit()

        # Trigger Dynamic Publishing Engine check after updating queue
        run_dynamic_publishing_engine_for_agent(agent_id, db)

    except Exception as e:
        db.rollback()
        logger.error(f"Error in Continuous Discovery Engine: {e}", exc_info=True)
    finally:
        CURRENT_ACTIVITY = "Idle (Waiting for Next 30s Discovery Scan)"
        db.close()

def run_dynamic_publishing_engine_for_agent(agent_id: str, db: Session):
    """
    ENGINE 2: Dynamic Publishing Engine
    Evaluates ApprovedTopicsQueue pressure, priority scores, and dynamically publishes high-value topics.
    """
    global CURRENT_ACTIVITY

    queued_items = (
        db.query(ApprovedTopicsQueue)
        .filter(ApprovedTopicsQueue.agent_id == agent_id, ApprovedTopicsQueue.status == "QUEUED")
        .order_by(ApprovedTopicsQueue.priority_score.desc())
        .all()
    )

    if not queued_items:
        logger.info("Publishing Engine: Queue is empty. Waiting for next discovery cycle.")
        return

    # Adaptive publishing logic:
    # If high priority topic (>=80) or queue has items waiting, publish top priority candidate!
    top_candidate = queued_items[0]

    CURRENT_ACTIVITY = "Publishing Insight"
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    memory_context = MemoryService.build_memory_context(db, agent_id)

    top_eval = {
        "total_score": top_candidate.score,
        "priority_score": top_candidate.priority_score
    }

    post_data = PostGenerator.generate_post_and_rationale(
        topic={"title": top_candidate.title, "summary": top_candidate.summary, "source_url": top_candidate.source_url},
        evaluation=top_eval,
        domain=agent.domain,
        style=agent.style,
        memory_context=memory_context
    )

    total_posts = db.query(Post).count()
    post_id = f"p{total_posts + 1}"
    while db.query(Post).filter(Post.id == post_id).first():
        total_posts += 1
        post_id = f"p{total_posts + 1}"

    sources = [top_candidate.source_url] if top_candidate.source_url else ["https://arxiv.org"]

    # Store post
    new_post = Post(
        id=post_id,
        agent_id=agent_id,
        topic_id=top_candidate.id,
        text=post_data["text"],
        rationale=post_data["rationale"],
        sources=sources
    )
    db.add(new_post)

    # Update Queue Status to PUBLISHED
    top_candidate.status = "PUBLISHED"
    top_candidate.published_at = datetime.now(timezone.utc)

    # Social Broadcast
    from app.services.social_publisher import SocialPublisher
    x_res = SocialPublisher.publish_to_x(text=post_data["text"], rationale=post_data["rationale"], source_url=top_candidate.source_url)
    li_res = SocialPublisher.publish_to_linkedin(text=post_data["text"], rationale=post_data["rationale"], source_url=top_candidate.source_url)

    ActivityLogger.log_event(
        db, agent_id, "POST_PUBLISHED",
        f"Dynamic Publishing Engine Published Post #{post_id}",
        f"Topic: '{top_candidate.title[:45]}...' (Priority Score: {top_candidate.priority_score}/100)."
    )

    db.commit()
    logger.info(f"Published post #{post_id} from ApprovedTopicsQueue.")

def run_all_active_agents_cycle():
    """Trigger Engine 1 for all active agents."""
    db: Session = SessionLocal()
    try:
        agents = db.query(Agent).all()
        for agent in agents:
            run_continuous_discovery_engine_for_agent(agent.id)
    finally:
        db.close()

# Alias for backwards compatibility with init endpoint
run_autonomous_cycle_for_agent = run_continuous_discovery_engine_for_agent
