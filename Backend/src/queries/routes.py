"""Query API routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from src.config import settings
from src.constants import DEFAULT_HISTORY_LIMIT, MAX_HISTORY_LIMIT
from src.schemas import QueryExecuteRequest, QueryResponse
from src.queries.service import QueryService

router = APIRouter(prefix="/queries", tags=["queries"])
service = QueryService()


def _validate_query_text(query_text: str) -> str:
    """
    Validates one user query string.

    Args:
        query_text (str): Raw query text.

    Returns:
        str: Trimmed and validated query text.
    """

    trimmed_query = query_text.strip()
    if not trimmed_query:
        raise HTTPException(status_code=400, detail="query is required")

    if len(trimmed_query) > settings.max_query_length:
        raise HTTPException(
            status_code=400,
            detail=f"query exceeds {settings.max_query_length} chars",
        )

    return trimmed_query


@router.post("", response_model=QueryResponse)
async def run_query(payload: QueryExecuteRequest) -> dict[str, object]:
    """
    Runs hybrid retrieval and returns answer with sources.

    Args:
        payload (QueryExecuteRequest): Query payload.

    Returns:
        dict[str, object]: Stored query response payload.
    """

    query_text = _validate_query_text(payload.query)
    return await service.run_query(query_text)


@router.post("/stream")
async def run_query_stream(payload: QueryExecuteRequest) -> StreamingResponse:
    """
    Streams hybrid retrieval and answer tokens to the frontend.

    Args:
        payload (QueryExecuteRequest): Query payload.

    Returns:
        StreamingResponse: SSE stream with tokens and final result.
    """

    query_text = _validate_query_text(payload.query)
    return StreamingResponse(
        service.stream_query(query_text),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


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
