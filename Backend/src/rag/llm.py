"""LLM answer generation backed by Ollama."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator

import ollama

from src.config import settings
from src.constants import OLLAMA_MODEL, OLLAMA_TEMPERATURE

logger = logging.getLogger(__name__)


def _ollama_temperature(override: float | None) -> float:
    """
    Resolves the temperature sent to Ollama (per-request override vs server default).

    Args:
        override (float | None): Optional client-provided temperature.

    Returns:
        float: Effective temperature in ``[0, 1]`` (validated on the HTTP model).
    """

    return OLLAMA_TEMPERATURE if override is None else override


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

        context_parts: list[str] = []
        for idx, chunk in enumerate(chunks):
            filename = str(chunk.get("filename") or "unknown")
            document_type = str(chunk.get("documentType") or "other")
            chunk_index = chunk.get("chunkIndex")
            location = f"chunk {chunk_index}" if chunk_index is not None else "chunk ?"
            context_parts.append(
                f"[{idx + 1}] Source: {filename} [{document_type}] ({location})\n{chunk.get('content', '')}"
            )

        context = "\n\n".join(context_parts)
        prompt = (
            "Use the provided context as the primary source of truth. "
            "If context is partial, provide a practical best-effort answer and clearly call out assumptions. "
            "When possible, cite the strongest source using the source label number. "
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
            model=OLLAMA_MODEL,
            options={"temperature": 0},
            messages=[
                {
                    "role": "user",
                    "content": "Reply with the single word ready.",
                },
            ],
        )

    async def answer(
        self,
        query: str,
        chunks: list[dict[str, object]],
        *,
        temperature: float | None = None,
    ) -> str:
        """
        Returns an answer synthesized from retrieved context chunks.

        Args:
            query (str): The user question.
            chunks (list[dict[str, object]]): Retrieved context chunks.
            temperature (float | None): Optional sampling temperature override.

        Returns:
            str: The generated answer.
        """

        if not chunks:
            return "No relevant documents found."

        if settings.use_mock_llm:
            logger.info("Using mock LLM response")
            return self._mock_answer(chunks)

        response = await self._client.chat(
            model=OLLAMA_MODEL,
            options={"temperature": _ollama_temperature(temperature)},
            messages=self._build_messages(query, chunks),
        )
        return response["message"]["content"].strip()

    async def answer_general(
        self,
        query: str,
        *,
        temperature: float | None = None,
    ) -> str:
        """
        Returns a conversational answer without document context.

        Args:
            query (str): The user question.
            temperature (float | None): Optional sampling temperature override.

        Returns:
            str: The generated answer.
        """

        if settings.use_mock_llm:
            logger.info("Using mock LLM general response")
            return f"Mock general reply to: {query.strip()[:180]}"

        response = await self._client.chat(
            model=OLLAMA_MODEL,
            options={"temperature": _ollama_temperature(temperature)},
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant. Answer clearly and concisely.",
                },
                {"role": "user", "content": query.strip()},
            ],
        )
        return response["message"]["content"].strip()

    async def stream_answer(
        self,
        query: str,
        chunks: list[dict[str, object]],
        *,
        temperature: float | None = None,
    ) -> AsyncIterator[str]:
        """
        Streams an answer synthesized from retrieved context chunks.

        Args:
            query (str): The user question.
            chunks (list[dict[str, object]]): Retrieved context chunks.
            temperature (float | None): Optional sampling temperature override.

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
            model=OLLAMA_MODEL,
            options={"temperature": _ollama_temperature(temperature)},
            messages=self._build_messages(query, chunks),
            stream=True,
        )

        async for part in stream:
            content = part.message.content or ""
            if content:
                yield content

    async def stream_answer_general(
        self,
        query: str,
        *,
        temperature: float | None = None,
    ) -> AsyncIterator[str]:
        """
        Streams a conversational answer without document context.

        Args:
            query (str): The user question.
            temperature (float | None): Optional sampling temperature override.

        Returns:
            AsyncIterator[str]: Streamed answer chunks.
        """

        if settings.use_mock_llm:
            logger.info("Using mock LLM general stream response")
            yield f"Mock general reply to: {query.strip()[:180]}"
            return

        stream = await self._client.chat(
            model=OLLAMA_MODEL,
            options={"temperature": _ollama_temperature(temperature)},
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant. Answer clearly and concisely.",
                },
                {"role": "user", "content": query.strip()},
            ],
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
