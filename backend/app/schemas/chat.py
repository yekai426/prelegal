from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1)


class ChatRequest(BaseModel):
    document_type: str | None = None
    messages: list[ChatMessage] = Field(min_length=1)
    fields: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def _no_fields_before_document_type_is_known(self) -> "ChatRequest":
        if self.document_type is None and self.fields:
            raise ValueError("fields must be empty when document_type is not yet known")
        return self


class ChatResponse(BaseModel):
    reply: str
    fields: dict[str, Any]
    document_type: str | None
    document_type_label: str | None = None
    suggested_document_type: str | None = None
    suggested_document_type_label: str | None = None


class ChatGreetingResponse(BaseModel):
    reply: str
    document_type: str | None = None
