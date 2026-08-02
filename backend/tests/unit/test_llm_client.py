from unittest.mock import AsyncMock, patch

import litellm
import pytest
from pydantic import BaseModel

from app.core.config import Settings
from app.services.llm_client import (
    LlmRateLimitedError,
    LlmResponseInvalidError,
    LlmTimeoutError,
    LlmUnavailableError,
    call_llm_structured,
)


class DummySchema(BaseModel):
    reply: str
    value: int = 0


def make_settings() -> Settings:
    return Settings(jwt_secret_key="unit-test-secret", openrouter_api_key="test-key")


def fake_response(content: str):
    class Message:
        pass

    class Choice:
        pass

    message = Message()
    message.content = content
    choice = Choice()
    choice.message = message

    class Response:
        choices = [choice]

    return Response()


@pytest.mark.asyncio
async def test_happy_path_returns_parsed_schema():
    with patch(
        "app.services.llm_client.acompletion",
        new=AsyncMock(return_value=fake_response('{"reply": "hi", "value": 3}')),
    ):
        result = await call_llm_structured([], DummySchema, make_settings())
    assert result == DummySchema(reply="hi", value=3)


@pytest.mark.asyncio
async def test_rate_limit_error_is_mapped():
    exc = litellm.exceptions.RateLimitError(message="rate limited", llm_provider="openrouter", model="x")
    with patch("app.services.llm_client.acompletion", new=AsyncMock(side_effect=exc)):
        with pytest.raises(LlmRateLimitedError):
            await call_llm_structured([], DummySchema, make_settings())


@pytest.mark.asyncio
async def test_timeout_error_is_mapped():
    exc = litellm.exceptions.Timeout(message="timed out", model="x", llm_provider="openrouter")
    with patch("app.services.llm_client.acompletion", new=AsyncMock(side_effect=exc)):
        with pytest.raises(LlmTimeoutError):
            await call_llm_structured([], DummySchema, make_settings())


@pytest.mark.asyncio
async def test_connection_error_is_mapped_to_unavailable():
    exc = litellm.exceptions.APIConnectionError(message="conn failed", llm_provider="openrouter", model="x")
    with patch("app.services.llm_client.acompletion", new=AsyncMock(side_effect=exc)):
        with pytest.raises(LlmUnavailableError):
            await call_llm_structured([], DummySchema, make_settings())


@pytest.mark.asyncio
async def test_unexpected_exception_is_mapped_to_unavailable_not_leaked():
    with patch("app.services.llm_client.acompletion", new=AsyncMock(side_effect=RuntimeError("boom"))):
        with pytest.raises(LlmUnavailableError):
            await call_llm_structured([], DummySchema, make_settings())


@pytest.mark.asyncio
async def test_malformed_json_retries_then_raises_invalid():
    mock = AsyncMock(return_value=fake_response("not json at all"))
    with patch("app.services.llm_client.acompletion", new=mock):
        with pytest.raises(LlmResponseInvalidError):
            await call_llm_structured([], DummySchema, make_settings())
    assert mock.await_count == 2  # initial attempt + one bounded retry


@pytest.mark.asyncio
async def test_schema_violation_retries_then_raises_invalid():
    # "value" must be an int — this violates the schema.
    mock = AsyncMock(return_value=fake_response('{"reply": "hi", "value": "not-a-number"}'))
    with patch("app.services.llm_client.acompletion", new=mock):
        with pytest.raises(LlmResponseInvalidError):
            await call_llm_structured([], DummySchema, make_settings())
    assert mock.await_count == 2


@pytest.mark.asyncio
async def test_empty_content_retries_then_raises_invalid():
    mock = AsyncMock(return_value=fake_response(""))
    with patch("app.services.llm_client.acompletion", new=mock):
        with pytest.raises(LlmResponseInvalidError):
            await call_llm_structured([], DummySchema, make_settings())
    assert mock.await_count == 2


@pytest.mark.asyncio
async def test_retry_succeeds_on_second_attempt():
    mock = AsyncMock(
        side_effect=[fake_response("not json"), fake_response('{"reply": "hi", "value": 1}')]
    )
    with patch("app.services.llm_client.acompletion", new=mock):
        result = await call_llm_structured([], DummySchema, make_settings())
    assert result == DummySchema(reply="hi", value=1)
    assert mock.await_count == 2


@pytest.mark.asyncio
async def test_call_passes_expected_kwargs():
    mock = AsyncMock(return_value=fake_response('{"reply": "hi", "value": 1}'))
    settings = make_settings()
    with patch("app.services.llm_client.acompletion", new=mock):
        await call_llm_structured([{"role": "user", "content": "hi"}], DummySchema, settings)

    _, kwargs = mock.call_args
    assert kwargs["model"] == "openrouter/openai/gpt-oss-120b"
    assert kwargs["response_format"] is DummySchema
    assert kwargs["extra_body"] == {"provider": {"order": ["cerebras"]}}
    assert kwargs["api_key"] == settings.openrouter_api_key
