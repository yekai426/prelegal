import pytest

from app.schemas.mnda_chat import MndaChatTurn
from app.services import chat  # noqa: F401  triggers "mutual_nda" registration
from app.services.chat.registry import UnknownDocumentTypeError, get_document_spec


def test_get_document_spec_returns_registered_mutual_nda():
    spec = get_document_spec("mutual_nda")
    assert spec.turn_schema is MndaChatTurn
    assert spec.greeting


def test_get_document_spec_raises_for_unknown_type():
    with pytest.raises(UnknownDocumentTypeError):
        get_document_spec("nonexistent")
