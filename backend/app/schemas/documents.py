from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class DocumentCreate(BaseModel):
    document_type: str
    fields: dict[str, Any] = Field(default_factory=dict)


class DocumentSummary(BaseModel):
    id: int
    document_type: str
    document_type_label: str
    title: str
    created_at: datetime


class DocumentDetail(DocumentSummary):
    fields: dict[str, Any]
