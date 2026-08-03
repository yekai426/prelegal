def signup(client, email="doc-user@example.com"):
    return client.post("/api/auth/signup", json={"email": email, "password": "password123"})


def test_create_document_without_auth_is_unauthorized(client):
    response = client.post("/api/documents", json={"document_type": "mutual_nda", "fields": {}})
    assert response.status_code == 401


def test_list_documents_without_auth_is_unauthorized(client):
    assert client.get("/api/documents").status_code == 401


def test_get_document_without_auth_is_unauthorized(client):
    assert client.get("/api/documents/1").status_code == 401


def test_create_document_happy_path_returns_detail_with_derived_label_and_title(client):
    signup(client)

    response = client.post(
        "/api/documents",
        json={"document_type": "csa", "fields": {"partyOne": {"company": "Acme Corp"}}},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["document_type"] == "csa"
    assert "Cloud Service" in body["document_type_label"]
    assert "Acme Corp" in body["title"]
    assert body["fields"] == {"partyOne": {"company": "Acme Corp"}}
    assert "id" in body and "created_at" in body


def test_create_document_unknown_type_is_not_found(client):
    signup(client)

    response = client.post("/api/documents", json={"document_type": "not-a-real-type", "fields": {}})
    assert response.status_code == 404


def test_list_documents_returns_only_the_current_users_documents(client):
    signup(client, "alice@example.com")
    client.post("/api/documents", json={"document_type": "mutual_nda", "fields": {}})
    client.post("/api/documents", json={"document_type": "csa", "fields": {}})
    client.cookies.clear()

    signup(client, "bob@example.com")
    client.post("/api/documents", json={"document_type": "sla", "fields": {}})

    response = client.get("/api/documents")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["document_type"] == "sla"
    # List responses omit the full fields blob.
    assert "fields" not in body[0]


def test_get_document_returns_404_for_another_users_document(client):
    signup(client, "alice@example.com")
    created = client.post("/api/documents", json={"document_type": "mutual_nda", "fields": {}}).json()
    client.cookies.clear()

    signup(client, "bob@example.com")
    response = client.get(f"/api/documents/{created['id']}")
    assert response.status_code == 404


def test_get_document_returns_404_for_nonexistent_id(client):
    signup(client)
    response = client.get("/api/documents/999999")
    assert response.status_code == 404


def test_get_document_returns_the_full_detail_for_its_owner(client):
    signup(client)
    created = client.post(
        "/api/documents", json={"document_type": "baa", "fields": {"limitations": "none"}}
    ).json()

    response = client.get(f"/api/documents/{created['id']}")
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == created["id"]
    assert body["fields"] == {"limitations": "none"}
