from pydantic import Field

from app.schemas.common_fields import CoverPageFields, DurationFields
from app.schemas.turn_base import ChatTurnBase, DocumentTypeSlug


class PilotFields(CoverPageFields):
    pilotPeriod: DurationFields = Field(default_factory=DurationFields)
    evaluationPurposes: str = Field("", description="What the customer is evaluating the product for")


class PilotChatTurn(ChatTurnBase):
    document_type: DocumentTypeSlug = "pilot_agreement"
    fields: PilotFields = Field(default_factory=PilotFields)
