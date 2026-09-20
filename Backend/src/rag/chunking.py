"""Chunking utilities used during document indexing."""

from __future__ import annotations

import re

from src.constants import CHUNK_OVERLAP_CHARS, CHUNK_SIZE_CHARS


def clean_text(text: str) -> str:
    """
    Normalizes whitespace while preserving paragraph boundaries.

    Args:
        text (str): Raw text to normalize.

    Returns:
        str: The cleaned text.
    """

    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    normalized = re.sub(r"(\w+)-\n(\w+)", r"\1\2", normalized)
    normalized = re.sub(r"[ \t]+", " ", normalized)
    normalized = re.sub(r"\n{3,}", "\n\n", normalized)
    normalized = "\n".join(line.strip() for line in normalized.split("\n"))
    return normalized.strip()


def _slice_long_block(block: str, chunk_size: int, overlap: int) -> list[str]:
    """
    Splits one oversized block with overlap while preserving order.

    Args:
        block (str): Large block of text to split.
        chunk_size (int): Maximum chunk length.
        overlap (int): Overlap between adjacent slices.

    Returns:
        list[str]: Sliced block fragments.
    """

    step = max(1, chunk_size - overlap)
    slices: list[str] = []
    for start in range(0, len(block), step):
        fragment = block[start : start + chunk_size].strip()
        if fragment:
            slices.append(fragment)
        if start + chunk_size >= len(block):
            break
    return slices


def chunk_text(text: str) -> list[str]:
    """
    Splits text into overlapping character chunks.

    Args:
        text (str): Raw document text.

    Returns:
        list[str]: The generated text chunks.
    """

    normalized = clean_text(text)
    if not normalized:
        return []

    chunk_size = max(50, CHUNK_SIZE_CHARS)
    overlap = max(0, min(CHUNK_OVERLAP_CHARS, chunk_size - 1))
    blocks = [part.strip() for part in normalized.split("\n\n") if part.strip()]
    if not blocks:
        return []

    chunks: list[str] = []
    buffer = ""

    for block in blocks:
        if len(block) > chunk_size:
            if buffer:
                chunks.append(buffer)
                buffer = ""
            chunks.extend(_slice_long_block(block=block, chunk_size=chunk_size, overlap=overlap))
            continue

        candidate = block if not buffer else f"{buffer}\n\n{block}"
        if len(candidate) <= chunk_size:
            buffer = candidate
            continue

        chunks.append(buffer)
        buffer = block

    if buffer:
        chunks.append(buffer)

    return chunks
