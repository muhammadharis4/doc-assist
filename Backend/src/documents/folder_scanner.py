"""Ingests new files from the watched folder."""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from src.config import settings
from src.constants import INGEST_EXTENSIONS, WATCH_INTERVAL_SEC
from src.documents.service import DocumentService

logger = logging.getLogger(__name__)


def scan_folder(folder: Path, service: DocumentService) -> int:
    """
    Ingests every supported file under a folder that has not been ingested yet.

    Args:
        folder (Path): Folder to scan (subfolders included).
        service (DocumentService): Service used to ingest each file.

    Returns:
        int: Number of newly ingested files.
    """

    ingested = 0
    for path in sorted(folder.rglob("*")):
        if path.is_file() and path.suffix.lower() in INGEST_EXTENSIONS:
            if service.ingest_file(path.read_bytes(), path.name, "folder") is not None:
                ingested += 1
                logger.info("Ingested %s from watched folder", path.name)
    return ingested


async def watch_folder() -> None:
    """
    Scans the configured folder every ``WATCH_INTERVAL_SEC`` seconds, forever.

    An empty or missing ``WATCH_FOLDER`` disables this loop.

    Returns:
        None: This coroutine runs until the app stops.
    """

    if not settings.watch_folder.strip():
        return
    folder = Path(settings.watch_folder)
    if not folder.is_dir():
        logger.warning("Watch folder %s not found; folder ingestion disabled", folder)
        return

    service = DocumentService()
    while True:
        try:
            await asyncio.to_thread(scan_folder, folder, service)
        except Exception:  # pragma: no cover - keep the loop alive on any failure
            logger.exception("Folder scan failed")
        await asyncio.sleep(WATCH_INTERVAL_SEC)
