"""Document service logic."""

from __future__ import annotations

import hashlib
import logging
from pathlib import Path
from time import perf_counter

from fastapi import HTTPException

from src import db
from src.documents.pdf_extractor import extract_text_from_pdf_bytes
from src.rag.chunking import chunk_text
from src.rag.router import guess_document_type

logger = logging.getLogger(__name__)


class DocumentService:
    """Handles document persistence and indexing."""

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
            # The file name in every chunk lets "Mai 2023" match the chunk that holds the values,
            # not only the header chunk of each month.
            title = Path(str(document["filename"])).stem
            chunks = [f"{title}\n{chunk}" for chunk in chunk_text(content)]
            if not chunks:
                raise ValueError("Document has no indexable text")
            chunk_ms = (perf_counter() - chunk_start) * 1000

            embedding_start = perf_counter()
            from src.rag.embeddings import generate_embeddings

            vectors = generate_embeddings(chunks)
            embedding_ms = (perf_counter() - embedding_start) * 1000

            index_start = perf_counter()
            db.replace_document_chunks(document_id, chunks, vectors)
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

        try:
            text = extract_text_from_pdf_bytes(file_bytes=file_bytes, source_name=filename)
        except Exception as error:  # untrusted upload: corrupt or unsupported files
            logger.warning("Could not read %s: %s", filename, error)
            raise HTTPException(status_code=422, detail="Could not read this file.") from error
        if not text.strip():
            raise HTTPException(status_code=422, detail="No readable text found in this file.")

        return text

    def ingest_file(self, file_bytes: bytes, filename: str, source: str) -> dict[str, object] | None:
        """
        Extracts, chunks, embeds, and stores one file. Shared by the folder scanner and Telegram.

        The row is created first (with the file hash) so a re-scan or retry skips the file,
        and an unreadable file stays ``failed`` instead of being retried forever.

        Args:
            file_bytes (bytes): Raw file bytes (PDF or image).
            filename (str): Original filename.
            source (str): Origin label, e.g. ``folder`` or ``telegram``.

        Returns:
            dict[str, object] | None: The final document row, or ``None`` if already ingested.
        """

        digest = hashlib.sha256(file_bytes).hexdigest()
        if db.find_document_id_by_hash(digest):
            db.backfill_document_file(digest, file_bytes)
            return None

        document = db.create_document(
            filename, "", None, "other", status="processing", source=source, content_hash=digest,
            file_data=file_bytes,
        )
        document_id = str(document["id"])

        try:
            text = extract_text_from_pdf_bytes(file_bytes=file_bytes, source_name=filename)
            if not text.strip():
                raise ValueError("No readable text found in this file.")
            db.set_document_content(document_id, text, guess_document_type(filename, text))
        except Exception as error:  # untrusted file: corrupt or unsupported
            logger.warning("Could not read %s: %s", filename, error)
            db.update_document_status(document_id, "failed", error_message=str(error))
            return db.get_document(document_id)

        self.process_document(document_id)
        return db.get_document(document_id)
