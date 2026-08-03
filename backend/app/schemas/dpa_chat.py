from pydantic import BaseModel, Field

from app.schemas.common_fields import PartyFields
from app.schemas.turn_base import ChatTurnBase, DocumentTypeSlug


class DpaFields(BaseModel):
    """DPA has its own Cover Page identifying Provider/Customer, but no
    governing law, liability cap, or term of its own — those live in the host
    Agreement referenced by the DPA."""

    partyOne: PartyFields = Field(default_factory=PartyFields)
    partyTwo: PartyFields = Field(default_factory=PartyFields)
    categoriesOfPersonalData: str = ""
    categoriesOfDataSubjects: str = ""
    specialCategoryData: str = ""
    specialCategoryRestrictions: str = ""
    approvedSubprocessors: str = Field("", description="Names/locations/tasks of approved subprocessors")
    frequencyNatureAndPurpose: str = ""
    durationOfProcessing: str = ""
    governingMemberState: str = Field("", description="Only if EEA SCCs apply")
    providerSecurityContact: str = ""


class DpaChatTurn(ChatTurnBase):
    document_type: DocumentTypeSlug = "dpa"
    fields: DpaFields = Field(default_factory=DpaFields)
