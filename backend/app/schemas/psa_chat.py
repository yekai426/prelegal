from pydantic import Field

from app.schemas.common_fields import CoverPageFields
from app.schemas.turn_base import ChatTurnBase, DocumentTypeSlug


class PsaFields(CoverPageFields):
    customerPolicies: str = ""
    deliverables: str = Field("", description="Description of the SOW Deliverables, if any")
    rejectionPeriod: str = ""
    resubmissionPeriod: str = ""
    fees: str = ""
    paymentPeriod: str = ""
    timeOfAssignment: str = Field("", description="When IP in Deliverables assigns to Customer")
    sowTerm: str = ""
    customerObligations: str = ""
    securityPolicy: str = ""
    insuranceMinimums: str = ""
    increasedCapAmount: str = ""


class PsaChatTurn(ChatTurnBase):
    document_type: DocumentTypeSlug = "psa"
    fields: PsaFields = Field(default_factory=PsaFields)
