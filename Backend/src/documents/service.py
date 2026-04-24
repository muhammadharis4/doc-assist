"""Document service logic."""

from __future__ import annotations

import logging

from fastapi import HTTPException

from src import db
from src.documents.pdf_extractor import extract_text_from_pdf_bytes
from src.rag.chunking import chunk_text
from src.rag.embeddings import generate_embeddings
from src.rag.opensearch_store import delete_document_chunks, upsert_document_chunks

logger = logging.getLogger(__name__)


class DocumentService:
    """Handles document persistence and indexing."""

    def create_document(
        self,
        filename: str,
        content: str,
        mime_type: str | None,
        document_type: str,
    ) -> dict[str, object]:
        """
        Stores a document and marks it pending for background indexing.

        Args:
            filename (str): Document filename.
            content (str): Document content.
            mime_type (str | None): Optional MIME type for the document.
            document_type (str): Document category for retrieval.

        Returns:
            dict[str, object]: The stored document payload.
        """

        return db.create_document(
            filename=filename,
            content=content,
            mime_type=mime_type,
            document_type=document_type,
            status="pending",
        )

    def process_document(self, document_id: str) -> None:
        """
        Runs chunking, embedding, and indexing for one stored document.

        Args:
            document_id (str): The document identifier.

        Returns:
            None: This function only updates indexing state.
        """

        document = db.get_document(document_id)
        if document is None:
            logger.warning("Document not found for background processing: %s", document_id)
            return

        db.update_document_status(document_id=document_id, status="processing", error_message=None, indexed_at=None)

        try:
            content = str(document.get("content", ""))
            chunks = chunk_text(content)
            if not chunks:
                raise ValueError("Document has no indexable text")

            vectors = generate_embeddings(chunks)
            upsert_document_chunks(
                document_id=str(document["id"]),
                filename=str(document["filename"]),
                document_type=str(document.get("documentType") or "other"),
                chunks=chunks,
                embeddings=vectors,
                created_at=str(document["createdAt"]),
            )
            db.update_document_status(document_id=document_id, status="ready", error_message=None)
        except Exception as error:  # pragma: no cover - model/index failures are environment-dependent
            logger.exception("Failed to process document %s", document_id)
            db.update_document_status(
                document_id=document_id,
                status="failed",
                error_message=str(error),
                indexed_at=None,
            )

    def list_documents(self) -> list[dict[str, object]]:
        """
        Returns all stored documents.

        Returns:
            list[dict[str, object]]: The stored document rows ordered by recency.
        """

        return db.list_documents()

    def delete_document(self, document_id: str) -> bool:
        """
        Removes one document from SQLite and OpenSearch.

        Args:
            document_id (str): The document identifier.

        Returns:
            bool: True when the document existed and was removed.
        """

        deleted = db.delete_document(document_id)
        delete_document_chunks(document_id)
        return deleted

    def extract_pdf_text(self, file_bytes: bytes, filename: str | None) -> str:
        """
        Extracts searchable text from an uploaded PDF file.

        Args:
            file_bytes (bytes): Raw PDF bytes.
            filename (str | None): Original filename for diagnostics.

        Returns:
            str: Extracted PDF text.
        """

        if not file_bytes:
            raise HTTPException(status_code=400, detail="file is empty")

        text = extract_text_from_pdf_bytes(file_bytes=file_bytes, source_name=filename)
        if not text.strip():
            raise HTTPException(
                status_code=422,
                detail="No readable text found in PDF. If this is scanned, ensure Tesseract is installed.",
            )

        return text
