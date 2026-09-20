"""Embedding generation through Ollama."""

from __future__ import annotations

import logging
from functools import lru_cache

import ollama

from src.config import settings
from src.constants import EMBEDDING_MODEL

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _client() -> ollama.Client:
    """
    Creates and caches the Ollama client.

    Returns:
        ollama.Client: The cached client.
    """

    return ollama.Client(host=settings.ollama_base_url)


def generate_embeddings(chunks: list[str]) -> list[list[float]]:
    """
    Generates embeddings for multiple text chunks.

    Args:
        chunks (list[str]): List of text chunks.

    Returns:
        list[list[float]]: List of embeddings for each chunk.
    """

    if not chunks:
        return []

    response = _client().embed(model=EMBEDDING_MODEL, input=chunks)
    logger.info("Generated embeddings for %d text chunks.", len(chunks))
    return [list(vector) for vector in response.embeddings]


def generate_query_embedding(query: str) -> list[float]:
    """
    Generates one embedding vector for a query.

    Args:
        query (str): The user query text.

    Returns:
        list[float]: The query embedding vector.
    """

    return generate_embeddings([query])[0]
