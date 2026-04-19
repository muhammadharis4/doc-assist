"""Query service logic."""

from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator

from src import db
from src.config import settings
from src.constants import SOURCE_SNIPPET_MAX_CHARS
from src.rag.embeddings import generate_query_embedding
from src.rag.llm import LlmService
from src.rag.opensearch_store import hybrid_search

logger = logging.getLogger(__name__)


def _serialize_sse_event(event: str, payload: object) -> str:
    """
    Serializes one server-sent event payload.

    Args:
        event (str): SSE event name.
        payload (object): JSON-serializable event payload.

    Returns:
        str: Formatted SSE event text.
    """

    return f"event: {event}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


class QueryService:
    """Handles hybrid retrieval, answer generation, and query history."""

    def __init__(self) -> None:
        self._llm = LlmService()

    def _prepare_query(self, query_text: str) -> tuple[list[dict[str, object]], list[dict[str, object]]]:
        """
        Builds retrieval hits and source records for one query.

        Args:
            query_text (str): The user question.

        Returns:
            tuple[list[dict[str, object]], list[dict[str, object]]]: Retrieval hits and sources.
        """

        query_embedding = generate_query_embedding(query_text)
        hits = hybrid_search(query=query_text, query_embedding=query_embedding, top_k=settings.top_k)
        sources = [
            {
                "documentId": hit.get("documentId"),
                "filename": hit.get("filename"),
                "snippet": str(hit.get("content", ""))[:SOURCE_SNIPPET_MAX_CHARS],
                "score": float(hit.get("score", 0.0)),
            }
            for hit in hits
        ]
        return hits, sources

    async def run_query(self, query_text: str) -> dict[str, object]:
        """
        Runs hybrid retrieval and returns a persisted query response.

        Args:
            query_text (str): The user question.

        Returns:
            dict[str, object]: The persisted query response with answer and sources.
        """

        hits, sources = self._prepare_query(query_text)

        answer = await self._llm.answer(query_text, hits)
        return db.store_query(query=query_text, answer=answer, sources=sources)

    async def stream_query(self, query_text: str) -> AsyncIterator[str]:
        """
        Streams hybrid retrieval output and persists the final answer.

        Args:
            query_text (str): The user question.

        Returns:
            AsyncIterator[str]: SSE-formatted events for the frontend.
        """

        hits, sources = self._prepare_query(query_text)
        answer_parts: list[str] = []

        try:
            async for delta in self._llm.stream_answer(query_text, hits):
                if delta:
                    answer_parts.append(delta)
                    yield _serialize_sse_event("token", {"delta": delta})
        except Exception as error:  # pragma: no cover - upstream/network failures
            logger.exception("Streaming query failed")
            yield _serialize_sse_event("error", {"message": str(error)})
            return

        answer = "".join(answer_parts).strip() or "No relevant documents found."
        stored = db.store_query(query=query_text, answer=answer, sources=sources)
        yield _serialize_sse_event("done", stored)

    def get_history(self, limit: int) -> list[dict[str, object]]:
        """
        Returns recent query history with source snippets.

        Args:
            limit (int): Maximum number of history rows to return.

        Returns:
            list[dict[str, object]]: Recent query history rows ordered by recency.
        """

        return db.list_query_history(limit)
