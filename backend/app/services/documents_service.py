from datetime import datetime

from sqlalchemy.orm import Session

from app.core.catalog import catalog_by_key
from app.models.document import Document
from app.models.user import User


class UnknownDocumentTypeError(Exception):
    pass


def _derive_title(document_type_label: str, fields: dict, now: datetime) -> str:
    party = fields.get("partyOne") if isinstance(fields, dict) else None
    party_name = (party.get("company") or party.get("printName")) if isinstance(party, dict) else None
    date_str = f"{now:%B} {now.day}, {now:%Y}"
    if party_name:
        return f"{document_type_label} — {party_name} — {date_str}"
    return f"{document_type_label} — {date_str}"


def create_document(db: Session, user: User, document_type: str, fields: dict) -> Document:
    entry = catalog_by_key().get(document_type)
    if entry is None:
        raise UnknownDocumentTypeError(document_type)

    title = _derive_title(entry.name, fields, datetime.now())
    document = Document(user_id=user.id, document_type=document_type, title=title, fields=fields)
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def list_documents(db: Session, user: User) -> list[Document]:
    return (
        db.query(Document)
        .filter(Document.user_id == user.id)
        .order_by(Document.created_at.desc(), Document.id.desc())
        .all()
    )


def get_document(db: Session, user: User, document_id: int) -> Document | None:
    return db.query(Document).filter(Document.id == document_id, Document.user_id == user.id).first()
