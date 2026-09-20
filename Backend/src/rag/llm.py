"""LLM answer generation backed by Ollama."""

from __future__ import annotations

from collections.abc import AsyncIterator

import ollama

from src.config import settings
from src.constants import OLLAMA_MODEL, OLLAMA_NUM_CTX, OLLAMA_TEMPERATURE


def _ollama_options(temperature: float | None = None) -> dict[str, float | int]:
    """
    Builds the options sent with every Ollama chat call.

    The same ``num_ctx`` must be used everywhere (warmup included), otherwise Ollama
    reloads the model between calls.

    Args:
        temperature (float | None): Optional per-request override of the default temperature.

    Returns:
        dict[str, float | int]: Ollama ``options`` payload.
    """

    return {
        "temperature": OLLAMA_TEMPERATURE if temperature is None else temperature,
        "num_ctx": OLLAMA_NUM_CTX,
    }


# Tuned on the real sample documents: a stricter "reply exactly: Not found" made the 7B model
# refuse questions whose answer was in the excerpts; this wording answers them and still
# declines when the excerpts lack the answer.
_SYSTEM_PROMPT = (
    "You answer questions about the user's personal documents (German payslips, forms, letters). "
    "The question may be in English or German. Each excerpt is numbered [1], [2], ... "
    "Read the excerpts carefully: table labels and their values are on adjacent lines. "
    "Use only the excerpts, copy figures and dates exactly as written, and cite the excerpt number like [1]. "
    "Only if the excerpts really do not contain the answer, say briefly that you could not find it."
)


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
            f"[{idx + 1}] {chunk.get('filename') or 'unknown'}\n{chunk.get('content', '')}"
            for idx, chunk in enumerate(chunks)
        )

        return [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": f"Excerpts:\n{context}\n\nQuestion: {query}\nAnswer:"},
        ]

    async def warmup(self) -> None:
        """
        Warms the Ollama client and target model at startup.

        Returns:
            None: This function only performs a warmup request.
        """

        await self._client.chat(
            model=OLLAMA_MODEL,
            options=_ollama_options(0),
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

        parts = [part async for part in self.stream_answer(query, chunks, temperature=temperature)]
        return "".join(parts).strip()

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

        parts = [part async for part in self.stream_answer_general(query, temperature=temperature)]
        return "".join(parts).strip()

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

        stream = await self._client.chat(
            model=OLLAMA_MODEL,
            options=_ollama_options(temperature),
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

        stream = await self._client.chat(
            model=OLLAMA_MODEL,
            options=_ollama_options(temperature),
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
