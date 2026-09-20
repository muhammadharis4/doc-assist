"""ingest_file and folder scanner against the test Postgres, with extraction/embedding faked."""

from __future__ import annotations

import uuid
from pathlib import Path

import pytest

from src import db
from src.constants import EMBEDDING_DIMENSIONS
from src.documents.folder_scanner import scan_folder
from src.documents.service import DocumentService


@pytest.fixture
def service(monkeypatch: pytest.MonkeyPatch) -> DocumentService:
    db.init_db()
    monkeypatch.setattr(
        "src.documents.service.extract_text_from_pdf_bytes",
        lambda file_bytes, source_name=None: "Kaltmiete 900 Euro pro Monat. " * 20,
    )
    monkeypatch.setattr(
        "src.rag.embeddings.generate_embeddings",
        lambda chunks: [[0.1] * EMBEDDING_DIMENSIONS for _ in chunks],
    )
    return DocumentService()


def _unique_bytes() -> bytes:
    return uuid.uuid4().hex.encode()


def _chunk_count(document_id: str) -> int:
    with db._connection() as connection:
        row = connection.execute(
            "SELECT count(*) AS n FROM chunks WHERE document_id = %s", (document_id,)
        ).fetchone()
    return row["n"]


def test_ingest_stores_chunks_and_skips_duplicates(service: DocumentService) -> None:
    data = _unique_bytes()

    document = service.ingest_file(data, "a.pdf", "folder")

    assert document["status"] == "ready"
    assert _chunk_count(document["id"]) > 0
    assert service.ingest_file(data, "copy of a.pdf", "folder") is None
    db.delete_document(document["id"])


def test_unreadable_file_is_kept_as_failed_and_not_retried(
    service: DocumentService, monkeypatch: pytest.MonkeyPatch
) -> None:
    calls: list[str] = []

    def boom(file_bytes: bytes, source_name: str | None = None) -> str:
        calls.append(source_name or "")
        raise RuntimeError("corrupt")

    monkeypatch.setattr("src.documents.service.extract_text_from_pdf_bytes", boom)
    data = _unique_bytes()

    document = service.ingest_file(data, "bad.pdf", "telegram")

    assert document["status"] == "failed"
    assert "corrupt" in document["errorMessage"]
    assert service.ingest_file(data, "bad.pdf", "telegram") is None
    assert calls == ["bad.pdf"]
    db.delete_document(document["id"])


def test_scan_folder_ingests_supported_files_once(service: DocumentService, tmp_path: Path) -> None:
    (tmp_path / "a.pdf").write_bytes(_unique_bytes())
    (tmp_path / "notes.txt").write_bytes(_unique_bytes())
    (tmp_path / "sub").mkdir()
    (tmp_path / "sub" / "b.JPG").write_bytes(_unique_bytes())

    assert scan_folder(tmp_path, service) == 2
    assert scan_folder(tmp_path, service) == 0

    for row in db.list_documents():
        if row["filename"] in {"a.pdf", "b.JPG"}:
            db.delete_document(row["id"])
