"""
Editorial Engine
================
Core intelligence evaluation module for Navarachna.

Every candidate topic is evaluated across 7 dimensions:
1. Domain Relevance    (0-25)
2. Industry Impact     (0-20)
3. Novelty             (0-15)
4. Long-Term Value     (0-15)
5. Source Quality      (0-10) — weighted by source credibility registry
6. Persona Alignment   (0-10)
7. Uniqueness          (0-5)  — penalized by memory diversity score

Confidence Score (0-100) is computed from editorial score, credibility, novelty, and memory distance.
Quality Gates block publication if any gate fails.
"""
import json
import logging
import re
from datetime import datetime, timezone
from typing import Dict, Any, List

from app.core.config import settings
from app.services.credibility import get_credibility_score, get_credibility_tier, LOW_CREDIBILITY_THRESHOLD

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

# Quality gate thresholds
QUALITY_GATE_SCORE_MIN = settings.PUBLISH_SCORE_THRESHOLD  # default 70
QUALITY_GATE_CREDIBILITY_MIN = 50.0
QUALITY_GATE_CONFIDENCE_MIN = 40.0


class EditorialEngine:

    @staticmethod
    def evaluate_topic(
        topic: Dict[str, Any],
        domain: str,
        style: str,
        previous_post_titles: List[str],
        memory_similarity: float = 0.0,
        memory_linked_post_id: str = None,
        diversity_penalty: float = 0.0
    ) -> Dict[str, Any]:
        """
        Full editorial evaluation of a candidate topic.

        Args:
            topic: Discovered topic dict with title, summary, source_name, etc.
            domain: Agent's configured domain
            style: Agent's editorial style
            previous_post_titles: Titles of recently published posts
            memory_similarity: 0.0–1.0 similarity score from memory engine
            memory_linked_post_id: ID of the most similar past post
            diversity_penalty: 0.0–1.0 diversity penalty from recent feed

        Returns:
            Full evaluation dict with scores, confidence, quality gates, and decision timeline.
        """
        title = topic.get("title", "")
        summary = topic.get("summary", "")
        source_name = topic.get("source_name", "Unknown")

        # Record decision timeline
        now_iso = datetime.now(timezone.utc).isoformat()
        timeline = {
            "found": topic.get("_timeline_found", now_iso),
            "evaluated": now_iso,
            "memory_checked": None,
            "approved": None,
            "rejected": None,
        }

        # 1. Source Credibility
        source_credibility = get_credibility_score(source_name)

        # 2. Attempt Gemini scoring first
        if settings.GEMINI_API_KEY and GENAI_AVAILABLE and settings.GEMINI_API_KEY not in ("mock_key_or_user_key", ""):
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                model = genai.GenerativeModel("gemini-1.5-flash")

                prompt = f"""You are an autonomous technology intelligence evaluator for the Navarachna platform.
Evaluate this candidate topic for publication.

Agent Domain: {domain}
Agent Editorial Style: {style}
Topic Title: {title}
Topic Summary: {summary}
Source: {source_name} (Credibility: {source_credibility}/100)
Recently Published Titles: {json.dumps(previous_post_titles[-5:])}
Memory Similarity to Past Content: {memory_similarity:.2f} (0=unique, 1=duplicate)
Diversity Penalty: {diversity_penalty:.2f} (0=no repetition, 1=highly repetitive)

Score across these exact categories (total max 100):
1. score_domain_relevance (0-25): Relevance to {domain}
2. score_industry_impact (0-20): Commercial/technical/industrial impact
3. score_novelty (0-15): Genuine novelty vs recycled news
4. score_long_term_value (0-15): Strategic importance in 3-5 years
5. score_source_quality (0-10): Source credibility and trust (hint: source credibility is {source_credibility}/100)
6. score_persona_alignment (0-10): Fit with '{style}' tone
7. score_uniqueness (0-5): Distinctness from previously published topics (reduce if memory_similarity > 0.4)

Also compute:
- total_score: sum of all above
- is_approved: true if total_score >= {QUALITY_GATE_SCORE_MIN} AND source credibility >= {QUALITY_GATE_CREDIBILITY_MIN}
- rejection_reason: if not approved, explain concisely (e.g. "Low domain relevance", "Duplicate topic in memory", "Low source credibility")

Return ONLY a raw JSON object with exactly these keys:
score_domain_relevance, score_industry_impact, score_novelty, score_long_term_value,
score_source_quality, score_persona_alignment, score_uniqueness, total_score,
is_approved, rejection_reason
"""
                response = model.generate_content(prompt)
                clean_json = re.sub(r"```json|```", "", response.text).strip()
                result = json.loads(clean_json)

                # Enrich with derived fields
                result = EditorialEngine._enrich_result(
                    result, source_credibility, memory_similarity,
                    memory_linked_post_id, diversity_penalty, timeline
                )
                return result

            except Exception as e:
                logger.warning(f"Gemini evaluation failed, falling back to heuristic: {e}")

        # 3. Heuristic fallback
        return EditorialEngine._heuristic_evaluate(
            topic, domain, style, previous_post_titles,
            source_credibility, memory_similarity, memory_linked_post_id,
            diversity_penalty, timeline
        )

    @staticmethod
    def _enrich_result(
        result: Dict[str, Any],
        source_credibility: float,
        memory_similarity: float,
        memory_linked_post_id: str,
        diversity_penalty: float,
        timeline: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Adds confidence, credibility, quality gates, and timeline to a scoring result."""
        total_score = result.get("total_score", 0.0)

        # Confidence Score
        novelty_factor = result.get("score_novelty", 10.0) / 15.0  # 0–1
        memory_distance = 1.0 - memory_similarity  # 0=duplicate, 1=unique
        confidence_score = round(
            (total_score * 0.5) +
            (source_credibility * 0.25) +
            (novelty_factor * 100 * 0.15) +
            (memory_distance * 100 * 0.10),
            1
        )
        confidence_score = min(100.0, max(0.0, confidence_score))

        if confidence_score >= 75:
            confidence_level = "HIGH"
        elif confidence_score >= 50:
            confidence_level = "MEDIUM"
        else:
            confidence_level = "LOW"

        # Quality Gate evaluation
        quality_gate_failed = False
        gate_reason = result.get("rejection_reason") or ""

        if total_score < QUALITY_GATE_SCORE_MIN:
            quality_gate_failed = True
            gate_reason = gate_reason or f"Editorial score {total_score:.1f}/100 below threshold {QUALITY_GATE_SCORE_MIN}/100."
        if source_credibility < QUALITY_GATE_CREDIBILITY_MIN:
            quality_gate_failed = True
            gate_reason = f"Source credibility {source_credibility}/100 below minimum threshold. " + gate_reason
        if confidence_score < QUALITY_GATE_CONFIDENCE_MIN:
            quality_gate_failed = True
            gate_reason = f"Confidence score {confidence_score:.1f}/100 too low for publication. " + gate_reason

        if quality_gate_failed:
            result["is_approved"] = False
            result["rejection_reason"] = gate_reason.strip() or "Quality gate failure."

        # Update timeline
        now_iso = datetime.now(timezone.utc).isoformat()
        timeline["memory_checked"] = now_iso
        if result.get("is_approved"):
            timeline["approved"] = now_iso
        else:
            timeline["rejected"] = now_iso

        result.update({
            "source_credibility_score": source_credibility,
            "source_credibility_tier": get_credibility_tier(source_credibility),
            "confidence_score": confidence_score,
            "confidence_level": confidence_level,
            "memory_similarity_score": memory_similarity,
            "memory_linked_post_id": memory_linked_post_id,
            "diversity_penalty": diversity_penalty,
            "priority_score": min(98.0, max(60.0, round(confidence_score * 0.95, 1))),
            "timeline": timeline,
        })
        return result

    @staticmethod
    def _heuristic_evaluate(
        topic: Dict[str, Any],
        domain: str,
        style: str,
        previous_post_titles: List[str],
        source_credibility: float,
        memory_similarity: float,
        memory_linked_post_id: str,
        diversity_penalty: float,
        timeline: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Heuristic scoring engine — runs when Gemini is unavailable."""
        title = topic.get("title", "").lower()
        summary = topic.get("summary", "").lower()
        domain_lower = domain.lower()

        # Domain Relevance (0-25)
        keywords = [k for k in domain_lower.split() if len(k) > 3]
        matched_domain = (
            any(k in title or k in summary for k in keywords)
            or (domain_lower in title or domain_lower in summary)
            or len(keywords) == 0
        )
        tech_words = ["ai", "model", "robot", "system", "learning", "data", "vision", "software",
                      "network", "cyber", "agent", "gpu", "chip", "quantum", "open-source"]
        if not matched_domain and any(w in title or w in summary for w in tech_words):
            matched_domain = True
        score_domain_relevance = 23.0 if matched_domain else 16.0

        # Industry Impact (0-20)
        impact_words = ["breakthrough", "launches", "architecture", "release", "benchmark",
                        "infrastructure", "security", "vulnerability", "model", "scale",
                        "standard", "paper", "dataset", "framework"]
        matched_impact = sum(1 for w in impact_words if w in title or w in summary)
        score_industry_impact = min(20.0, 13.0 + matched_impact * 1.5)

        # Novelty (0-15)
        novelty_words = ["new", "unveils", "announces", "first", "2.0", "next-gen", "paper",
                         "framework", "breakthrough", "launches", "open-source"]
        matched_novelty = sum(1 for w in novelty_words if w in title or w in summary)
        score_novelty = min(15.0, 9.0 + matched_novelty * 1.5)

        # Long-Term Value (0-15)
        score_long_term_value = 13.0

        # Source Quality (0-10) — scaled from credibility registry
        score_source_quality = round(min(10.0, source_credibility / 10.0), 1)

        # Persona Alignment (0-10)
        score_persona_alignment = 8.5

        # Uniqueness (0-5) — penalized by memory and diversity
        is_exact_duplicate = any(title[:15] in prev.lower() for prev in previous_post_titles)
        base_uniqueness = 1.0 if is_exact_duplicate else 5.0
        # Apply diversity penalty (reduce uniqueness score proportionally)
        score_uniqueness = max(0.0, round(base_uniqueness * (1.0 - diversity_penalty * 0.5), 1))

        total_score = round(
            score_domain_relevance + score_industry_impact + score_novelty +
            score_long_term_value + score_source_quality + score_persona_alignment + score_uniqueness,
            1
        )

        # Approval decision
        threshold = float(QUALITY_GATE_SCORE_MIN)
        is_approved = (
            total_score >= threshold
            and not is_exact_duplicate
            and matched_domain
            and source_credibility >= QUALITY_GATE_CREDIBILITY_MIN
            and memory_similarity < 0.45
        )

        rejection_reason = None
        if memory_similarity >= 0.45 and memory_linked_post_id:
            rejection_reason = (
                f"Rejected by memory engine: Too similar to recently published content "
                f"(similarity: {memory_similarity:.2f}, linked post: {memory_linked_post_id})."
            )
        elif is_exact_duplicate:
            rejection_reason = "Topic title overlaps with a recently published post."
        elif not matched_domain:
            rejection_reason = f"Low relevance to selected domain '{domain}'."
        elif source_credibility < QUALITY_GATE_CREDIBILITY_MIN:
            rejection_reason = f"Source credibility score {source_credibility}/100 below minimum threshold {QUALITY_GATE_CREDIBILITY_MIN}/100."
        elif total_score < threshold:
            rejection_reason = f"Composite editorial score {total_score}/100 below quality threshold {threshold}/100."

        result = {
            "score_domain_relevance": score_domain_relevance,
            "score_industry_impact": score_industry_impact,
            "score_novelty": score_novelty,
            "score_long_term_value": score_long_term_value,
            "score_source_quality": score_source_quality,
            "score_persona_alignment": score_persona_alignment,
            "score_uniqueness": score_uniqueness,
            "total_score": total_score,
            "is_approved": is_approved,
            "rejection_reason": rejection_reason,
        }

        return EditorialEngine._enrich_result(
            result, source_credibility, memory_similarity,
            memory_linked_post_id, diversity_penalty, timeline
        )
