from pydantic import BaseModel, Field

from app.core.catalog import load_catalog
from app.schemas.turn_base import DocumentTypeSlug

GREETING = (
    "Hi! I can help you draft a legal document. What kind of agreement are you "
    "looking to create?"
)


def _catalog_listing() -> str:
    return "\n".join(f"- {entry.key}: {entry.name} — {entry.description}" for entry in load_catalog())


def build_classification_system_prompt() -> str:
    return f"""You are a legal-document intake assistant. Based on the conversation so
far, decide which ONE of the following document types the user wants to create:
{_catalog_listing()}

If the user's request doesn't reasonably match any of these, set document_type
to null. If exactly one catalog type is a plausible close match to what they
asked for, set suggested_document_type to that catalog key; otherwise leave it
null. Keep your reply short and conversational — if you can't help with what
they asked for, say so plainly and, if you have a suggestion, mention it.
"""


class DocumentClassificationTurn(BaseModel):
    reply: str = Field(description="Plain-prose reply shown verbatim in the chat UI. No markdown.")
    document_type: DocumentTypeSlug | None = Field(
        default=None, description="The single best-matching catalog key, or null if nothing reasonably matches."
    )
    suggested_document_type: DocumentTypeSlug | None = Field(
        default=None,
        description="Only set when document_type is null: the closest single catalog match, for a "
        "'Did you mean X?' suggestion. Leave null if nothing is a plausible match.",
    )
