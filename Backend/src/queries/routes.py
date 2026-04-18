"""Query API routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from src.config import settings
from src.constants import DEFAULT_HISTORY_LIMIT, MAX_HISTORY_LIMIT
from src.schemas import QueryExecuteRequest, QueryResponse
from src.queries.service import QueryService

router = APIRouter(prefix="/queries", tags=["queries"])
service = QueryService()


@router.post("", response_model=QueryResponse)
async def run_query(payload: QueryExecuteRequest) -> dict[str, object]:
    """
    Runs hybrid retrieval and returns answer with sources.

    Args:
        payload (QueryExecuteRequest): Query payload.

    Returns:
        dict[str, object]: Stored query response payload.
    """

    query_text = payload.query.strip()
    if not query_text:
        raise HTTPException(status_code=400, detail="query is required")

    if len(query_text) > settings.max_query_length:
        raise HTTPException(
            status_code=400,
            detail=f"query exceeds {settings.max_query_length} chars",
        )

    return await service.run_query(query_text)


@router.get("/history", response_model=list[QueryResponse])
def query_history(
    limit: int = Query(default=DEFAULT_HISTORY_LIMIT, ge=1, le=MAX_HISTORY_LIMIT),
) -> list[dict[str, object]]:
    """
    Returns recent query history used by the frontend chat panel.

    Args:
        limit (int): Maximum number of history rows to return.

    Returns:
        list[dict[str, object]]: Recent query history rows.
    """

    return service.get_history(limit)
