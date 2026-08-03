from pydantic import BaseModel, Field

from app.schemas.turn_base import ChatTurnBase, DocumentTypeSlug


class SlaFields(BaseModel):
    """SLA is an addendum riding on a parent Cloud Service Agreement's Cover
    Page — it has no governing law/liability/term/party fields of its own."""

    targetUptimePercent: str = Field("", description="e.g. '99.9%'")
    targetResponseTime: str = ""
    supportChannel: str = ""
    uptimeCreditFormula: str = ""
    responseTimeCreditFormula: str = ""


class SlaChatTurn(ChatTurnBase):
    document_type: DocumentTypeSlug = "sla"
    fields: SlaFields = Field(default_factory=SlaFields)
