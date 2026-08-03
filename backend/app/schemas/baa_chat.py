import re

from pydantic import BaseModel, Field, field_validator

from app.schemas.common_fields import PartyFields
from app.schemas.turn_base import ChatTurnBase, DocumentTypeSlug


class BaaFields(BaseModel):
    """BAA has its own Cover Page identifying Provider/Company, but no
    governing law/liability/general term of its own — those live in the host
    Agreement, other than its own BAA Effective Date."""

    partyOne: PartyFields = Field(default_factory=PartyFields)
    partyTwo: PartyFields = Field(default_factory=PartyFields)
    baaEffectiveDate: str = Field("", description="ISO date YYYY-MM-DD, or '' if not yet stated.")
    breachNotificationPeriod: str = ""
    limitations: str = Field(
        "", description="Any restrictions on Provider offshoring, de-identifying, or aggregating PHI"
    )

    @field_validator("baaEffectiveDate")
    @classmethod
    def _validate_date_shape(cls, v: str) -> str:
        if v == "" or re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
            return v
        return ""


class BaaChatTurn(ChatTurnBase):
    document_type: DocumentTypeSlug = "baa"
    fields: BaaFields = Field(default_factory=BaaFields)
