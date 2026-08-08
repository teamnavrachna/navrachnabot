import json
import logging
import re
from typing import Dict, Any, List
from app.core.config import settings

logger = logging.getLogger(__name__)

# Try importing google.generativeai or google-genai
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

class EditorialEngine:
    @staticmethod
    def evaluate_topic(
        topic: Dict[str, Any],
        domain: str,
        style: str,
        previous_post_titles: List[str]
    ) -> Dict[str, Any]:
        """
        Evaluates a candidate topic based on criteria and persona.
        Returns detailed scoring breakdown, approval status, and rejection reason if any.
        """
        title = topic.get("title", "")
        summary = topic.get("summary", "")
        source_name = topic.get("source_name", "Unknown")

        # 1. Attempt Gemini scoring if key available
        if settings.GEMINI_API_KEY and GENAI_AVAILABLE and settings.GEMINI_API_KEY != "mock_key_or_user_key":
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                model = genai.GenerativeModel("gemini-1.5-flash")
                
                prompt = f"""
You are an autonomous technology intelligence evaluator.
Evaluate the following topic candidate for publication.

Agent Persona Domain: {domain}
Agent Editorial Style: {style}
Topic Title: {title}
Topic Summary: {summary}
Source Name: {source_name}
Previously Published Titles: {json.dumps(previous_post_titles[-5:])}

Score the topic across these exact categories (total max 100):
1. domain_relevance (0 to 25): How directly relevant is this to {domain}?
2. industry_impact (0 to 20): Does this shift commercial, technical, or industrial landscapes?
3. novelty (0 to 15): Is this genuinely new or just recycled news?
4. long_term_value (0 to 15): Will this matter in 3-5 years?
5. source_quality (0 to 10): Is the source credible?
6. persona_alignment (0 to 10): Fits the '{style}' tone and perspective?
7. uniqueness (0 to 5): Is it distinct from previously published topics?

Return ONLY a raw JSON object with keys:
"score_domain_relevance", "score_industry_impact", "score_novelty", "score_long_term_value", "score_source_quality", "score_persona_alignment", "score_uniqueness", "total_score", "is_approved", "rejection_reason"

Threshold for approval is {settings.PUBLISH_SCORE_THRESHOLD}. If total_score < threshold, provide a concise rejection_reason explaining why (e.g. "Low relevance to domain", "Excessive marketing hype", "Repetitive topic").
"""
                response = model.generate_content(prompt)
                clean_json = re.sub(r"```json|```", "", response.text).strip()
                result = json.loads(clean_json)
                return result
            except Exception as e:
                logger.warning(f"Gemini evaluation failed, falling back to heuristic scoring: {e}")

        # 2. Heuristic Scoring Engine (Fallback / Offline mode)
        return EditorialEngine._heuristic_evaluate(topic, domain, style, previous_post_titles)

    @staticmethod
    def _heuristic_evaluate(
        topic: Dict[str, Any],
        domain: str,
        style: str,
        previous_post_titles: List[str]
    ) -> Dict[str, Any]:
        title = topic.get("title", "").lower()
        summary = topic.get("summary", "").lower()
        domain_lower = domain.lower()

        # Domain Relevance (0-25)
        keywords = [k for k in domain_lower.split() if len(k) > 3]
        matched_domain = any(k in title or k in summary for k in keywords) or (domain_lower in title or domain_lower in summary) or len(keywords) == 0
        
        # Broad tech / AI fallback matching
        tech_words = ["ai", "model", "robot", "code", "system", "learning", "data", "vision", "tech", "software", "network", "cyber", "agent", "gpu", "chip", "quantum", "open-source"]
        if not matched_domain and any(w in title or w in summary for w in tech_words):
            matched_domain = True

        score_domain_relevance = 24.0 if matched_domain else 18.0

        # Industry Impact (0-20)
        impact_words = ["breakthrough", "launches", "architecture", "release", "benchmark", "infrastructure", "security", "vulnerability", "model", "scale", "standard", "paper", "dataset"]
        matched_impact = sum(1 for w in impact_words if w in title or w in summary)
        score_industry_impact = min(20.0, 14.0 + matched_impact * 2.0)

        # Novelty (0-15)
        novelty_words = ["new", "unveils", "announces", "first", "2.0", "next-gen", "paper", "framework"]
        matched_novelty = sum(1 for w in novelty_words if w in title or w in summary)
        score_novelty = min(15.0, 10.0 + matched_novelty * 2.0)

        # Long term value (0-15)
        score_long_term_value = 13.0

        # Source Quality (0-10)
        source_name = topic.get("source_name", "")
        score_source_quality = 9.0

        # Persona Alignment (0-10)
        score_persona_alignment = 9.0

        # Uniqueness (0-5)
        is_duplicate = any(title[:15] in prev.lower() for prev in previous_post_titles)
        score_uniqueness = 1.0 if is_duplicate else 5.0

        total_score = round(
            score_domain_relevance + score_industry_impact + score_novelty +
            score_long_term_value + score_source_quality + score_persona_alignment + score_uniqueness, 1
        )

        # Strict high-value threshold for editorial approval
        threshold = 82.0
        is_approved = (total_score >= threshold) and not is_duplicate and matched_domain
        rejection_reason = None

        if is_duplicate:
            rejection_reason = f"Topic overlaps significantly with recently published content."
        elif not matched_domain:
            rejection_reason = f"Low relevance to selected domain ({domain})."
        elif total_score < threshold:
            rejection_reason = f"Composite score ({total_score}/100) below editorial quality threshold ({threshold}/100)."

        priority_score = min(98.0, max(75.0, round(total_score * 0.95, 1)))

        return {
            "score_domain_relevance": score_domain_relevance,
            "score_industry_impact": score_industry_impact,
            "score_novelty": score_novelty,
            "score_long_term_value": score_long_term_value,
            "score_source_quality": score_source_quality,
            "score_persona_alignment": score_persona_alignment,
            "score_uniqueness": score_uniqueness,
            "total_score": total_score,
            "priority_score": priority_score,
            "is_approved": is_approved,
            "rejection_reason": rejection_reason
        }
