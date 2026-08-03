import json
from dataclasses import dataclass

from app.core.config import Settings
from app.schemas.chat import ChatMessage
from app.services.chat.classifier import DocumentClassificationTurn, build_classification_system_prompt
from app.services.chat.registry import get_document_spec
from app.services.llm_client import call_llm_structured


@dataclass
class ChatTurnResult:
    reply: str
    document_type: str | None
    fields: dict
    suggested_document_type: str | None = None


def _build_messages(system_prompt: str, current_fields: dict, history: list[ChatMessage]) -> list[dict]:
    messages = [{"role": "system", "content": system_prompt}]
    if current_fields:
        messages.append({"role": "system", "content": f"Known fields so far (JSON): {json.dumps(current_fields)}"})
    messages.extend({"role": m.role, "content": m.content} for m in history)
    return messages


async def _classify(messages: list[ChatMessage], settings: Settings) -> DocumentClassificationTurn:
    llm_messages = _build_messages(build_classification_system_prompt(), {}, messages)
    return await call_llm_structured(llm_messages, DocumentClassificationTurn, settings)


async def run_chat_turn(
    document_type: str | None, messages: list[ChatMessage], raw_fields: dict, settings: Settings
) -> ChatTurnResult:
    if document_type is None:
        classification = await _classify(messages, settings)
        if classification.document_type is None:
            return ChatTurnResult(
                reply=classification.reply,
                document_type=None,
                fields={},
                suggested_document_type=classification.suggested_document_type,
            )
        document_type = classification.document_type
        raw_fields = {}

    spec = get_document_spec(document_type)  # UnknownDocumentTypeError -> router maps to 404

    try:
        current_fields = spec.fields_schema.model_validate(raw_fields)
    except Exception:
        # Tolerate a garbled client-sent field state — worst case is the
        # assistant re-asks a question it otherwise wouldn't have needed to.
        current_fields = spec.fields_schema()

    llm_messages = _build_messages(spec.system_prompt, current_fields.model_dump(), messages)
    turn = await call_llm_structured(llm_messages, spec.turn_schema, settings)

    if turn.document_type != document_type:
        # Flip: locally re-validate the just-returned fields against the NEW
        # type's schema — no second LLM call. Same-named fields (effectiveDate,
        # governingLaw, parties, ...) carry over automatically via the shared
        # CoverPageFields mixin; everything else resets to that type's defaults.
        new_spec = get_document_spec(turn.document_type)
        try:
            new_fields = new_spec.fields_schema.model_validate(turn.fields.model_dump()).model_dump()
        except Exception:
            new_fields = new_spec.fields_schema().model_dump()
        return ChatTurnResult(reply=turn.reply, document_type=turn.document_type, fields=new_fields)

    return ChatTurnResult(
        reply=turn.reply,
        document_type=document_type,
        fields=turn.fields.model_dump(),
        suggested_document_type=turn.suggested_document_type,
    )
