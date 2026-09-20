"""Query API routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from src import db
from src.constants import DEFAULT_HISTORY_LIMIT, MAX_HISTORY_LIMIT
from src.schemas import DeleteStatusResponse, QueryExecuteRequest, QueryResponse

router = APIRouter(prefix="/queries", tags=["queries"])
_query_service = None


def _get_query_service():
    """
    Lazily constructs ``QueryService`` so importing this router does not load
    the embedding model stack until a query route is actually invoked.
    """

    global _query_service

    if _query_service is None:
        from src.queries.service import QueryService

        _query_service = QueryService()
    return _query_service


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
async def run_query(payload: QueryExecuteRequest) -> dict[str, object]:
    """
    Runs hybrid retrieval and returns answer with sources.

    Args:
        payload (QueryExecuteRequest): Query payload.

    Returns:
        dict[str, object]: Stored query response payload.
    """

    query_text = _validate_query_text(payload.query)
    return await _get_query_service().run_query(
        query_text,
        rag_enabled=payload.rag_enabled,
        top_k=payload.top_k,
        temperature=payload.temperature,
    )


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
        _get_query_service().stream_query(
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

    return db.list_query_history(limit)


@router.delete("/history/{query_id}", response_model=DeleteStatusResponse)
def delete_query_history(query_id: str) -> DeleteStatusResponse:
    """
    Deletes one query history entry and its stored sources.

    Args:
        query_id (str): The query history identifier.

    Returns:
        DeleteStatusResponse: Delete result payload.
    """

    if not query_id.strip():
        raise HTTPException(status_code=400, detail="query_id is required")

    deleted = db.delete_query_history(query_id.strip())
    if not deleted:
        raise HTTPException(status_code=404, detail="query history not found")

    return DeleteStatusResponse(status="deleted")
