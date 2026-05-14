"""Query service logic."""

from __future__ import annotations

import asyncio
import json
import logging
from collections.abc import AsyncIterator
from time import perf_counter

from src import db
from src.config import settings
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

    def _prepare_query(
        self,
        query_text: str,
        document_ids: list[str] | None = None,
        top_k: int | None = None,
    ) -> tuple[list[dict[str, object]], list[dict[str, object]]]:
        """
        Builds retrieval hits and source records for one query.

        Args:
            query_text (str): The user question.
            document_ids (list[str] | None): Optional document id filter.
            top_k (int | None): Retrieval depth; defaults to server settings when omitted.

        Returns:
            tuple[list[dict[str, object]], list[dict[str, object]]]: Retrieval hits and sources.
        """

        effective_top_k = top_k if top_k is not None else settings.top_k
        from src.rag.embeddings import generate_query_embedding

        query_embedding = generate_query_embedding(query_text)
        hits = hybrid_search(
            query=query_text,
            query_embedding=query_embedding,
            top_k=effective_top_k,
            document_ids=document_ids,
        )
        sources = [
            {
                "documentId": hit.get("documentId"),
                "filename": hit.get("filename"),
                "documentType": hit.get("documentType") or "other",
                "snippet": str(hit.get("content", ""))[: settings.source_snippet_max_chars],
                "score": float(hit.get("score", 0.0)),
            }
            for hit in hits
        ]
        return hits, sources

    async def run_query(
        self,
        query_text: str,
        document_ids: list[str] | None = None,
        *,
        rag_enabled: bool = True,
        top_k: int | None = None,
        temperature: float | None = None,
    ) -> dict[str, object]:
        """
        Runs hybrid retrieval and returns a persisted query response.

        Args:
            query_text (str): The user question.
            document_ids (list[str] | None): Optional document id filter.
            rag_enabled (bool): When false, skips retrieval and answers without document context.
            top_k (int | None): Retrieval depth when RAG is enabled.
            temperature (float | None): LLM temperature override.

        Returns:
            dict[str, object]: The persisted query response with answer and sources.
        """

        retrieval_start = perf_counter()
        if rag_enabled:
            hits, sources = await asyncio.to_thread(
                self._prepare_query, query_text, document_ids, top_k
            )
        else:
            hits, sources = [], []
        retrieval_ms = (perf_counter() - retrieval_start) * 1000

        llm_start = perf_counter()
        if rag_enabled:
            answer = await self._llm.answer(query_text, hits, temperature=temperature)
        else:
            answer = await self._llm.answer_general(query_text, temperature=temperature)
        llm_ms = (perf_counter() - llm_start) * 1000

        db_start = perf_counter()
        stored = await asyncio.to_thread(
            db.store_query, query=query_text, answer=answer, sources=sources
        )
        db_ms = (perf_counter() - db_start) * 1000
        logger.info(
            "Query timing retrieval_ms=%.2f llm_ms=%.2f db_ms=%.2f hits=%d",
            retrieval_ms,
            llm_ms,
            db_ms,
            len(hits),
        )
        return stored

    async def stream_query(
        self,
        query_text: str,
        document_ids: list[str] | None = None,
        *,
        rag_enabled: bool = True,
        top_k: int | None = None,
        temperature: float | None = None,
    ) -> AsyncIterator[str]:
        """
        Streams hybrid retrieval output and persists the final answer.

        Args:
            query_text (str): The user question.
            document_ids (list[str] | None): Optional document id filter.
            rag_enabled (bool): When false, skips retrieval and streams a general answer.
            top_k (int | None): Retrieval depth when RAG is enabled.
            temperature (float | None): LLM temperature override.

        Returns:
            AsyncIterator[str]: SSE-formatted events for the frontend.
        """

        retrieval_start = perf_counter()
        if rag_enabled:
            hits, sources = await asyncio.to_thread(
                self._prepare_query, query_text, document_ids, top_k
            )
        else:
            hits, sources = [], []
        retrieval_ms = (perf_counter() - retrieval_start) * 1000
        answer_parts: list[str] = []

        try:
            llm_start = perf_counter()
            stream = (
                self._llm.stream_answer(query_text, hits, temperature=temperature)
                if rag_enabled
                else self._llm.stream_answer_general(query_text, temperature=temperature)
            )
            async for delta in stream:
                if delta:
                    answer_parts.append(delta)
                    yield _serialize_sse_event("token", {"delta": delta})
            llm_ms = (perf_counter() - llm_start) * 1000
        except Exception as error:  # pragma: no cover - upstream/network failures
            logger.exception("Streaming query failed")
            yield _serialize_sse_event("error", {"message": str(error)})
            return

        answer = "".join(answer_parts).strip() or "No relevant documents found."
        db_start = perf_counter()
        stored = await asyncio.to_thread(
            db.store_query, query=query_text, answer=answer, sources=sources
        )
        db_ms = (perf_counter() - db_start) * 1000
        logger.info(
            "Stream query timing retrieval_ms=%.2f llm_ms=%.2f db_ms=%.2f hits=%d",
            retrieval_ms,
            llm_ms,
            db_ms,
            len(hits),
        )
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

    def delete_history_item(self, query_id: str) -> bool:
        """
        Removes one stored query history item and its sources.

        Args:
            query_id (str): The query history identifier.

        Returns:
            bool: True when the history item existed and was removed.
        """

        return db.delete_query_history(query_id)
