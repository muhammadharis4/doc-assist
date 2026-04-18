"""Document API routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from src.schemas import DeleteStatusResponse, DocumentCreateRequest, DocumentResponse
from src.documents.service import DocumentService

router = APIRouter(prefix="/documents", tags=["documents"])
service = DocumentService()


@router.get("", response_model=list[DocumentResponse])
def list_documents() -> list[dict[str, str | None]]:
    """
    Returns all indexed documents ordered by most recent.

    Returns:
        list[dict[str, str | None]]: Stored document rows.
    """

    return service.list_documents()


@router.post("", response_model=DocumentResponse)
def create_document(payload: DocumentCreateRequest) -> dict[str, str | None]:
    """
    Stores and indexes a document for retrieval.

    Args:
        payload (DocumentCreateRequest): Document create payload.

    Returns:
        dict[str, str | None]: Stored document payload.
    """

    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="content is required")

    return service.create_document(
        filename=payload.filename.strip(),
        content=content,
        mime_type=payload.mimeType.strip() if payload.mimeType else None,
    )


@router.delete("/{document_id}", response_model=DeleteStatusResponse)
def remove_document(document_id: str) -> DeleteStatusResponse:
    """
    Deletes one document and all indexed chunks.

    Args:
        document_id (str): The document identifier.

    Returns:
        DeleteStatusResponse: Delete result payload.
    """

    if not document_id.strip():
        raise HTTPException(status_code=400, detail="document_id is required")

    deleted = service.delete_document(document_id.strip())
    if not deleted:
        raise HTTPException(status_code=404, detail="document not found")

    return DeleteStatusResponse(status="deleted")
