from app.core.config import Settings
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password


def make_settings(**overrides) -> Settings:
    overrides.setdefault("jwt_secret_key", "unit-test-secret")
    return Settings(**overrides)


def test_hash_password_is_salted():
    first = hash_password("correct-horse-battery-staple")
    second = hash_password("correct-horse-battery-staple")
    assert first != second


def test_verify_password_round_trip():
    hashed = hash_password("correct-horse-battery-staple")
    assert verify_password("correct-horse-battery-staple", hashed) is True
    assert verify_password("wrong-password", hashed) is False


def test_access_token_round_trip():
    settings = make_settings()
    token = create_access_token(user_id=42, settings=settings)
    payload = decode_access_token(token, settings)
    assert payload is not None
    assert payload["sub"] == "42"


def test_decode_rejects_tampered_token():
    settings = make_settings()
    token = create_access_token(user_id=1, settings=settings)
    header, payload, signature = token.split(".")
    # Flip characters in the middle of the payload rather than the very last
    # character, whose trailing bits can be base64 padding and not actually
    # change the decoded bytes.
    mid = len(payload) // 2
    flipped_char = "a" if payload[mid] != "a" else "b"
    tampered_payload = payload[:mid] + flipped_char + payload[mid + 1 :]
    tampered = f"{header}.{tampered_payload}.{signature}"
    assert decode_access_token(tampered, settings) is None


def test_decode_rejects_token_from_different_secret():
    token = create_access_token(user_id=1, settings=make_settings(jwt_secret_key="secret-a"))
    assert decode_access_token(token, make_settings(jwt_secret_key="secret-b")) is None
