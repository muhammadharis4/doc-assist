"""LLM answer generation backed by Ollama."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator

import ollama

from src.config import settings

logger = logging.getLogger(__name__)


class LlmService:
    """Generates grounded answers from retrieved chunks."""

    def __init__(self) -> None:
        self._client = ollama.AsyncClient(host=settings.ollama_base_url)

    def _build_messages(self, query: str, chunks: list[dict[str, object]]) -> list[dict[str, str]]:
        """
        Builds the Ollama chat messages for one grounded answer.

        Args:
            query (str): The user question.
            chunks (list[dict[str, object]]): Retrieved context chunks.

        Returns:
            list[dict[str, str]]: Messages sent to Ollama.
        """

        context = "\n\n".join(
            f"[{idx + 1}] {chunk.get('content', '')}"
            for idx, chunk in enumerate(chunks)
        )
        prompt = (
            "Use the provided context as the primary source of truth. "
            "If context is partial, provide a practical best-effort answer and clearly call out assumptions. "
            "Do not refuse unless the question is unrelated to the context and no safe best-effort guidance is possible.\n\n"
            f"Question: {query}\n\n"
            f"Context:\n{context}"
        )

        return [
            {
                "role": "system",
                "content": "You are a helpful assistant grounded in provided sources.",
            },
            {"role": "user", "content": prompt},
        ]

    async def warmup(self) -> None:
        """
        Warms the Ollama client and target model at startup.

        Returns:
            None: This function only performs a warmup request.
        """

        if settings.use_mock_llm:
            return

        await self._client.chat(
            model=settings.ollama_model,
            options={"temperature": 0},
            messages=[
                {
                    "role": "user",
                    "content": "Reply with the single word ready.",
                }
            ],
        )

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

        response = await self._client.chat(
            model=settings.ollama_model,
            options={"temperature": settings.ollama_temperature},
            messages=self._build_messages(query, chunks),
        )
        return response["message"]["content"].strip()

    async def stream_answer(
        self,
        query: str,
        chunks: list[dict[str, object]],
    ) -> AsyncIterator[str]:
        """
        Streams an answer synthesized from retrieved context chunks.

        Args:
            query (str): The user question.
            chunks (list[dict[str, object]]): Retrieved context chunks.

        Returns:
            AsyncIterator[str]: Streamed answer chunks.
        """

        if not chunks:
            yield "No relevant documents found."
            return

        if settings.use_mock_llm:
            logger.info("Using mock LLM response")
            yield self._mock_answer(chunks)
            return

        stream = await self._client.chat(
            model=settings.ollama_model,
            options={"temperature": settings.ollama_temperature},
            messages=self._build_messages(query, chunks),
            stream=True,
        )

        async for part in stream:
            content = part.message.content or ""
            if content:
                yield content

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
