import re

from pydantic import Field, field_validator

from app.schemas.common_fields import CoverPageFields
from app.schemas.turn_base import ChatTurnBase, DocumentTypeSlug


class PartnershipFields(CoverPageFields):
    """Party roles are Company/Partner (not Provider/Customer), and the term
    is a fixed End Date rather than a duration — unlike CSA/Pilot/etc."""

    endDate: str = Field("", description="ISO date YYYY-MM-DD, or '' if not yet stated.")
    obligations: str = Field("", description="What each party is committing to do")
    territory: str = Field("", description="Geographic scope of the trademark license")
    brandGuidelines: str = ""
    paymentProcess: str = ""

    @field_validator("endDate")
    @classmethod
    def _validate_end_date_shape(cls, v: str) -> str:
        if v == "" or re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
            return v
        return ""


class PartnershipChatTurn(ChatTurnBase):
    document_type: DocumentTypeSlug = "partnership_agreement"
    fields: PartnershipFields = Field(default_factory=PartnershipFields)
