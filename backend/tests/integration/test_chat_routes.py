from unittest.mock import AsyncMock, patch

import litellm


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


VALID_TURN_JSON = (
    '{"reply": "Nice to meet you!", '
    '"fields": {"purpose": "Evaluating a partnership", "partyOne": {"printName": "Alice"}}}'
)


def test_greeting_returns_static_reply_without_calling_llm(client):
    with patch("app.services.llm_client.acompletion", new=AsyncMock()) as mock:
        response = client.get("/api/chat/greeting")
    assert response.status_code == 200
    assert response.json()["reply"]
    mock.assert_not_called()


def test_greeting_unknown_document_type_is_404(client):
    response = client.get("/api/chat/greeting", params={"document_type": "nope"})
    assert response.status_code == 404


def test_message_happy_path(client):
    mock = AsyncMock(return_value=fake_response(VALID_TURN_JSON))
    with patch("app.services.llm_client.acompletion", new=mock):
        response = client.post(
            "/api/chat/message",
            json={
                "document_type": "mutual_nda",
                "messages": [{"role": "user", "content": "Hi, I'm Alice"}],
                "fields": {},
            },
        )
    assert response.status_code == 200
    body = response.json()
    assert body["reply"] == "Nice to meet you!"
    assert body["fields"]["purpose"] == "Evaluating a partnership"
    assert body["fields"]["partyOne"]["printName"] == "Alice"
    # Fields not mentioned by the model still come back with schema defaults.
    assert body["fields"]["mndaTermChoice"] == "expires"


def test_message_unknown_document_type_is_404(client):
    response = client.post(
        "/api/chat/message",
        json={"document_type": "nope", "messages": [{"role": "user", "content": "hi"}], "fields": {}},
    )
    assert response.status_code == 404


def test_message_empty_messages_is_422(client):
    response = client.post(
        "/api/chat/message", json={"document_type": "mutual_nda", "messages": [], "fields": {}}
    )
    assert response.status_code == 422


def test_message_rate_limited_is_429(client):
    exc = litellm.exceptions.RateLimitError(message="rate limited", llm_provider="openrouter", model="x")
    with patch("app.services.llm_client.acompletion", new=AsyncMock(side_effect=exc)):
        response = client.post(
            "/api/chat/message",
            json={"document_type": "mutual_nda", "messages": [{"role": "user", "content": "hi"}], "fields": {}},
        )
    assert response.status_code == 429


def test_message_timeout_is_504(client):
    exc = litellm.exceptions.Timeout(message="timed out", model="x", llm_provider="openrouter")
    with patch("app.services.llm_client.acompletion", new=AsyncMock(side_effect=exc)):
        response = client.post(
            "/api/chat/message",
            json={"document_type": "mutual_nda", "messages": [{"role": "user", "content": "hi"}], "fields": {}},
        )
    assert response.status_code == 504


def test_message_malformed_llm_output_is_502_with_safe_detail(client):
    mock = AsyncMock(return_value=fake_response("not valid json"))
    with patch("app.services.llm_client.acompletion", new=mock):
        response = client.post(
            "/api/chat/message",
            json={"document_type": "mutual_nda", "messages": [{"role": "user", "content": "hi"}], "fields": {}},
        )
    assert response.status_code == 502
    detail = response.json()["detail"]
    assert "rephrasing" in detail
    assert "Traceback" not in detail and "ValidationError" not in detail


def test_message_provider_unavailable_is_503(client):
    exc = litellm.exceptions.ServiceUnavailableError(message="down", llm_provider="openrouter", model="x")
    with patch("app.services.llm_client.acompletion", new=AsyncMock(side_effect=exc)):
        response = client.post(
            "/api/chat/message",
            json={"document_type": "mutual_nda", "messages": [{"role": "user", "content": "hi"}], "fields": {}},
        )
    assert response.status_code == 503


def test_message_merges_with_previously_known_fields(client):
    # A garbled/partial fields dict from the client should be tolerated, not 500.
    mock = AsyncMock(return_value=fake_response(VALID_TURN_JSON))
    with patch("app.services.llm_client.acompletion", new=mock):
        response = client.post(
            "/api/chat/message",
            json={
                "document_type": "mutual_nda",
                "messages": [{"role": "user", "content": "hi"}],
                "fields": {"unexpectedKey": "garbage", "purpose": 12345},
            },
        )
    assert response.status_code == 200
