from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class PersonaSchema(BaseModel):
    name: str = Field(default="Navarachna", description="Agent persona name")
    domain: str = Field(description="Technology domain (e.g. Robotics, AI, Cybersecurity)")
    style: Optional[str] = Field(default="Analyst", description="Editorial style (e.g. Analyst, Futurist, Skeptic)")


class AgentInitRequest(BaseModel):
    persona: PersonaSchema


class AgentInitResponse(BaseModel):
    agentId: str


class PostItem(BaseModel):
    id: str
    createdAt: str
    topicTitle: Optional[str] = "Technology Intelligence Update"
    text: str
    rationale: str
    sources: List[str]

    # Enriched intelligence fields
    editorialScore: Optional[float] = 0.0
    confidenceScore: Optional[float] = 0.0
    confidenceLevel: Optional[str] = "MEDIUM"
    scoreBreakdown: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class AgentFeedResponse(BaseModel):
    posts: List[PostItem]
