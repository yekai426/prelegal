import json

from app.core.config import Settings
from app.schemas.chat import ChatMessage
from app.services.chat.registry import get_document_spec
from app.services.llm_client import call_llm_structured


def _build_messages(system_prompt: str, current_fields: dict, history: list[ChatMessage]) -> list[dict]:
    return [
        {"role": "system", "content": system_prompt},
        {"role": "system", "content": f"Known fields so far (JSON): {json.dumps(current_fields)}"},
        *({"role": m.role, "content": m.content} for m in history),
    ]


async def run_chat_turn(
    document_type: str, messages: list[ChatMessage], raw_fields: dict, settings: Settings
) -> tuple[str, dict]:
    spec = get_document_spec(document_type)

    try:
        current_fields = spec.fields_schema.model_validate(raw_fields)
    except Exception:
        # Tolerate a garbled client-sent field state — worst case is the
        # assistant re-asks a question it otherwise wouldn't have needed to.
        current_fields = spec.fields_schema()

    llm_messages = _build_messages(spec.system_prompt, current_fields.model_dump(), messages)
    turn = await call_llm_structured(llm_messages, spec.turn_schema, settings)
    return turn.reply, turn.fields.model_dump()
