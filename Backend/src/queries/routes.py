"""Query API routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse

from src.constants import (
    DEFAULT_HISTORY_LIMIT,
    MAX_HISTORY_LIMIT,
    RATE_LIMIT_QUERIES_EXECUTE,
    RATE_LIMIT_QUERIES_STREAM,
    RATE_LIMIT_QUERY_HISTORY_DELETE,
    RATE_LIMIT_QUERY_HISTORY_LIST,
)
from src.rate_limit import limiter
from src.schemas import DeleteStatusResponse, QueryExecuteRequest, QueryResponse
from src.queries.service import QueryService

router = APIRouter(prefix="/queries", tags=["queries"])
service = QueryService()


def _validate_query_text(query_text: str) -> str:
    """
    Validates one user query string (length is enforced by Pydantic on the body model).

    Args:
        query_text (str): Raw query text.

    Returns:
        str: Trimmed and validated query text.
    """

    trimmed_query = query_text.strip()
    if not trimmed_query:
        raise HTTPException(status_code=400, detail="query is required")

    return trimmed_query


@router.post("", response_model=QueryResponse)
@limiter.limit(RATE_LIMIT_QUERIES_EXECUTE)
async def run_query(request: Request, payload: QueryExecuteRequest) -> dict[str, object]:
    """
    Runs hybrid retrieval and returns answer with sources.

    Args:
        request (Request): Request (required for rate limiting).
        payload (QueryExecuteRequest): Query payload.

    Returns:
        dict[str, object]: Stored query response payload.
    """

    query_text = _validate_query_text(payload.query)
    return await service.run_query(
        query_text,
        rag_enabled=payload.rag_enabled,
        top_k=payload.top_k,
        temperature=payload.temperature,
    )


@router.post("/stream")
@limiter.limit(RATE_LIMIT_QUERIES_STREAM)
async def run_query_stream(
    request: Request, payload: QueryExecuteRequest
) -> StreamingResponse:
    """
    Streams hybrid retrieval and answer tokens to the frontend.

    Args:
        request (Request): Request (required for rate limiting).
        payload (QueryExecuteRequest): Query payload.

    Returns:
        StreamingResponse: SSE stream with tokens and final result.
    """

    query_text = _validate_query_text(payload.query)
    return StreamingResponse(
        service.stream_query(
            query_text,
            rag_enabled=payload.rag_enabled,
            top_k=payload.top_k,
            temperature=payload.temperature,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/history", response_model=list[QueryResponse])
@limiter.limit(RATE_LIMIT_QUERY_HISTORY_LIST)
def query_history(
    request: Request,
    limit: int = Query(default=DEFAULT_HISTORY_LIMIT, ge=1, le=MAX_HISTORY_LIMIT),
) -> list[dict[str, object]]:
    """
    Returns recent query history used by the frontend chat panel.

    Args:
        request (Request): Request (required for rate limiting).
        limit (int): Maximum number of history rows to return.

    Returns:
        list[dict[str, object]]: Recent query history rows.
    """

    return service.get_history(limit)


@router.delete("/history/{query_id}", response_model=DeleteStatusResponse)
@limiter.limit(RATE_LIMIT_QUERY_HISTORY_DELETE)
def delete_query_history(request: Request, query_id: str) -> DeleteStatusResponse:
    """
    Deletes one query history entry and its stored sources.

    Args:
        request (Request): Request (required for rate limiting).
        query_id (str): The query history identifier.

    Returns:
        DeleteStatusResponse: Delete result payload.
    """

    if not query_id.strip():
        raise HTTPException(status_code=400, detail="query_id is required")

    deleted = service.delete_history_item(query_id.strip())
    if not deleted:
        raise HTTPException(status_code=404, detail="query history not found")

    return DeleteStatusResponse(status="deleted")
