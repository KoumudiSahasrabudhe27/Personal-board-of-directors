from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: dict[str, Any] = Field(default_factory=dict)


class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: T | None = None
    error: ErrorDetail | None = None


class QuestionRequest(BaseModel):
    question: str


class BoardAnalysis(BaseModel):
    situation_summary: str
    ceo_perspective: str
    investor_perspective: str
    engineer_perspective: str
    psychologist_perspective: str
    mentor_perspective: str
    friend_perspective: str
    agreements: str
    disagreements: str
    consensus_recommendation: str
    action_plan: str
    confidence_score: float = Field(ge=0, le=100)

    def to_persona_responses(self) -> dict[str, str]:
        return {
            "ceo": self.ceo_perspective,
            "investor": self.investor_perspective,
            "engineer": self.engineer_perspective,
            "psychologist": self.psychologist_perspective,
            "mentor": self.mentor_perspective,
            "friend": self.friend_perspective,
        }


class MemoryItem(BaseModel):
    id: str
    question: str
    verdict: str
    timestamp: str | None = None
    snippet: str | None = None


class BoardSessionData(BaseModel):
    question: str
    analysis: BoardAnalysis
    responses: dict[str, str]
    verdict: str
    memories_used: list[MemoryItem] = Field(default_factory=list)
    saved_decision_id: str | None = None
    memory_saved: bool = False


class HealthData(BaseModel):
    ok: bool = True
    personas: int
    foundry_iq: bool
    deployment: str


class SaveDecisionData(BaseModel):
    id: str
    saved: bool
    timestamp: str | None = None
    reason: str | None = None


# Backward-compatible aliases.
AnalyzeRequest = QuestionRequest
AnalyzeResponse = BoardAnalysis
