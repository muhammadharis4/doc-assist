"""Query service logic."""

from __future__ import annotations

from src import db
from src.config import settings
from src.constants import SOURCE_SNIPPET_MAX_CHARS
from src.services.embeddings import generate_query_embedding
from src.services.llm import LlmService
from src.services.opensearch_store import hybrid_search


class QueryService:
    """Handles hybrid retrieval, answer generation, and query history."""

    def __init__(self) -> None:
        self._llm = LlmService()

    async def run_query(self, query_text: str) -> dict[str, object]:
        """
        Runs hybrid retrieval and returns a persisted query response.

        Args:
            query_text (str): The user question.

        Returns:
            dict[str, object]: The persisted query response with answer and sources.
        """

        query_embedding = generate_query_embedding(query_text)
        hits = hybrid_search(query=query_text, query_embedding=query_embedding, top_k=settings.top_k)

        answer = await self._llm.answer(query_text, hits)
        sources = [
            {
                "documentId": hit.get("documentId"),
                "filename": hit.get("filename"),
                "snippet": str(hit.get("content", ""))[:SOURCE_SNIPPET_MAX_CHARS],
                "score": float(hit.get("score", 0.0)),
            }
            for hit in hits
        ]
        return db.store_query(query=query_text, answer=answer, sources=sources)

    def get_history(self, limit: int) -> list[dict[str, object]]:
        """
        Returns recent query history with source snippets.

        Args:
            limit (int): Maximum number of history rows to return.

        Returns:
            list[dict[str, object]]: Recent query history rows ordered by recency.
        """

        return db.list_query_history(limit)
