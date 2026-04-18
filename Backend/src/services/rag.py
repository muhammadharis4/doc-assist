"""High-level RAG orchestration service."""

from __future__ import annotations

from src import db
from src.config import settings
from src.constants import SOURCE_SNIPPET_MAX_CHARS
from src.services.chunking import chunk_text
from src.services.embeddings import generate_embeddings, generate_query_embedding
from src.services.llm import LlmService
from src.services.opensearch_store import (
    delete_document_chunks,
    hybrid_search,
    upsert_document_chunks,
)


class RagService:
    """Coordinates indexing, retrieval, answer generation, and persistence."""

    def __init__(self) -> None:
        self._llm = LlmService()

    def create_document(self, filename: str, content: str, mime_type: str | None) -> dict[str, str | None]:
        """Stores a document and indexes its chunks in OpenSearch."""

        document = db.create_document(filename=filename, content=content, mime_type=mime_type)
        chunks = chunk_text(content)
        vectors = generate_embeddings(chunks)
        upsert_document_chunks(
            document_id=str(document["id"]),
            filename=str(document["filename"]),
            chunks=chunks,
            embeddings=vectors,
            created_at=str(document["createdAt"]),
        )
        return document

    def list_documents(self) -> list[dict[str, str | None]]:
        """Returns all stored documents."""

        return db.list_documents()

    def delete_document(self, document_id: str) -> bool:
        """Removes one document from SQLite and OpenSearch."""

        deleted = db.delete_document(document_id)
        delete_document_chunks(document_id)
        return deleted

    async def query(self, query_text: str) -> dict[str, object]:
        """Runs hybrid retrieval and returns a persisted query response."""

        query_embedding = generate_query_embedding(query_text)
        hits = hybrid_search(query=query_text, query_embedding=query_embedding, top_k=settings.top_k)

        answer = await self._llm.answer(query_text, hits)
        sources = [
            {
                "documentId": hit.get("documentId"),
                "filename": hit.get("filename"),
                "snippet": str(hit.get("content", ""))[:SOURCE_SNIPPET_MAX_CHARS],
                "score": float(hit.get("score", 0.0)),
            }
            for hit in hits
        ]
        return db.store_query(query=query_text, answer=answer, sources=sources)

    def get_history(self, limit: int) -> list[dict[str, object]]:
        """Returns recent query history with source snippets."""

        return db.list_query_history(limit)
