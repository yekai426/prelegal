from typing import Literal

from pydantic import Field

from app.schemas.common_fields import CoverPageFields, DurationFields
from app.schemas.turn_base import ChatTurnBase, DocumentTypeSlug


class CsaFields(CoverPageFields):
    subscriptionPeriod: DurationFields = Field(default_factory=DurationFields)
    orderDate: str = ""
    nonRenewalNoticeDate: str = ""
    technicalSupport: str = ""
    paymentProcess: Literal["invoicing", "automatic", ""] = ""
    increasedCapAmount: str = ""


class CsaChatTurn(ChatTurnBase):
    document_type: DocumentTypeSlug = "csa"
    fields: CsaFields = Field(default_factory=CsaFields, description="The complete, merged field state after this turn.")
