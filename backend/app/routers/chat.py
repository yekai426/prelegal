from fastapi import APIRouter, Depends, HTTPException, status

from app.core.catalog import catalog_by_key
from app.core.config import Settings, get_settings
from app.schemas.chat import ChatGreetingResponse, ChatRequest, ChatResponse
from app.services import chat_service
from app.services.chat import classifier
from app.services.chat.registry import UnknownDocumentTypeError, get_document_spec
from app.services.llm_client import (
    LlmRateLimitedError,
    LlmResponseInvalidError,
    LlmTimeoutError,
    LlmUnavailableError,
)

router = APIRouter()


def _label(document_type: str | None) -> str | None:
    if document_type is None:
        return None
    entry = catalog_by_key().get(document_type)
    return entry.name if entry else None


@router.get("/greeting", response_model=ChatGreetingResponse)
def greeting(document_type: str | None = None) -> ChatGreetingResponse:
    if document_type is None:
        return ChatGreetingResponse(reply=classifier.GREETING, document_type=None)
    try:
        spec = get_document_spec(document_type)
    except UnknownDocumentTypeError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"Unknown document_type: {document_type}")
    return ChatGreetingResponse(reply=spec.greeting, document_type=document_type)


@router.post("/message", response_model=ChatResponse)
async def message(payload: ChatRequest, settings: Settings = Depends(get_settings)) -> ChatResponse:
    try:
        result = await chat_service.run_chat_turn(payload.document_type, payload.messages, payload.fields, settings)
        return ChatResponse(
            reply=result.reply,
            fields=result.fields,
            document_type=result.document_type,
            document_type_label=_label(result.document_type),
            suggested_document_type=result.suggested_document_type,
            suggested_document_type_label=_label(result.suggested_document_type),
        )
    except UnknownDocumentTypeError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"Unknown document_type: {payload.document_type}")
    except LlmRateLimitedError:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            detail="The assistant is receiving too many requests right now. Please try again shortly.",
        )
    except LlmTimeoutError:
        raise HTTPException(
            status.HTTP_504_GATEWAY_TIMEOUT,
            detail="The assistant took too long to respond. Please try again.",
        )
    except LlmResponseInvalidError:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail="The assistant returned an unexpected response. Please try rephrasing your last message.",
        )
    except LlmUnavailableError:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The assistant is temporarily unavailable. Please try again shortly.",
        )
