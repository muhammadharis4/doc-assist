"""Document API routes."""

from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile

from src.schemas import DeleteStatusResponse, DocumentCreateRequest, DocumentResponse
from src.documents.service import DocumentService
from src.rag.opensearch_store import delete_document_chunks

router = APIRouter(prefix="/documents", tags=["documents"])
service = DocumentService()


@router.get("", response_model=list[DocumentResponse])
def list_documents() -> list[dict[str, object]]:
    """
    Returns all indexed documents ordered by most recent.

    Returns:
        list[dict[str, object]]: Stored document rows.
    """

    return service.list_documents()


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

    document = service.create_document(
        filename=payload.filename.strip(),
        content=content,
        mime_type=payload.mimeType.strip() if payload.mimeType else None,
        document_type=payload.documentType,
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
    is_pdf_name = filename.lower().endswith(".pdf")
    is_pdf_mime = (file.content_type or "").lower() == "application/pdf"
    if not (is_pdf_name or is_pdf_mime):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    file_bytes = await file.read()
    text = service.extract_pdf_text(file_bytes=file_bytes, filename=file.filename)
    return {"text": text}


@router.delete("/{document_id}", response_model=DeleteStatusResponse)
def remove_document(
    document_id: str,
    background_tasks: BackgroundTasks,
) -> DeleteStatusResponse:
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

    background_tasks.add_task(delete_document_chunks, document_id.strip())

    return DeleteStatusResponse(status="deleted")
