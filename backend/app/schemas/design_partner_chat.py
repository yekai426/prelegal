from pydantic import Field

from app.schemas.common_fields import CoverPageFields, DurationFields
from app.schemas.turn_base import ChatTurnBase, DocumentTypeSlug


class DesignPartnerFields(CoverPageFields):
    term: DurationFields = Field(default_factory=DurationFields)
    program: str = Field("", description="Description of the design partner program")
    fees: str = ""


class DesignPartnerChatTurn(ChatTurnBase):
    document_type: DocumentTypeSlug = "design_partner_agreement"
    fields: DesignPartnerFields = Field(default_factory=DesignPartnerFields)
