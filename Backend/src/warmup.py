"""Startup warmup helpers."""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


async def warmup_runtime() -> None:
    """
    Warms the embedding model and Ollama client at startup.

    Returns:
        None: This function only performs warmup work.
    """

    try:
        from src.rag.embeddings import generate_query_embedding

        generate_query_embedding("warmup")
    except Exception as error:  # pragma: no cover - best effort warmup
        logger.warning("Embedding warmup failed: %s", error)

    try:
        from src.rag.llm import LlmService

        await LlmService().warmup()
    except Exception as error:  # pragma: no cover - best effort warmup
        logger.warning("LLM warmup failed: %s", error)
