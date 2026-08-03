import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.common_fields import DurationFields, PartyFields
from app.schemas.turn_base import ChatTurnBase, DocumentTypeSlug


class MndaFields(BaseModel):
    """Mirrors frontend MndaFormData exactly. Empty string is this codebase's
    existing sentinel for "not yet specified" (see frontend/lib/coverPageText.ts)
    — the model must use it, never invent a plausible-sounding placeholder."""

    purpose: str = Field("", description="Why confidential info may be used. '' if not yet stated by the user.")
    effectiveDate: str = Field("", description="ISO date YYYY-MM-DD, or '' if not yet stated.")
    mndaTermChoice: Literal["expires", "continues"] = "expires"
    mndaTermDuration: DurationFields = Field(default_factory=DurationFields)
    confidentialityTermChoice: Literal["duration", "perpetuity"] = "duration"
    confidentialityTermDuration: DurationFields = Field(default_factory=DurationFields)
    governingLaw: str = ""
    jurisdiction: str = ""
    modifications: str = ""
    partyOne: PartyFields = Field(default_factory=PartyFields)
    partyTwo: PartyFields = Field(default_factory=PartyFields)

    @field_validator("effectiveDate")
    @classmethod
    def _validate_date_shape(cls, v: str) -> str:
        if v == "" or re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
            return v
        return ""  # self-heal a malformed date rather than fail the turn


class MndaChatTurn(ChatTurnBase):
    """The single combined structured-output schema for one MNDA chat turn —
    one LiteLLM call returns both, never two separate calls."""

    document_type: DocumentTypeSlug = "mutual_nda"
    fields: MndaFields = Field(default_factory=MndaFields, description="The complete, merged field state after this turn.")
