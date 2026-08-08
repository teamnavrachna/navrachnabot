from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

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

    class Config:
        from_attributes = True

class AgentFeedResponse(BaseModel):
    posts: List[PostItem]
