import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator


def _clamp_duration(value: object) -> int:
    try:
        as_int = int(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return 1
    return as_int if as_int >= 1 else 1


class DurationFields(BaseModel):
    duration: int = Field(default=1, ge=1, description="Whole number >= 1")
    unit: Literal["day", "month", "year"] = "year"

    @field_validator("duration", mode="before")
    @classmethod
    def _clamp(cls, v: object) -> int:
        # Mirrors frontend clampDuration() — self-heal instead of failing the
        # whole structured-output parse over a numeric quirk.
        return _clamp_duration(v)


class PartyFields(BaseModel):
    printName: str = ""
    title: str = ""
    company: str = ""
    noticeAddress: str = ""


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


class MndaChatTurn(BaseModel):
    """The single combined structured-output schema for one MNDA chat turn —
    one LiteLLM call returns both, never two separate calls."""

    reply: str = Field(description="Plain-prose reply shown verbatim in the chat UI. No markdown.")
    fields: MndaFields = Field(description="The complete, merged field state after this turn.")
