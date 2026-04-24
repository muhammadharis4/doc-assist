"""SQLite persistence for documents, queries, and sources."""

from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator
from uuid import uuid4

from src.config import settings
from src.constants import MAX_HISTORY_LIMIT


def _utc_now() -> str:
    """
    Returns the current UTC timestamp as an ISO string.

    Returns:
        str: Current UTC time in ISO 8601 format.
    """

    return datetime.now(timezone.utc).isoformat()


def init_db() -> None:
    """
    Creates required tables if they do not exist.

    Returns:
        None: This function only initializes database tables.
    """

    db_file = Path(settings.db_path)
    db_file.parent.mkdir(parents=True, exist_ok=True)

    with _connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                content TEXT NOT NULL,
                mime_type TEXT,
                document_type TEXT NOT NULL DEFAULT 'other',
                created_at TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'ready',
                error_message TEXT,
                indexed_at TEXT
            );

            CREATE TABLE IF NOT EXISTS query_history (
                id TEXT PRIMARY KEY,
                query TEXT NOT NULL,
                answer TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS query_sources (
                id TEXT PRIMARY KEY,
                query_history_id TEXT NOT NULL,
                document_id TEXT,
                filename TEXT,
                document_type TEXT NOT NULL DEFAULT 'other',
                snippet TEXT NOT NULL,
                score REAL,
                FOREIGN KEY (query_history_id) REFERENCES query_history(id)
            );
            """
        )

        _ensure_document_columns(connection)
        _ensure_query_source_columns(connection)


def _ensure_document_columns(connection: sqlite3.Connection) -> None:
    """
    Ensures the documents table includes async processing columns.

    Args:
        connection (sqlite3.Connection): Active SQLite connection.

    Returns:
        None: This function only applies schema compatibility updates.
    """

    columns = {
        row["name"]
        for row in connection.execute("PRAGMA table_info(documents)").fetchall()
    }

    if "status" not in columns:
        connection.execute(
            "ALTER TABLE documents ADD COLUMN status TEXT NOT NULL DEFAULT 'ready'"
        )
    if "error_message" not in columns:
        connection.execute("ALTER TABLE documents ADD COLUMN error_message TEXT")
    if "indexed_at" not in columns:
        connection.execute("ALTER TABLE documents ADD COLUMN indexed_at TEXT")
    if "document_type" not in columns:
        connection.execute(
            "ALTER TABLE documents ADD COLUMN document_type TEXT NOT NULL DEFAULT 'other'"
        )


def _ensure_query_source_columns(connection: sqlite3.Connection) -> None:
    """
    Ensures query_sources includes optional metadata columns.

    Args:
        connection (sqlite3.Connection): Active SQLite connection.

    Returns:
        None: This function only applies schema compatibility updates.
    """

    columns = {
        row["name"]
        for row in connection.execute("PRAGMA table_info(query_sources)").fetchall()
    }

    if "document_type" not in columns:
        connection.execute(
            "ALTER TABLE query_sources ADD COLUMN document_type TEXT NOT NULL DEFAULT 'other'"
        )


@contextmanager
def _connection() -> Iterator[sqlite3.Connection]:
    """
    Yields a configured SQLite connection.

    Returns:
        Iterator[sqlite3.Connection]: Managed SQLite connection context.
    """

    connection = sqlite3.connect(settings.db_path)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def create_document(
    filename: str,
    content: str,
    mime_type: str | None,
    document_type: str,
    status: str = "pending",
) -> dict[str, object]:
    """
    Stores one document row and returns the created row.

    Args:
        filename (str): Document filename.
        content (str): Document content.
        mime_type (str | None): Optional MIME type.
        document_type (str): User-selected document category.

    Returns:
        dict[str, object]: Stored document payload.
    """

    document_id = str(uuid4())
    created_at = _utc_now()

    with _connection() as connection:
        connection.execute(
            """
            INSERT INTO documents (
                id,
                filename,
                content,
                mime_type,
                document_type,
                created_at,
                status,
                error_message,
                indexed_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL)
            """,
            (document_id, filename, content, mime_type, document_type, created_at, status),
        )

    return {
        "id": document_id,
        "filename": filename,
        "content": content,
        "mimeType": mime_type,
        "documentType": document_type,
        "createdAt": created_at,
        "status": status,
        "errorMessage": None,
        "indexedAt": None,
    }

def list_documents() -> list[dict[str, object]]:
    """
    Returns all documents ordered from newest to oldest.

    Returns:
        list[dict[str, object]]: Stored documents in recency order.
    """

    with _connection() as connection:
        rows = connection.execute(
            """
            SELECT id, filename, content, mime_type, document_type, created_at, status, error_message, indexed_at
            FROM documents
            ORDER BY created_at DESC
            """
        ).fetchall()

    return [
        {
            "id": row["id"],
            "filename": row["filename"],
            "content": row["content"],
            "mimeType": row["mime_type"],
            "documentType": row["document_type"] or "other",
            "createdAt": row["created_at"],
            "status": row["status"],
            "errorMessage": row["error_message"],
            "indexedAt": row["indexed_at"],
        }
        for row in rows
    ]


def get_document(document_id: str) -> dict[str, object] | None:
    """
    Returns one document row by id.

    Args:
        document_id (str): The document identifier.

    Returns:
        dict[str, object] | None: Document row if found.
    """

    with _connection() as connection:
        row = connection.execute(
            """
            SELECT id, filename, content, mime_type, document_type, created_at, status, error_message, indexed_at
            FROM documents
            WHERE id = ?
            """,
            (document_id,),
        ).fetchone()

    if row is None:
        return None

    return {
        "id": row["id"],
        "filename": row["filename"],
        "content": row["content"],
        "mimeType": row["mime_type"],
        "documentType": row["document_type"] or "other",
        "createdAt": row["created_at"],
        "status": row["status"],
        "errorMessage": row["error_message"],
        "indexedAt": row["indexed_at"],
    }


def update_document_status(
    document_id: str,
    status: str,
    error_message: str | None = None,
    indexed_at: str | None = None,
) -> None:
    """
    Updates async processing status fields for one document.

    Args:
        document_id (str): The document identifier.
        status (str): New processing status.
        error_message (str | None): Optional failure reason.
        indexed_at (str | None): Optional indexing completion timestamp.

    Returns:
        None: This function only updates one document row.
    """

    if status == "ready" and indexed_at is None:
        indexed_at = _utc_now()

    with _connection() as connection:
        connection.execute(
            """
            UPDATE documents
            SET status = ?, error_message = ?, indexed_at = ?
            WHERE id = ?
            """,
            (status, error_message, indexed_at, document_id),
        )


def delete_document(document_id: str) -> bool:
    """
    Deletes a document row and returns True when a row was removed.

    Args:
        document_id (str): The document identifier.

    Returns:
        bool: True when the document existed and was deleted.
    """

    with _connection() as connection:
        result = connection.execute(
            "DELETE FROM documents WHERE id = ?",
            (document_id,),
        )
    return result.rowcount > 0


def store_query(query: str, answer: str, sources: list[dict[str, str | float | None]]) -> dict[str, object]:
    """
    Stores query history and source rows, then returns the saved shape.

    Args:
        query (str): The user query text.
        answer (str): The generated answer text.
        sources (list[dict[str, str | float | None]]): Source rows to persist.

    Returns:
        dict[str, object]: Stored query history payload.
    """

    query_id = str(uuid4())
    created_at = _utc_now()

    with _connection() as connection:
        connection.execute(
            """
            INSERT INTO query_history (id, query, answer, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (query_id, query, answer, created_at),
        )

        for source in sources:
            connection.execute(
                """
                INSERT INTO query_sources (
                    id,
                    query_history_id,
                    document_id,
                    filename,
                    document_type,
                    snippet,
                    score
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid4()),
                    query_id,
                    source.get("documentId"),
                    source.get("filename"),
                    source.get("documentType") or "other",
                    source.get("snippet"),
                    source.get("score"),
                ),
            )

    return {
        "id": query_id,
        "query": query,
        "answer": answer,
        "userId": None,
        "createdAt": created_at,
        "sources": sources,
    }


def list_query_history(limit: int) -> list[dict[str, object]]:
    """
    Returns query history with attached sources, newest first.

    Args:
        limit (int): Maximum number of rows to return.

    Returns:
        list[dict[str, object]]: Query history rows with source snippets.
    """

    safe_limit = max(1, min(limit, MAX_HISTORY_LIMIT))

    with _connection() as connection:
        history_rows = connection.execute(
            """
            SELECT id, query, answer, created_at
            FROM query_history
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (safe_limit,),
        ).fetchall()

        result: list[dict[str, object]] = []
        for history in history_rows:
            source_rows = connection.execute(
                """
                SELECT document_id, filename, document_type, snippet, score
                FROM query_sources
                WHERE query_history_id = ?
                """,
                (history["id"],),
            ).fetchall()

            result.append(
                {
                    "id": history["id"],
                    "query": history["query"],
                    "answer": history["answer"],
                    "userId": None,
                    "createdAt": history["created_at"],
                    "sources": [
                        {
                            "documentId": row["document_id"],
                            "filename": row["filename"],
                            "documentType": row["document_type"] or "other",
                            "snippet": row["snippet"],
                            "score": row["score"],
                        }
                        for row in source_rows
                    ],
                }
            )

    return result
