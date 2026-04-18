"""Chunking utilities used during document indexing."""

from __future__ import annotations

import re

from src.config import settings


def clean_text(text: str) -> str:
    """Normalizes whitespace while preserving paragraph boundaries."""

    normalized = re.sub(r"(\w+)-\n(\w+)", r"\1\2", text)
    normalized = re.sub(r"(?<!\n)\n(?!\n)", " ", normalized)
    normalized = re.sub(r"\n+", "\n", normalized)
    normalized = re.sub(r"[ \t]+", " ", normalized)
    return normalized.strip()


def chunk_text(text: str) -> list[str]:
    """Splits text into overlapping character chunks."""

    normalized = clean_text(text)
    if not normalized:
        return []

    chunk_size = max(50, settings.chunk_size_chars)
    overlap = max(0, min(settings.chunk_overlap_chars, chunk_size - 1))
    step = chunk_size - overlap

    chunks: list[str] = []
    for start in range(0, len(normalized), step):
        end = start + chunk_size
        chunk = normalized[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(normalized):
            break

    return chunks
