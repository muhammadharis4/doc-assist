from fastapi import FastAPI, HTTPException

from config import settings
from schemas import (
    DeleteDocumentResponse,
    DocumentIndexRequest,
    DocumentIndexResponse,
    RagQueryRequest,
    RagQueryResponse,
)
from service import RagEngine


app = FastAPI(title=settings.app_name, version=settings.app_version)
engine = RagEngine()


@app.get("/health")
def health() -> dict[str, str]:
    """Simple readiness endpoint for local checks."""

    return {"status": "ok"}


@app.post("/documents", response_model=DocumentIndexResponse)
def index_document(payload: DocumentIndexRequest) -> DocumentIndex.Response:
    """Indexes or updates a document into the vector store."""

    try:
        engine.index_document(
            document_id=payload.id,
            filename=payload.filename,
            content=payload.content,
            project=payload.project,
            category=payload.category,
        )
    except Exception as error:
        raise HTTPException(status_code=500, detail="Failed to index document") from error

    return DocumentIndexResponse(status="indexed")


@app.delete("/documents/{document_id}", response_model=DeleteDocumentResponse)
def delete_document(document_id: str) -> DeleteDocumentResponse:
    """Deletes indexed chunks for a document by id."""

    if not document_id.strip():
        raise HTTPException(status_code=400, detail="document_id is required")

    try:
        engine.delete_document(document_id=document_id)
    except Exception as error:
        raise HTTPException(status_code=500, detail="Failed to delete document") from error

    return DeleteDocumentResponse(status="deleted")


@app.post("/query", response_model=RagQueryResponse)
async def query_documents(payload: RagQueryRequest) -> RagQueryResponse:
    """Runs semantic retrieval and returns answer + attributable sources."""

    query_text = payload.query.strip()
    if not query_text:
        raise HTTPException(status_code=400, detail="query is required")

    try:
        return await engine.query(query_text)
    except Exception as error:
        raise HTTPException(status_code=500, detail="Failed to execute query") from error
