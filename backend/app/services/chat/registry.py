from dataclasses import dataclass

from pydantic import BaseModel


@dataclass(frozen=True)
class DocumentChatSpec:
    turn_schema: type[BaseModel]
    system_prompt: str
    greeting: str

    @property
    def fields_schema(self) -> type[BaseModel]:
        # Derived from turn_schema.fields' own annotation rather than passed
        # separately, so the two can never drift out of sync.
        return self.turn_schema.model_fields["fields"].annotation


class UnknownDocumentTypeError(Exception):
    pass


_REGISTRY: dict[str, DocumentChatSpec] = {}


def register(document_type: str, spec: DocumentChatSpec) -> None:
    _REGISTRY[document_type] = spec


def get_document_spec(document_type: str) -> DocumentChatSpec:
    try:
        return _REGISTRY[document_type]
    except KeyError:
        raise UnknownDocumentTypeError(document_type) from None
