"""Document service logic."""

from __future__ import annotations

import logging
from time import perf_counter

from fastapi import HTTPException

from src import db
from src.documents.pdf_extractor import extract_text_from_pdf_bytes
from src.rag.chunking import chunk_text
from src.rag.opensearch_store import upsert_document_chunks

logger = logging.getLogger(__name__)


class DocumentService:
    """Handles document persistence and indexing."""

    def create_document(
        self,
        filename: str,
        content: str,
        mime_type: str | None,
        document_type: str,
        tags: list[str] | None = None,
    ) -> dict[str, object]:
        """
        Stores a document and marks it pending for background indexing.

        Args:
            filename (str): Document filename.
            content (str): Document content.
            mime_type (str | None): Optional MIME type for the document.
            document_type (str): Document category for retrieval.
            tags (list[str] | None): Optional labels stored with the row.

        Returns:
            dict[str, object]: The stored document payload.
        """

        return db.create_document(
            filename=filename,
            content=content,
            mime_type=mime_type,
            document_type=document_type,
            status="pending",
            tags=tags,
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
            total_start = perf_counter()
            content = str(document.get("content", ""))
            chunk_start = perf_counter()
            chunks = chunk_text(content)
            if not chunks:
                raise ValueError("Document has no indexable text")
            chunk_ms = (perf_counter() - chunk_start) * 1000

            embedding_start = perf_counter()
            from src.rag.embeddings import generate_embeddings

            vectors = generate_embeddings(chunks)
            embedding_ms = (perf_counter() - embedding_start) * 1000

            index_start = perf_counter()
            upsert_document_chunks(
                document_id=str(document["id"]),
                filename=str(document["filename"]),
                document_type=str(document.get("documentType") or "other"),
                chunks=chunks,
                embeddings=vectors,
                created_at=str(document["createdAt"]),
            )
            index_ms = (perf_counter() - index_start) * 1000
            db.update_document_status(document_id=document_id, status="ready", error_message=None)
            total_ms = (perf_counter() - total_start) * 1000
            logger.info(
                "Document processing timing total_ms=%.2f chunk_ms=%.2f embedding_ms=%.2f index_ms=%.2f chunks=%d document_id=%s",
                total_ms,
                chunk_ms,
                embedding_ms,
                index_ms,
                len(chunks),
                document_id,
            )
        except Exception as error:  # pragma: no cover - model/index failures are environment-dependent
            logger.exception("Failed to process document %s", document_id)
            db.update_document_status(
                document_id=document_id,
                status="failed",
                error_message=str(error),
                indexed_at=None,
            )

    def list_documents(
        self,
        *,
        filename_substring: str | None = None,
        document_type: str | None = None,
        status: str | None = None,
        tag: str | None = None,
        created_from: str | None = None,
        created_to: str | None = None,
    ) -> list[dict[str, object]]:
        """
        Lists stored documents with optional filters.

        Args:
            filename_substring (str | None): Case-insensitive substring on filename.
            document_type (str | None): Exact document type.
            status (str | None): Exact status, or ``inbox`` for pending and processing.
            tag (str | None): Tag that must exist on the document.
            created_from (str | None): ISO lower bound on ``created_at``.
            created_to (str | None): ISO upper bound on ``created_at``.

        Returns:
            list[dict[str, object]]: Matching rows, newest first.
        """

        return db.list_documents(
            filename_substring=filename_substring,
            document_type=document_type,
            status=status,
            tag=tag,
            created_from=created_from,
            created_to=created_to,
        )

    def patch_document_tags(self, document_id: str, tags: list[str]) -> dict[str, object] | None:
        """
        Replaces tags for one document.

        Args:
            document_id (str): Document id.
            tags (list[str]): New tag list.

        Returns:
            dict[str, object] | None: Updated document, or ``None`` if missing.
        """

        return db.update_document_tags(document_id=document_id, tags=tags)

    def delete_document(self, document_id: str) -> bool:
        """
        Removes one document from SQLite.

        Args:
            document_id (str): The document identifier.

        Returns:
            bool: True when the document existed and was removed.
        """

        return db.delete_document(document_id)

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
