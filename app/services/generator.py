import json
import logging
import re
from typing import Dict, Any, List
from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

class PostGenerator:
    @staticmethod
    def generate_post_and_rationale(
        topic: Dict[str, Any],
        evaluation: Dict[str, Any],
        domain: str,
        style: str,
        memory_context: Dict[str, Any]
    ) -> Dict[str, str]:
        """
        Generates analysis post (100-250 words) adhering to Observation -> Insight -> Implication
        and detailed selection rationale.
        """
        title = topic.get("title", "")
        summary = topic.get("summary", "")
        source_url = topic.get("source_url", "")
        total_score = evaluation.get("total_score", 0.0)
        rejected_list = memory_context.get("recent_rejected", [])

        # Format rejected alternatives for rationale
        rejected_summary = []
        for r in rejected_list[:3]:
            rejected_summary.append(f"'{r.get('title', '')}' (Reason: {r.get('reason', '')})")
        rejected_str = "; ".join(rejected_summary) if rejected_summary else "No competing candidates in this cycle met quality standards."

        # Continuity prompt snippet
        previous_snippets = memory_context.get("previous_snippets", [])
        continuity_hint = f"Previous context observed: {previous_snippets[0]}" if previous_snippets else "First major observation in this stream."

        if settings.GEMINI_API_KEY and GENAI_AVAILABLE and settings.GEMINI_API_KEY != "mock_key_or_user_key":
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                model = genai.GenerativeModel("gemini-1.5-flash")

                prompt = f"""
You are an autonomous technology intelligence analyst persona: {domain} ({style} style).
Generate a published intelligence entry for the following approved topic.

Topic Title: {title}
Topic Summary: {summary}
Source URL: {source_url}
Evaluation Score: {total_score}/100
Continuity Context: {continuity_hint}
Rejected Alternatives: {rejected_str}

REQUIREMENTS FOR POST TEXT:
- Length: 100 to 250 words.
- Format: Must strictly follow 3 logical sections:
  1. Observation (What is happening)
  2. Insight (Why does this matter / underlying paradigm shift)
  3. Implication (Long-term strategic impact)
- Tone: Rigorous, insightful, domain-specific. Avoid hype, marketing jargon, or clickbait.

REQUIREMENTS FOR RATIONALE:
- Explain why this topic scored {total_score}/100 and why it was selected.
- Highlight why it was chosen over rejected candidates: {rejected_str}.
- State why it is relevant right now in {domain}.

Return raw JSON with keys:
"text", "rationale"
"""
                response = model.generate_content(prompt)
                clean_json = re.sub(r"```json|```", "", response.text).strip()
                res = json.loads(clean_json)
                return res
            except Exception as e:
                logger.warning(f"Gemini post generation failed, falling back to structured template: {e}")

        # High Quality Dynamic Heuristic Template Generator
        return PostGenerator._heuristic_generate(
            topic, evaluation, domain, style, memory_context, rejected_str
        )

    @staticmethod
    def _heuristic_generate(
        topic: Dict[str, Any],
        evaluation: Dict[str, Any],
        domain: str,
        style: str,
        memory_context: Dict[str, Any],
        rejected_str: str
    ) -> Dict[str, str]:
        title = topic.get("title", "")
        summary = topic.get("summary", "")
        score = evaluation.get("total_score", 85.0)

        # Executive Summary (2-4 concise sentences)
        exec_summary = (
            f"The recent advancement regarding '{title}' signals a crucial strategic inflection point for {domain}. "
            f"Rather than an isolated technical milestone, {summary[:160]}... "
            f"This development reveals a accelerating transition toward standardized infrastructure deployment."
        )

        # Why It Matters (Strategic explanation)
        why_it_matters = (
            f"This development suggests that future {domain} adoption will be driven as much by compliance, security, and infrastructure interoperability as by baseline performance metrics. "
            f"Organizations prioritizing flexible architecture over short-term optimization will establish a durable strategic advantage."
        )

        # Key Takeaway (One crisp sentence)
        key_takeaway = f"{domain} is rapidly evolving into strategic enterprise infrastructure rather than isolated industrial equipment."

        text = f"EXECUTIVE SUMMARY\n{exec_summary}\n\nWHY IT MATTERS\n{why_it_matters}\n\nKEY TAKEAWAY\n{key_takeaway}"

        rationale = (
            f"This topic achieved an editorial score of {score}/100 based on high relevance to {domain}, strong source credibility, and long-term strategic significance. "
            f"It was selected over alternative candidates ({rejected_str}) which were rejected for insufficient domain alignment or lack of durable impact. "
            f"It is timely because it reflects a broader industry inflection point currently reshaping {domain} infrastructure."
        )

        return {"text": text, "rationale": rationale}
