import pytest

from app.core.catalog import load_catalog
from app.schemas.mnda_chat import MndaChatTurn
from app.services import chat  # noqa: F401  triggers registration of all document types
from app.services.chat.registry import UnknownDocumentTypeError, get_document_spec


def test_get_document_spec_returns_registered_mutual_nda():
    spec = get_document_spec("mutual_nda")
    assert spec.turn_schema is MndaChatTurn
    assert spec.greeting


def test_get_document_spec_raises_for_unknown_type():
    with pytest.raises(UnknownDocumentTypeError):
        get_document_spec("nonexistent")


def test_every_catalog_entry_is_registered():
    for entry in load_catalog():
        spec = get_document_spec(entry.key)
        assert spec.greeting
        assert spec.system_prompt


def test_fields_schema_is_derived_from_turn_schema_not_independently_wrong():
    for entry in load_catalog():
        spec = get_document_spec(entry.key)
        assert spec.fields_schema is spec.turn_schema.model_fields["fields"].annotation
