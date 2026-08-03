from typing import Literal

from pydantic import Field

from app.schemas.common_fields import CoverPageFields, DurationFields
from app.schemas.turn_base import ChatTurnBase, DocumentTypeSlug


class SoftwareLicenseFields(CoverPageFields):
    subscriptionPeriod: DurationFields = Field(default_factory=DurationFields)
    orderDate: str = ""
    nonRenewalNoticeDate: str = ""
    permittedUses: str = ""
    licenseLimits: str = ""
    paymentProcess: Literal["invoicing", "automatic", ""] = ""
    warrantyPeriod: str = ""
    deletionProcedure: str = ""
    increasedCapAmount: str = ""


class SoftwareLicenseChatTurn(ChatTurnBase):
    document_type: DocumentTypeSlug = "software_license_agreement"
    fields: SoftwareLicenseFields = Field(default_factory=SoftwareLicenseFields)
