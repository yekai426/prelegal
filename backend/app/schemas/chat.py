from typing import Any, Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1)


class ChatRequest(BaseModel):
    document_type: str = "mutual_nda"
    messages: list[ChatMessage] = Field(min_length=1)
    fields: dict[str, Any] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    reply: str
    fields: dict[str, Any]


class ChatGreetingResponse(BaseModel):
    reply: str
