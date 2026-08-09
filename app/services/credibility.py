"""
Source Credibility Registry
===========================
Simple lookup table assigning credibility scores (0-100) to known sources.
Used by the Editorial Engine to weight source quality.
Unknown sources default to 40/100.
"""
from typing import Dict

SOURCE_CREDIBILITY: Dict[str, float] = {
    # Research / Academic — Highest Trust
    "arxiv": 95.0,
    "arxiv ai": 95.0,
    "arxiv ml": 95.0,
    "arxiv robotics": 95.0,
    "arxiv security": 95.0,
    "arxiv quantum": 95.0,
    "arxiv statistics": 95.0,
    "arxiv research": 95.0,
    "ieee spectrum": 98.0,
    "ieee spectrum robotics": 98.0,
    "ieee": 98.0,
    "nature": 97.0,
    "science": 97.0,
    "mit tech review": 92.0,
    "mit technology review": 92.0,
    "phys.org": 88.0,
    "phys.org quantum": 88.0,
    # Major Tech Publications
    "techcrunch": 85.0,
    "techcrunch ai": 85.0,
    "wired": 87.0,
    "the verge": 84.0,
    "arstechnica": 89.0,
    "zdnet": 82.0,
    "venturebeat": 81.0,
    # Developer / Community
    "hacker news": 78.0,
    "dev.to": 72.0,
    "github blog": 85.0,
    "github trending": 75.0,
    "product hunt": 68.0,
    # Industry-Specific
    "spacenews": 88.0,
    "nasa tech": 96.0,
    "cleantechnica": 82.0,
    "eetimes": 86.0,
    "semiengineering": 85.0,
    "bleepingcomputer": 83.0,
    "the hacker news": 80.0,
    "aws blog": 88.0,
    "google cloud blog": 88.0,
    "coindesk": 74.0,
    "cointelegraph": 72.0,
    "road to vr": 76.0,
    "uploadvr": 74.0,
    "kdnuggets": 80.0,
    "towards data science": 78.0,
    "tech news daily": 65.0,
    # Low-trust / Synthetic
    "rss source": 55.0,
    "unknown": 40.0,
}

DEFAULT_CREDIBILITY = 40.0
HIGH_CREDIBILITY_THRESHOLD = 80.0
LOW_CREDIBILITY_THRESHOLD = 50.0


def get_credibility_score(source_name: str) -> float:
    """
    Returns a credibility score (0-100) for a named source.
    Uses case-insensitive exact then partial matching.
    """
    if not source_name:
        return DEFAULT_CREDIBILITY
    normalized = source_name.strip().lower()
    if normalized in SOURCE_CREDIBILITY:
        return SOURCE_CREDIBILITY[normalized]
    for key, score in SOURCE_CREDIBILITY.items():
        if key in normalized or normalized in key:
            return score
    return DEFAULT_CREDIBILITY


def get_credibility_tier(score: float) -> str:
    """Human-readable tier label for a credibility score."""
    if score >= 90:
        return "ELITE"
    elif score >= 80:
        return "HIGH"
    elif score >= 65:
        return "MODERATE"
    elif score >= 50:
        return "LOW"
    else:
        return "UNVERIFIED"
