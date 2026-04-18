"""FastAPI entrypoint for the rebuilt DocAssist backend."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query

from src import db
from src.config import settings
from src.constants import DEFAULT_HISTORY_LIMIT, MAX_HISTORY_LIMIT
from src.schemas import (
    DeleteStatusResponse,
    DocumentCreateRequest,
    DocumentResponse,
    QueryExecuteRequest,
    QueryResponse,
)
from src.services.opensearch_store import ensure_index_and_pipeline
from src.services.rag import RagService
from src.utils.logging import setup_logging

setup_logging()
service = RagService()


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Initializes storage dependencies when the API starts."""

    db.init_db()
    ensure_index_and_pipeline()
    yield


app = FastAPI(title=settings.app_name, version=settings.app_version, lifespan=lifespan)


@app.get("/health")
def health() -> dict[str, str]:
    """Reports backend readiness for local checks."""

    return {"status": "ok"}


@app.get("/documents", response_model=list[DocumentResponse])
def list_documents() -> list[dict[str, str | None]]:
    """Returns all indexed documents ordered by most recent."""

    return service.list_documents()


@app.post("/documents", response_model=DocumentResponse)
def create_document(payload: DocumentCreateRequest) -> dict[str, str | None]:
    """Stores and indexes a document for retrieval."""

    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="content is required")

    return service.create_document(
        filename=payload.filename.strip(),
        content=content,
        mime_type=payload.mimeType.strip() if payload.mimeType else None,
    )


@app.delete("/documents/{document_id}", response_model=DeleteStatusResponse)
def remove_document(document_id: str) -> DeleteStatusResponse:
    """Deletes one document and all indexed chunks."""

    if not document_id.strip():
        raise HTTPException(status_code=400, detail="document_id is required")

    deleted = service.delete_document(document_id.strip())
    if not deleted:
        raise HTTPException(status_code=404, detail="document not found")

    return DeleteStatusResponse(status="deleted")


@app.post("/queries", response_model=QueryResponse)
async def run_query(payload: QueryExecuteRequest) -> dict[str, object]:
    """Runs hybrid retrieval and returns answer with sources."""

    query_text = payload.query.strip()
    if not query_text:
        raise HTTPException(status_code=400, detail="query is required")

    if len(query_text) > settings.max_query_length:
        raise HTTPException(status_code=400, detail=f"query exceeds {settings.max_query_length} chars")

    return await service.query(query_text)


@app.get("/queries/history", response_model=list[QueryResponse])
def query_history(
    limit: int = Query(default=DEFAULT_HISTORY_LIMIT, ge=1, le=MAX_HISTORY_LIMIT),
) -> list[dict[str, object]]:
    """Returns recent query history used by the frontend chat panel."""

    return service.get_history(limit)
