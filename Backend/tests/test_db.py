"""Postgres layer checks: schema is idempotent, filters work, deletes cascade."""

from __future__ import annotations

from src import db
from src.constants import EMBEDDING_DIMENSIONS


def _insert_chunk(document_id: str, content: str) -> None:
    vector = "[" + ",".join(["0.1"] * EMBEDDING_DIMENSIONS) + "]"
    with db._connection() as connection:
        connection.execute(
            "INSERT INTO chunks (document_id, chunk_index, content, embedding) VALUES (%s, 0, %s, %s::vector)",
            (document_id, content, vector),
        )


def _chunk_count(document_id: str) -> int:
    with db._connection() as connection:
        row = connection.execute(
            "SELECT count(*) AS n FROM chunks WHERE document_id = %s", (document_id,)
        ).fetchone()
    return row["n"]


def test_init_db_is_idempotent() -> None:
    db.init_db()
    db.init_db()


def test_document_roundtrip_filters_and_cascade() -> None:
    db.init_db()
    doc = db.create_document("Miete.pdf", "body", None, "rental_contract", tags=["Home", "2026"])

    assert db.get_document(doc["id"])["tags"] == ["Home", "2026"]
    assert [d["id"] for d in db.list_documents(tag="home", document_type="rental_contract")].count(doc["id"]) == 1
    assert db.list_documents(filename_substring="miete")[0]["content"] == ""
    assert db.update_document_tags(doc["id"], ["x"])["tags"] == ["x"]

    db.update_document_status(doc["id"], "ready")
    assert db.get_document(doc["id"])["indexedAt"]

    _insert_chunk(doc["id"], "Kaltmiete 900 Euro")
    assert _chunk_count(doc["id"]) == 1
    assert db.delete_document(doc["id"]) is True
    assert _chunk_count(doc["id"]) == 0
    assert db.delete_document(doc["id"]) is False


def test_replace_document_chunks_does_not_duplicate() -> None:
    db.init_db()
    doc = db.create_document("a.txt", "body", None, "other")
    vectors = [[0.1] * EMBEDDING_DIMENSIONS, [0.2] * EMBEDDING_DIMENSIONS]

    db.replace_document_chunks(doc["id"], ["one", "two"], vectors)
    db.replace_document_chunks(doc["id"], ["one", "two"], vectors)

    assert _chunk_count(doc["id"]) == 2
    db.delete_document(doc["id"])


def test_query_history_roundtrip_and_cascade() -> None:
    db.init_db()
    stored = db.store_query("q?", "a.", [{"documentId": None, "filename": "f", "snippet": "s", "score": 0.5}])

    history = {h["id"]: h for h in db.list_query_history(50)}
    assert history[stored["id"]]["sources"][0]["filename"] == "f"
    assert db.delete_query_history(stored["id"]) is True
    assert db.delete_query_history(stored["id"]) is False
