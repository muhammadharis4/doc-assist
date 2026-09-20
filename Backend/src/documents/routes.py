"""Document API routes."""

from __future__ import annotations

import asyncio

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, Query, UploadFile

from src import db
from src.constants import INGEST_EXTENSIONS, MAX_PDF_UPLOAD_BYTES
from src.schemas import (
    DeleteStatusResponse,
    DocumentCreateRequest,
    DocumentPatchRequest,
    DocumentResponse,
)
from src.documents.service import DocumentService

router = APIRouter(prefix="/documents", tags=["documents"])
service = DocumentService()


@router.get("", response_model=list[DocumentResponse])
def list_documents(
    q: str | None = Query(
        default=None,
        description="Case-insensitive substring match on filename.",
    ),
    document_type: str | None = Query(default=None, description="Exact document_type value."),
    status: str | None = Query(
        default=None,
        description="Exact status, or 'inbox' for pending and processing.",
    ),
    tag: str | None = Query(default=None, description="Tag that must be present (case-insensitive)."),
    created_from: str | None = Query(default=None, description="ISO lower bound on created_at."),
    created_to: str | None = Query(default=None, description="ISO upper bound on created_at."),
) -> list[dict[str, object]]:
    """
    Returns stored documents with optional filters (newest first).

    Args:
        q (str | None): Filename substring filter.
        document_type (str | None): Document type filter.
        status (str | None): Status or ``inbox``.
        tag (str | None): Required tag.
        created_from (str | None): Created-at lower bound.
        created_to (str | None): Created-at upper bound.

    Returns:
        list[dict[str, object]]: Matching document rows.
    """

    return db.list_documents(
        filename_substring=q,
        document_type=document_type,
        status=status,
        tag=tag,
        created_from=created_from,
        created_to=created_to,
    )


@router.post("", response_model=DocumentResponse)
def create_document(
    payload: DocumentCreateRequest,
    background_tasks: BackgroundTasks,
) -> dict[str, object]:
    """
    Stores and indexes a document for retrieval.

    Args:
        payload (DocumentCreateRequest): Document create payload.

    Returns:
        dict[str, object]: Stored document payload.
    """

    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="content is required")

    document = db.create_document(
        filename=payload.filename.strip(),
        content=content,
        mime_type=payload.mimeType.strip() if payload.mimeType else None,
        document_type=payload.documentType,
        tags=list(payload.tags),
    )
    background_tasks.add_task(service.process_document, str(document["id"]))
    return document


@router.post("/extract")
async def extract_pdf(file: UploadFile = File(...)) -> dict[str, str]:
    """
    Extracts text from an uploaded PDF file.

    Args:
        file (UploadFile): PDF file upload.

    Returns:
        dict[str, str]: Extracted text payload.
    """

    filename = file.filename or ""
    is_supported_name = filename.lower().endswith(INGEST_EXTENSIONS)
    is_supported_mime = (file.content_type or "").lower() in {"application/pdf", "image/jpeg", "image/png"}
    if not (is_supported_name or is_supported_mime):
        raise HTTPException(status_code=400, detail="Only PDF, JPG, and PNG files are supported")

    max_bytes = MAX_PDF_UPLOAD_BYTES
    chunks: list[bytes] = []
    total = 0
    chunk_size = min(1024 * 1024, max_bytes + 1)
    while True:
        buf = await file.read(chunk_size)
        if not buf:
            break
        total += len(buf)
        if total > max_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"PDF exceeds maximum size of {max_bytes} bytes",
            )
        chunks.append(buf)

    file_bytes = b"".join(chunks)
    # Docling can take minutes on CPU: keep the event loop free for other requests.
    text = await asyncio.to_thread(
        service.extract_pdf_text, file_bytes=file_bytes, filename=file.filename
    )
    return {"text": text}


@router.patch("/{document_id}", response_model=DocumentResponse)
def patch_document(
    document_id: str,
    payload: DocumentPatchRequest,
) -> dict[str, object]:
    """
    Updates mutable fields on a document (tags only).

    Args:
        document_id (str): Document id.
        payload (DocumentPatchRequest): Fields to update.

    Returns:
        dict[str, object]: Updated document row.
    """

    trimmed_id = document_id.strip()
    if not trimmed_id:
        raise HTTPException(status_code=400, detail="document_id is required")

    updated = db.update_document_tags(trimmed_id, list(payload.tags))
    if updated is None:
        raise HTTPException(status_code=404, detail="document not found")

    return updated


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

    deleted = db.delete_document(document_id.strip())
    if not deleted:
        raise HTTPException(status_code=404, detail="document not found")

    return DeleteStatusResponse(status="deleted")
