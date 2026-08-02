def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_signup_returns_public_user_and_sets_cookie(client):
    response = client.post(
        "/api/auth/signup", json={"email": "new@example.com", "password": "password123"}
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "new@example.com"
    assert "password" not in body
    assert "hashed_password" not in body
    assert "prelegal_session" in response.cookies


def test_signup_duplicate_email_is_conflict(client):
    payload = {"email": "dup@example.com", "password": "password123"}
    client.post("/api/auth/signup", json=payload)
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 409


def test_signup_rejects_invalid_email_and_short_password(client):
    response = client.post("/api/auth/signup", json={"email": "not-an-email", "password": "short"})
    assert response.status_code == 422


def test_signup_rejects_password_over_72_bytes_as_validation_error(client):
    # 72 ASCII chars would pass Pydantic's max_length=72, but each "é" is
    # 2 UTF-8 bytes, so this payload exceeds bcrypt's 72-byte limit — must be
    # a clean 422, not an unhandled 500 from bcrypt.
    response = client.post(
        "/api/auth/signup", json={"email": "long@example.com", "password": "é" * 72}
    )
    assert response.status_code == 422


def test_signin_rejects_password_over_72_bytes_as_validation_error(client):
    response = client.post(
        "/api/auth/signin", json={"email": "nobody@example.com", "password": "a" * 100}
    )
    assert response.status_code == 422


def test_signin_happy_path(client):
    payload = {"email": "signin@example.com", "password": "password123"}
    client.post("/api/auth/signup", json=payload)
    client.cookies.clear()

    response = client.post("/api/auth/signin", json=payload)
    assert response.status_code == 200
    assert "prelegal_session" in response.cookies


def test_signin_wrong_password_is_unauthorized(client):
    payload = {"email": "signin2@example.com", "password": "password123"}
    client.post("/api/auth/signup", json=payload)
    client.cookies.clear()

    response = client.post(
        "/api/auth/signin", json={"email": "signin2@example.com", "password": "wrong-password"}
    )
    assert response.status_code == 401


def test_signin_unknown_email_is_unauthorized(client):
    response = client.post(
        "/api/auth/signin", json={"email": "nobody@example.com", "password": "password123"}
    )
    assert response.status_code == 401


def test_me_without_cookie_is_unauthorized(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_after_signin_returns_current_user(client):
    payload = {"email": "me@example.com", "password": "password123"}
    client.post("/api/auth/signup", json=payload)

    response = client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"


def test_signout_clears_session(client):
    client.post("/api/auth/signup", json={"email": "out@example.com", "password": "password123"})
    assert client.get("/api/auth/me").status_code == 200

    signout_response = client.post("/api/auth/signout")
    assert signout_response.status_code == 204

    assert client.get("/api/auth/me").status_code == 401
