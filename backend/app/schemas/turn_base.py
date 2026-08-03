from typing import Literal

from pydantic import BaseModel, Field

from app.core.catalog import load_catalog

DocumentTypeSlug = Literal[tuple(entry.key for entry in load_catalog())]


class ChatTurnBase(BaseModel):
    """Shared by every per-document turn schema so the model can confirm or
    flip the document type each turn, without a second LLM call."""

    document_type: DocumentTypeSlug = Field(
        description="Normally unchanged from the current document type. Only set to a "
        "DIFFERENT catalog key if the user clearly asks to switch document types."
    )
    reply: str = Field(description="Plain-prose reply shown verbatim in the chat UI. No markdown.")
    suggested_document_type: DocumentTypeSlug | None = Field(
        default=None,
        description="Only set when the user asks for something entirely outside the catalog "
        "(not just a different catalog document): the closest single catalog match, for a "
        "'Did you mean X?' suggestion. Leave document_type unchanged in that case, and leave "
        "this null unless exactly one catalog type is a plausible close match.",
    )
