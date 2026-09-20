"""Postgres persistence for documents, chunks (pgvector), queries, and sources."""

from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Iterator
from uuid import uuid4

import psycopg
from psycopg.rows import dict_row

from src.config import settings
from src.constants import EMBEDDING_DIMENSIONS, MAX_HISTORY_LIMIT


def _utc_now() -> str:
    """
    Returns the current UTC timestamp as an ISO string.

    Returns:
        str: Current UTC time in ISO 8601 format.
    """

    return datetime.now(timezone.utc).isoformat()


def init_db() -> None:
    """
    Creates the vector extension, tables, and indexes if they do not exist.

    Returns:
        None: This function only initializes database tables.
    """

    with _connection() as connection:
        connection.execute("CREATE EXTENSION IF NOT EXISTS vector")
        connection.execute(
            f"""
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                content TEXT NOT NULL,
                mime_type TEXT,
                document_type TEXT NOT NULL DEFAULT 'other',
                created_at TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'ready',
                error_message TEXT,
                indexed_at TEXT,
                tags TEXT[] NOT NULL DEFAULT '{{}}',
                source TEXT NOT NULL DEFAULT 'upload',
                content_hash TEXT
            );
            CREATE UNIQUE INDEX IF NOT EXISTS documents_hash_idx
                ON documents (content_hash) WHERE content_hash IS NOT NULL;

            CREATE TABLE IF NOT EXISTS chunks (
                id BIGSERIAL PRIMARY KEY,
                document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                chunk_index INTEGER NOT NULL,
                content TEXT NOT NULL,
                embedding vector({EMBEDDING_DIMENSIONS}) NOT NULL,
                tsv tsvector GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED
            );
            CREATE INDEX IF NOT EXISTS chunks_document_idx ON chunks (document_id);
            CREATE INDEX IF NOT EXISTS chunks_tsv_idx ON chunks USING gin (tsv);
            CREATE INDEX IF NOT EXISTS chunks_embedding_idx
                ON chunks USING hnsw (embedding vector_cosine_ops);

            CREATE TABLE IF NOT EXISTS query_history (
                id TEXT PRIMARY KEY,
                query TEXT NOT NULL,
                answer TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS query_sources (
                id TEXT PRIMARY KEY,
                query_history_id TEXT NOT NULL REFERENCES query_history(id) ON DELETE CASCADE,
                document_id TEXT,
                filename TEXT,
                document_type TEXT NOT NULL DEFAULT 'other',
                snippet TEXT NOT NULL,
                score REAL
            );
            """
        )


@contextmanager
def _connection() -> Iterator[psycopg.Connection]:
    """
    Yields a Postgres connection that commits on success and closes on exit.

    Returns:
        Iterator[psycopg.Connection]: Managed connection returning dict rows.
    """

    # ponytail: one connection per call, add psycopg_pool if latency shows up.
    with psycopg.connect(settings.database_url, row_factory=dict_row) as connection:
        yield connection


def _document_from_row(row: dict[str, object], *, with_content: bool) -> dict[str, object]:
    """
    Maps a documents row to the API payload shape.

    Args:
        row (dict[str, object]): Row from the documents table.
        with_content (bool): Include the full text (list responses omit it).

    Returns:
        dict[str, object]: Document payload with camelCase keys.
    """

    return {
        "id": row["id"],
        "filename": row["filename"],
        "content": row["content"] if with_content else "",
        "mimeType": row["mime_type"],
        "documentType": row["document_type"] or "other",
        "createdAt": row["created_at"],
        "status": row["status"],
        "errorMessage": row["error_message"],
        "indexedAt": row["indexed_at"],
        "tags": row["tags"],
    }


def create_document(
    filename: str,
    content: str,
    mime_type: str | None,
    document_type: str,
    status: str = "pending",
    tags: list[str] | None = None,
    source: str = "upload",
    content_hash: str | None = None,
) -> dict[str, object]:
    """
    Stores one document row and returns the created row.

    Args:
        filename (str): Document filename.
        content (str): Document content.
        mime_type (str | None): Optional MIME type.
        document_type (str): User-selected document category.
        status (str): Processing status for new rows.
        tags (list[str] | None): Optional tag list.
        source (str): Where the file came from (``upload``, ``folder``, ``telegram``).
        content_hash (str | None): SHA-256 of the original file, unique when set.

    Returns:
        dict[str, object]: Stored document payload.
    """

    document_id = str(uuid4())
    created_at = _utc_now()
    tag_list = list(tags) if tags is not None else []

    with _connection() as connection:
        connection.execute(
            """
            INSERT INTO documents (
                id, filename, content, mime_type, document_type,
                created_at, status, error_message, indexed_at, tags, source, content_hash
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, NULL, NULL, %s, %s, %s)
            """,
            (
                document_id, filename, content, mime_type, document_type,
                created_at, status, tag_list, source, content_hash,
            ),
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
        "tags": tag_list,
    }


def list_documents(
    *,
    filename_substring: str | None = None,
    document_type: str | None = None,
    status: str | None = None,
    tag: str | None = None,
    created_from: str | None = None,
    created_to: str | None = None,
) -> list[dict[str, object]]:
    """
    Returns documents newest first, optionally filtered.

    Args:
        filename_substring (str | None): Case-insensitive substring match on ``filename``.
        document_type (str | None): Exact ``document_type`` filter.
        status (str | None): Exact status, or ``inbox`` for pending and processing.
        tag (str | None): Exact tag match (case-insensitive).
        created_from (str | None): Inclusive lower bound on ``created_at`` (ISO string).
        created_to (str | None): Inclusive upper bound on ``created_at`` (ISO string).

    Returns:
        list[dict[str, object]]: Stored document rows (content omitted on list responses).
    """

    clauses: list[str] = []
    params: list[object] = []

    if filename_substring and filename_substring.strip():
        clauses.append("POSITION(LOWER(%s) IN LOWER(filename)) > 0")
        params.append(filename_substring.strip())

    if document_type and document_type.strip():
        clauses.append("document_type = %s")
        params.append(document_type.strip())

    if status and status.strip():
        lowered = status.strip().lower()
        if lowered == "inbox":
            clauses.append("status IN ('pending', 'processing')")
        else:
            clauses.append("status = %s")
            params.append(status.strip())

    if tag and tag.strip():
        clauses.append("EXISTS (SELECT 1 FROM unnest(tags) AS t WHERE LOWER(t) = LOWER(%s))")
        params.append(tag.strip())

    if created_from and created_from.strip():
        clauses.append("created_at >= %s")
        params.append(created_from.strip())

    if created_to and created_to.strip():
        clauses.append("created_at <= %s")
        params.append(created_to.strip())

    where_sql = " AND ".join(clauses) if clauses else "TRUE"
    sql = f"""
        SELECT id, filename, content, mime_type, document_type, created_at, status,
               error_message, indexed_at, tags
        FROM documents
        WHERE {where_sql}
        ORDER BY created_at DESC
    """

    with _connection() as connection:
        rows = connection.execute(sql, params).fetchall()

    return [_document_from_row(row, with_content=False) for row in rows]


def find_document_id_by_hash(content_hash: str) -> str | None:
    """
    Returns the id of the document ingested from a file with this hash, if any.

    Args:
        content_hash (str): SHA-256 of the original file.

    Returns:
        str | None: Document id, or ``None`` when the file is new.
    """

    with _connection() as connection:
        row = connection.execute(
            "SELECT id FROM documents WHERE content_hash = %s", (content_hash,)
        ).fetchone()
    return None if row is None else row["id"]


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
            "SELECT * FROM documents WHERE id = %s",
            (document_id,),
        ).fetchone()

    return None if row is None else _document_from_row(row, with_content=True)


def update_document_tags(document_id: str, tags: list[str]) -> dict[str, object] | None:
    """
    Replaces stored tags for one document.

    Args:
        document_id (str): Document id.
        tags (list[str]): New tag list (may be empty).

    Returns:
        dict[str, object] | None: Updated document row, or ``None`` if id missing.
    """

    with _connection() as connection:
        result = connection.execute(
            "UPDATE documents SET tags = %s WHERE id = %s",
            (tags, document_id),
        )
        if result.rowcount == 0:
            return None

    return get_document(document_id)


def set_document_content(document_id: str, content: str) -> None:
    """
    Stores the extracted text of one document.

    Args:
        document_id (str): The document identifier.
        content (str): Extracted document text.

    Returns:
        None: This function only updates one document row.
    """

    with _connection() as connection:
        connection.execute("UPDATE documents SET content = %s WHERE id = %s", (content, document_id))


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
            SET status = %s, error_message = %s, indexed_at = %s
            WHERE id = %s
            """,
            (status, error_message, indexed_at, document_id),
        )


def replace_document_chunks(
    document_id: str, chunks: list[str], embeddings: list[list[float]]
) -> None:
    """
    Replaces all chunks of one document, so re-processing never duplicates them.

    Args:
        document_id (str): The document identifier.
        chunks (list[str]): Chunk texts in order.
        embeddings (list[list[float]]): One embedding vector per chunk.

    Returns:
        None: This function only writes to the chunks table.
    """

    rows = [
        (document_id, index, text, "[" + ",".join(map(str, vector)) + "]")
        for index, (text, vector) in enumerate(zip(chunks, embeddings, strict=True))
    ]
    with _connection() as connection:
        connection.execute("DELETE FROM chunks WHERE document_id = %s", (document_id,))
        connection.cursor().executemany(
            "INSERT INTO chunks (document_id, chunk_index, content, embedding) VALUES (%s, %s, %s, %s::vector)",
            rows,
        )


def delete_document(document_id: str) -> bool:
    """
    Deletes a document row (its chunks cascade) and returns True when a row was removed.

    Args:
        document_id (str): The document identifier.

    Returns:
        bool: True when the document existed and was deleted.
    """

    with _connection() as connection:
        result = connection.execute("DELETE FROM documents WHERE id = %s", (document_id,))
    return result.rowcount > 0


def delete_query_history(query_id: str) -> bool:
    """
    Deletes one query history row; its source rows cascade.

    Args:
        query_id (str): The query history identifier.

    Returns:
        bool: True when the query history existed and was deleted.
    """

    with _connection() as connection:
        result = connection.execute("DELETE FROM query_history WHERE id = %s", (query_id,))

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
            "INSERT INTO query_history (id, query, answer, created_at) VALUES (%s, %s, %s, %s)",
            (query_id, query, answer, created_at),
        )

        for source in sources:
            connection.execute(
                """
                INSERT INTO query_sources (
                    id, query_history_id, document_id, filename, document_type, snippet, score
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
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
            "SELECT id, query, answer, created_at FROM query_history ORDER BY created_at DESC LIMIT %s",
            (safe_limit,),
        ).fetchall()

        sources_by_history_id: dict[str, list[dict[str, object]]] = {
            row["id"]: [] for row in history_rows
        }

        if sources_by_history_id:
            source_rows = connection.execute(
                """
                SELECT query_history_id, document_id, filename, document_type, snippet, score
                FROM query_sources
                WHERE query_history_id = ANY(%s)
                """,
                (list(sources_by_history_id),),
            ).fetchall()

            for row in source_rows:
                sources_by_history_id[row["query_history_id"]].append(
                    {
                        "documentId": row["document_id"],
                        "filename": row["filename"],
                        "documentType": row["document_type"] or "other",
                        "snippet": row["snippet"],
                        "score": row["score"],
                    }
                )

    return [
        {
            "id": history["id"],
            "query": history["query"],
            "answer": history["answer"],
            "userId": None,
            "createdAt": history["created_at"],
            "sources": sources_by_history_id[history["id"]],
        }
        for history in history_rows
    ]
