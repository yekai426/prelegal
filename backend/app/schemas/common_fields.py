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


class CoverPageFields(BaseModel):
    """Shared cover-page variables for Common Paper's standalone full-agreement
    templates (CSA, PSA, Software License, Pilot, Design Partner). Addenda
    (SLA/DPA/BAA/AI Addendum) reference a host Agreement for all of this and
    do NOT use this mixin. Partnership Agreement also does not use this mixin
    since its term is a fixed End Date rather than these shared fields alone.

    partyOne/partyTwo are role-agnostic field names — the actual human label
    (Provider/Customer, Company/Partner, etc.) is metadata carried in each
    document's own FIELD_GUIDE/system prompt and the frontend's document
    registry, never baked into the JSON key. Not every subclass uses every
    field here (e.g. Design Partner Agreement has no liability cap) — unused
    fields simply stay at their empty-string default and the frontend's
    per-type field list decides what's actually shown.
    """

    effectiveDate: str = Field("", description="ISO date YYYY-MM-DD, or '' if not yet stated.")
    governingLaw: str = ""
    chosenCourts: str = Field("", description="e.g. 'courts located in New Castle, DE'")
    generalCapAmount: str = Field("", description="Free-text dollar amount or formula for the liability cap")
    additionalWarranties: str = ""
    partyOne: PartyFields = Field(default_factory=PartyFields)
    partyTwo: PartyFields = Field(default_factory=PartyFields)

    @field_validator("effectiveDate")
    @classmethod
    def _validate_date_shape(cls, v: str) -> str:
        if v == "" or re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
            return v
        return ""
