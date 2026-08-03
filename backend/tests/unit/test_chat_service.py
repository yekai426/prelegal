from unittest.mock import AsyncMock, patch

from app.core.config import Settings
from app.schemas.chat import ChatMessage
from app.services.chat_service import run_chat_turn


def make_settings() -> Settings:
    return Settings(jwt_secret_key="unit-test-secret", openrouter_api_key="test-key")


def user_message(text: str) -> list[ChatMessage]:
    return [ChatMessage(role="user", content=text)]


async def test_classifies_then_extracts_in_two_calls_on_first_turn():
    from app.services.chat.classifier import DocumentClassificationTurn
    from app.schemas.csa_chat import CsaChatTurn, CsaFields

    classification = DocumentClassificationTurn(reply="Got it, a CSA!", document_type="csa")
    extraction = CsaChatTurn(reply="Tell me about the provider.", document_type="csa", fields=CsaFields())

    mock = AsyncMock(side_effect=[classification, extraction])
    with patch("app.services.chat_service.call_llm_structured", new=mock):
        result = await run_chat_turn(None, user_message("I need a cloud service agreement"), {}, make_settings())

    assert mock.await_count == 2
    assert result.document_type == "csa"
    assert result.reply == "Tell me about the provider."


async def test_unsupported_request_returns_no_document_type_and_stops_after_one_call():
    from app.services.chat.classifier import DocumentClassificationTurn

    classification = DocumentClassificationTurn(
        reply="I can't draft a will, but I can help with an NDA.",
        document_type=None,
        suggested_document_type="mutual_nda",
    )
    mock = AsyncMock(return_value=classification)
    with patch("app.services.chat_service.call_llm_structured", new=mock):
        result = await run_chat_turn(None, user_message("I need a will"), {}, make_settings())

    assert mock.await_count == 1
    assert result.document_type is None
    assert result.suggested_document_type == "mutual_nda"
    assert result.fields == {}


async def test_known_document_type_skips_classification():
    from app.schemas.mnda_chat import MndaChatTurn, MndaFields

    turn = MndaChatTurn(reply="Thanks!", document_type="mutual_nda", fields=MndaFields(purpose="testing"))
    mock = AsyncMock(return_value=turn)
    with patch("app.services.chat_service.call_llm_structured", new=mock):
        result = await run_chat_turn("mutual_nda", user_message("hi"), {}, make_settings())

    assert mock.await_count == 1
    assert result.document_type == "mutual_nda"
    assert result.fields["purpose"] == "testing"


async def test_flip_carries_over_shared_fields_without_a_second_llm_call():
    from app.schemas.csa_chat import CsaChatTurn, CsaFields

    # User was drafting a CSA, mentions governingLaw, then asks for a Pilot
    # Agreement instead — the model flips document_type in the SAME call.
    flipped_fields = CsaFields(governingLaw="Delaware", technicalSupport="business hours")
    turn = CsaChatTurn(reply="Switching to a Pilot Agreement.", document_type="pilot_agreement", fields=flipped_fields)

    mock = AsyncMock(return_value=turn)
    with patch("app.services.chat_service.call_llm_structured", new=mock):
        result = await run_chat_turn(
            "csa", user_message("actually make this a pilot agreement"), {"governingLaw": "Delaware"}, make_settings()
        )

    assert mock.await_count == 1  # no second LLM call for the flip
    assert result.document_type == "pilot_agreement"
    assert result.fields["governingLaw"] == "Delaware"  # shared field carried over
    assert "technicalSupport" not in result.fields  # CSA-only field dropped, not fabricated onto Pilot


async def test_mid_conversation_unsupported_request_surfaces_suggestion_without_a_flip():
    from app.schemas.mnda_chat import MndaChatTurn, MndaFields

    # User is mid-way through an MNDA, then asks for something outside the
    # catalog entirely (not a flip to another supported type) — document_type
    # stays put, but suggested_document_type carries the closest match.
    turn = MndaChatTurn(
        reply="I can't draft a will, but I can help finish this NDA or start a CSA.",
        document_type="mutual_nda",
        fields=MndaFields(purpose="testing"),
        suggested_document_type="csa",
    )
    mock = AsyncMock(return_value=turn)
    with patch("app.services.chat_service.call_llm_structured", new=mock):
        result = await run_chat_turn("mutual_nda", user_message("actually, draft me a will"), {}, make_settings())

    assert result.document_type == "mutual_nda"  # unchanged, not a flip
    assert result.suggested_document_type == "csa"
    assert result.fields["purpose"] == "testing"


async def test_garbled_client_fields_are_tolerated_not_fatal():
    from app.schemas.mnda_chat import MndaChatTurn, MndaFields

    turn = MndaChatTurn(reply="ok", document_type="mutual_nda", fields=MndaFields())
    mock = AsyncMock(return_value=turn)
    with patch("app.services.chat_service.call_llm_structured", new=mock):
        result = await run_chat_turn(
            "mutual_nda", user_message("hi"), {"purpose": 12345, "unexpectedKey": "garbage"}, make_settings()
        )

    assert result.document_type == "mutual_nda"
