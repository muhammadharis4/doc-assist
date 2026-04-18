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
    return datetime.now(timezone.utc).isoformat()


def init_db() -> None:
    """Creates required tables if they do not exist."""

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
                created_at TEXT NOT NULL
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
                snippet TEXT NOT NULL,
                score REAL,
                FOREIGN KEY (query_history_id) REFERENCES query_history(id)
            );
            """
        )


@contextmanager
def _connection() -> Iterator[sqlite3.Connection]:
    connection = sqlite3.connect(settings.db_path)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def create_document(filename: str, content: str, mime_type: str | None) -> dict[str, str | None]:
    """Stores one document row and returns the created row."""

    document_id = str(uuid4())
    created_at = _utc_now()

    with _connection() as connection:
        connection.execute(
            """
            INSERT INTO documents (id, filename, content, mime_type, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (document_id, filename, content, mime_type, created_at),
        )

    return {
        "id": document_id,
        "filename": filename,
        "content": content,
        "mimeType": mime_type,
        "createdAt": created_at,
    }


def list_documents() -> list[dict[str, str | None]]:
    """Returns all documents ordered from newest to oldest."""

    with _connection() as connection:
        rows = connection.execute(
            """
            SELECT id, filename, content, mime_type, created_at
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
            "createdAt": row["created_at"],
        }
        for row in rows
    ]


def delete_document(document_id: str) -> bool:
    """Deletes a document row and returns True when a row was removed."""

    with _connection() as connection:
        result = connection.execute(
            "DELETE FROM documents WHERE id = ?",
            (document_id,),
        )
    return result.rowcount > 0


def store_query(query: str, answer: str, sources: list[dict[str, str | float | None]]) -> dict[str, object]:
    """Stores query history and source rows, then returns the saved shape."""

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
                INSERT INTO query_sources (id, query_history_id, document_id, filename, snippet, score)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid4()),
                    query_id,
                    source.get("documentId"),
                    source.get("filename"),
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
    """Returns query history with attached sources, newest first."""

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
                SELECT document_id, filename, snippet, score
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
                            "snippet": row["snippet"],
                            "score": row["score"],
                        }
                        for row in source_rows
                    ],
                }
            )

    return result
