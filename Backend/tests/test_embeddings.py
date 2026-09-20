"""Embedding check against a live Ollama with bge-m3 pulled (skipped when unreachable)."""

from __future__ import annotations

import pytest

from src.constants import EMBEDDING_DIMENSIONS
from src.rag.embeddings import generate_embeddings, generate_query_embedding


def test_embedding_dimension_matches_schema() -> None:
    try:
        vectors = generate_embeddings(["Kaltmiete 900 Euro", "salary slip"])
    except ConnectionError:
        pytest.skip("Ollama not reachable")

    assert len(vectors) == 2
    assert all(len(vector) == EMBEDDING_DIMENSIONS for vector in vectors)
    assert len(generate_query_embedding("Wie hoch ist die Miete?")) == EMBEDDING_DIMENSIONS
    assert generate_embeddings([]) == []
