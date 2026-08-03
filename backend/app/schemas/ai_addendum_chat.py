from pydantic import BaseModel, Field

from app.schemas.turn_base import ChatTurnBase, DocumentTypeSlug


class AiAddendumFields(BaseModel):
    """AI Addendum is an addendum to a host Agreement — no governing
    law/liability/term fields of its own."""

    trainingData: str = Field("", description="Data Provider may use to train a Model, if any")
    trainingPurposes: str = ""
    trainingRestrictions: str = ""
    improvementRestrictions: str = Field(
        "", description="Restrictions on using Input/Output for non-training product improvement"
    )


class AiAddendumChatTurn(ChatTurnBase):
    document_type: DocumentTypeSlug = "ai_addendum"
    fields: AiAddendumFields = Field(default_factory=AiAddendumFields)
