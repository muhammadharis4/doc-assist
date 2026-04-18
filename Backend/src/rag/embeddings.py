"""Embedding model loading and vector generation."""

from __future__ import annotations

import logging
from functools import lru_cache

from sentence_transformers import SentenceTransformer

from src.config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    """
    Loads and caches the sentence-transformer model.

    Returns:
        SentenceTransformer: The cached embedding model.
    """

    logger.info("Loading embedding model from path: %s", settings.embedding_model_path)
    return SentenceTransformer(settings.embedding_model_path)


def generate_embeddings(chunks: list[str]) -> list[list[float]]:
    """
    Generates normalized embeddings for multiple text chunks.

    Args:
        chunks (list[str]): List of text chunks.

    Returns:
        list[list[float]]: List of embeddings for each chunk.
    """

    if not chunks:
        return []

    model = get_embedding_model()
    vectors = model.encode(chunks, normalize_embeddings=True)
    logger.info("Generated embeddings for %d text chunks.", len(chunks))
    return [vector.tolist() for vector in vectors]


def generate_query_embedding(query: str) -> list[float]:
    """
    Generates one normalized embedding vector for a query.

    Args:
        query (str): The user query text.

    Returns:
        list[float]: The query embedding vector.
    """

    model = get_embedding_model()
    vector = model.encode([query], normalize_embeddings=True)
    return vector[0].tolist()
