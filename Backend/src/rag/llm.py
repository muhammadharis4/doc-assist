"""LLM answer generation backed by Ollama."""

from __future__ import annotations

import logging

import ollama

from src.config import settings

logger = logging.getLogger(__name__)


class LlmService:
    """Generates grounded answers from retrieved chunks."""

    def __init__(self) -> None:
        self._client = ollama.AsyncClient(host=settings.ollama_base_url)

    async def answer(self, query: str, chunks: list[dict[str, object]]) -> str:
        """
        Returns an answer synthesized from retrieved context chunks.

        Args:
            query (str): The user question.
            chunks (list[dict[str, object]]): Retrieved context chunks.

        Returns:
            str: The generated answer.
        """

        if not chunks:
            return "No relevant documents found."

        if settings.use_mock_llm:
            logger.info("Using mock LLM response")
            return self._mock_answer(chunks)

        context = "\n\n".join(
            f"[{idx + 1}] {chunk.get('content', '')}"
            for idx, chunk in enumerate(chunks)
        )
        prompt = (
            "Answer the user question using only the provided context. "
            "If the context is insufficient, say you do not know.\n\n"
            f"Question: {query}\n\n"
            f"Context:\n{context}"
        )

        response = await self._client.chat(
            model=settings.ollama_model,
            options={"temperature": settings.ollama_temperature},
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant grounded in provided sources.",
                },
                {"role": "user", "content": prompt},
            ],
        )
        return response["message"]["content"].strip()

    def _mock_answer(self, chunks: list[dict[str, object]]) -> str:
        """
        Returns a deterministic answer for local testing.

        Args:
            chunks (list[dict[str, object]]): Retrieved context chunks.

        Returns:
            str: A deterministic mock answer.
        """

        top = chunks[0].get("content", "") if chunks else ""
        return f"Mock answer based on source: {str(top)[:180]}"
