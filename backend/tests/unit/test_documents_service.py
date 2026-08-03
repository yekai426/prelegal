from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.session import reset_database
from app.models.user import User
from app.services import documents_service
from app.services.documents_service import UnknownDocumentTypeError, _derive_title


def make_session(tmp_path) -> Session:
    engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}")
    reset_database(engine)
    return Session(engine)


def make_user(db: Session, email: str = "user@example.com") -> User:
    user = User(email=email, hashed_password="hash")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_derive_title_uses_party_company_when_present():
    fields = {"partyOne": {"company": "Acme Corp", "printName": "Alice"}}
    title = _derive_title("Cloud Service Agreement (CSA)", fields, datetime(2026, 8, 2))
    assert title == "Cloud Service Agreement (CSA) — Acme Corp — August 2, 2026"


def test_derive_title_falls_back_to_print_name_without_company():
    fields = {"partyOne": {"company": "", "printName": "Alice"}}
    title = _derive_title("Mutual NDA", fields, datetime(2026, 8, 2))
    assert title == "Mutual NDA — Alice — August 2, 2026"


def test_derive_title_omits_party_when_none_present():
    title = _derive_title("Service Level Agreement (SLA)", {}, datetime(2026, 8, 2))
    assert title == "Service Level Agreement (SLA) — August 2, 2026"


def test_create_document_persists_a_new_row_with_derived_title(tmp_path):
    db = make_session(tmp_path)
    user = make_user(db)

    document = documents_service.create_document(
        db, user, "mutual_nda", {"partyOne": {"company": "Acme Corp"}}
    )

    assert document.id is not None
    assert document.user_id == user.id
    assert document.document_type == "mutual_nda"
    assert "Acme Corp" in document.title
    assert document.fields == {"partyOne": {"company": "Acme Corp"}}


def test_create_document_raises_for_unknown_document_type(tmp_path):
    db = make_session(tmp_path)
    user = make_user(db)

    try:
        documents_service.create_document(db, user, "not-a-real-type", {})
        assert False, "expected UnknownDocumentTypeError"
    except UnknownDocumentTypeError:
        pass


def test_list_documents_only_returns_the_given_users_documents_newest_first(tmp_path):
    db = make_session(tmp_path)
    alice = make_user(db, "alice@example.com")
    bob = make_user(db, "bob@example.com")

    documents_service.create_document(db, alice, "mutual_nda", {})
    documents_service.create_document(db, bob, "csa", {})
    documents_service.create_document(db, alice, "csa", {})

    alice_docs = documents_service.list_documents(db, alice)
    assert [d.document_type for d in alice_docs] == ["csa", "mutual_nda"]


def test_get_document_returns_none_for_another_users_document(tmp_path):
    db = make_session(tmp_path)
    alice = make_user(db, "alice@example.com")
    bob = make_user(db, "bob@example.com")

    bobs_document = documents_service.create_document(db, bob, "mutual_nda", {})

    assert documents_service.get_document(db, alice, bobs_document.id) is None
    assert documents_service.get_document(db, bob, bobs_document.id) is not None
