"""Document service logic."""

from __future__ import annotations

from fastapi import HTTPException

from src import db
from src.documents.pdf_extractor import extract_text_from_pdf_bytes
from src.rag.chunking import chunk_text
from src.rag.embeddings import generate_embeddings
from src.rag.opensearch_store import delete_document_chunks, upsert_document_chunks


class DocumentService:
    """Handles document persistence and indexing."""

    def create_document(
        self,
        filename: str,
        content: str,
        mime_type: str | None,
    ) -> dict[str, str | None]:
        """
        Stores a document and indexes its chunks in OpenSearch.

        Args:
            filename (str): Document filename.
            content (str): Document content.
            mime_type (str | None): Optional MIME type for the document.

        Returns:
            dict[str, str | None]: The stored document payload.
        """

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
        """
        Returns all stored documents.

        Returns:
            list[dict[str, str | None]]: The stored document rows ordered by recency.
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
