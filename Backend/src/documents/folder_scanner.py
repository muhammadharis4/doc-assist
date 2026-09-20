"""Keeps documents in sync with the watched folder: new files in, removed files out."""

from __future__ import annotations

import asyncio
import hashlib
import logging
from pathlib import Path

from src import db
from src.config import settings
from src.constants import INGEST_EXTENSIONS, WATCH_INTERVAL_SEC
from src.documents.service import DocumentService

logger = logging.getLogger(__name__)


def scan_folder(folder: Path, service: DocumentService) -> int:
    """
    Ingests new files under a folder and removes documents whose file is gone.

    Documents are matched to files by content hash, so renaming or moving a file keeps
    its document. If the folder holds no supported files at all, nothing is removed:
    that is more likely an unmounted or wrong folder than a deliberate clean-out.

    Args:
        folder (Path): Folder to scan (subfolders included).
        service (DocumentService): Service used to ingest each file.

    Returns:
        int: Number of newly ingested files.
    """

    ingested = 0
    present_hashes: set[str] = set()
    for path in sorted(folder.rglob("*")):
        if path.is_file() and path.suffix.lower() in INGEST_EXTENSIONS:
            data = path.read_bytes()
            present_hashes.add(hashlib.sha256(data).hexdigest())
            if service.ingest_file(data, path.name, "folder") is not None:
                ingested += 1
                logger.info("Ingested %s from watched folder", path.name)

    stale = {h: doc_id for h, doc_id in db.folder_document_ids_by_hash().items() if h not in present_hashes}
    if stale and not present_hashes:
        logger.warning("Watched folder has no files; keeping %d documents", len(stale))
    else:
        for doc_id in stale.values():
            db.delete_document(doc_id)
            logger.info("Removed document %s: its file left the watched folder", doc_id)
    return ingested


async def watch_folder() -> None:
    """
    Scans the configured folder every ``WATCH_INTERVAL_SEC`` seconds, forever.

    An empty ``WATCH_FOLDER`` disables this loop. A folder that is missing is reported and
    checked again on the next cycle, so creating or mounting it later works.

    Returns:
        None: This coroutine runs until the app stops.
    """

    if not settings.watch_folder.strip():
        return
    folder = Path(settings.watch_folder)

    service = DocumentService()
    while True:
        try:
            if folder.is_dir():
                await asyncio.to_thread(scan_folder, folder, service)
            else:
                logger.warning("Watch folder %s not found; will check again", folder.resolve())
        except Exception:  # pragma: no cover - keep the loop alive on any failure
            logger.exception("Folder scan failed")
        await asyncio.sleep(WATCH_INTERVAL_SEC)
