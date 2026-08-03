from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.catalog import label_for
from app.db.session import get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.documents import DocumentCreate, DocumentDetail, DocumentSummary
from app.services import auth_service, documents_service

router = APIRouter()


def _label(document_type: str) -> str:
    return label_for(document_type) or document_type


def _to_summary(document: Document) -> DocumentSummary:
    return DocumentSummary(
        id=document.id,
        document_type=document.document_type,
        document_type_label=_label(document.document_type),
        title=document.title,
        created_at=document.created_at,
    )


def _to_detail(document: Document) -> DocumentDetail:
    return DocumentDetail(**_to_summary(document).model_dump(), fields=document.fields)


@router.post("", response_model=DocumentDetail, status_code=status.HTTP_201_CREATED)
def create_document(
    payload: DocumentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.get_current_user),
) -> DocumentDetail:
    try:
        document = documents_service.create_document(db, user, payload.document_type, payload.fields)
    except documents_service.UnknownDocumentTypeError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"Unknown document_type: {payload.document_type}")
    return _to_detail(document)


@router.get("", response_model=list[DocumentSummary])
def list_documents(
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.get_current_user),
) -> list[DocumentSummary]:
    return [_to_summary(document) for document in documents_service.list_documents(db, user)]


@router.get("/{document_id}", response_model=DocumentDetail)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.get_current_user),
) -> DocumentDetail:
    document = documents_service.get_document(db, user, document_id)
    if document is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Document not found")
    return _to_detail(document)
