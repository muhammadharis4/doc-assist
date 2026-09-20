"""ingest_file and folder scanner against the test Postgres, with extraction/embedding faked."""

from __future__ import annotations

import types
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
    assert document["documentType"] == "rental_contract"
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


def _folder_filenames() -> set[str]:
    return {row["filename"] for row in db.list_documents() if row["id"] in db.folder_document_ids_by_hash().values()}


def _cleanup(names: set[str]) -> None:
    for row in db.list_documents():
        if row["filename"] in names:
            db.delete_document(row["id"])


def test_scan_removes_documents_whose_file_is_gone(service: DocumentService, tmp_path: Path) -> None:
    tag = uuid.uuid4().hex[:8]
    keep, drop = tmp_path / f"{tag}-keep.pdf", tmp_path / f"{tag}-drop.pdf"
    keep.write_bytes(_unique_bytes())
    drop.write_bytes(_unique_bytes())
    assert scan_folder(tmp_path, service) == 2

    drop.unlink()
    assert scan_folder(tmp_path, service) == 0

    names = _folder_filenames()
    assert f"{tag}-keep.pdf" in names
    assert f"{tag}-drop.pdf" not in names
    _cleanup({f"{tag}-keep.pdf"})


def test_renamed_file_keeps_its_document(service: DocumentService, tmp_path: Path) -> None:
    tag = uuid.uuid4().hex[:8]
    original = tmp_path / f"{tag}-old.pdf"
    original.write_bytes(_unique_bytes())
    assert scan_folder(tmp_path, service) == 1

    original.rename(tmp_path / f"{tag}-new.pdf")

    assert scan_folder(tmp_path, service) == 0  # same bytes: not re-ingested
    assert f"{tag}-old.pdf" in _folder_filenames()  # and not removed
    _cleanup({f"{tag}-old.pdf"})


def test_empty_folder_removes_nothing(service: DocumentService, tmp_path: Path) -> None:
    tag = uuid.uuid4().hex[:8]
    file = tmp_path / f"{tag}-only.pdf"
    file.write_bytes(_unique_bytes())
    assert scan_folder(tmp_path, service) == 1

    file.unlink()  # an empty folder looks like an unmounted one: keep everything
    scan_folder(tmp_path, service)

    assert f"{tag}-only.pdf" in _folder_filenames()
    _cleanup({f"{tag}-only.pdf"})


def test_missing_folder_is_retried_not_disabled(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    import asyncio

    from src.documents import folder_scanner

    scans: list[Path] = []
    fake_settings = types.SimpleNamespace(watch_folder=str(tmp_path / "later"))
    monkeypatch.setattr(folder_scanner, "settings", fake_settings)
    monkeypatch.setattr(folder_scanner, "scan_folder", lambda folder, service: scans.append(folder) or 0)
    monkeypatch.setattr(folder_scanner, "DocumentService", lambda: None)
    monkeypatch.setattr(folder_scanner, "WATCH_INTERVAL_SEC", 0.05)

    async def run() -> None:
        task = asyncio.create_task(folder_scanner.watch_folder())
        await asyncio.sleep(0.12)  # folder missing for a few cycles
        (tmp_path / "later").mkdir()  # then it appears (e.g. gets mounted)
        await asyncio.sleep(0.12)
        task.cancel()

    asyncio.run(run())

    assert scans, "the loop must pick the folder up once it exists"
