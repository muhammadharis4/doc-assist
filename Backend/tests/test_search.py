"""hybrid_search against the test Postgres: keyword side, vector side, RRF merge, filters."""

from __future__ import annotations

import uuid

import pytest

from src import db
from src.constants import EMBEDDING_DIMENSIONS


def _vec(axis: int) -> list[float]:
    vector = [0.0] * EMBEDDING_DIMENSIONS
    vector[axis] = 1.0
    return vector


@pytest.fixture
def corpus():
    """Three ready documents with hand-made vectors; removed afterwards."""
    db.init_db()
    tag = uuid.uuid4().hex[:8]  # keeps words unique against other rows in the shared test DB
    docs = {}
    for name, doc_type, text, axis in [
        ("rent", "rental_contract", f"Kaltmiete{tag} betraegt 900 Euro", 1),
        ("salary", "salary_slip", f"Stundenlohn{tag} und Gesamtbrutto", 2),
        ("other", "other", f"Anmeldung{tag} beim Buergeramt", 3),
    ]:
        doc = db.create_document(f"{name}.pdf", text, None, doc_type, status="ready")
        db.replace_document_chunks(doc["id"], [text], [_vec(axis)])
        docs[name] = doc["id"]
    yield tag, docs
    for doc_id in docs.values():
        db.delete_document(doc_id)


def _ids(hits: list[dict[str, object]]) -> list[str]:
    return [hit["documentId"] for hit in hits]


def test_keyword_only_and_vector_only_matches_are_both_found(corpus) -> None:
    tag, docs = corpus
    # Keyword hit on "rent" while the vector points at "salary": RRF must return both.
    hits = db.hybrid_search(f"Kaltmiete{tag}", _vec(2), top_k=5, document_ids=list(docs.values()))

    assert {docs["rent"], docs["salary"]} <= set(_ids(hits))
    assert hits[0]["filename"] in {"rent.pdf", "salary.pdf"}


def test_document_matching_both_sides_ranks_first(corpus) -> None:
    tag, docs = corpus
    hits = db.hybrid_search(f"Stundenlohn{tag}", _vec(2), top_k=5, document_ids=list(docs.values()))

    assert _ids(hits)[0] == docs["salary"]


def test_filters_and_type_boost(corpus) -> None:
    tag, docs = corpus
    only_other = db.hybrid_search(f"Kaltmiete{tag}", _vec(1), top_k=5, document_ids=[docs["other"]])
    assert set(_ids(only_other)) == {docs["other"]}

    # No keyword or vector preference between these two: the boosted type wins.
    scoped = list(docs.values())
    boosted = db.hybrid_search("zzz", _vec(0), top_k=5, document_ids=scoped, boost_types=["other"])
    assert _ids(boosted)[0] == docs["other"]

    # "Latest 1" among boosted types: the newest salary slip only, not the newest document overall.
    newest = db.hybrid_search("zzz", _vec(0), top_k=5, document_ids=None, boost_types=["salary_slip"], latest_n=1)
    assert {hit["documentType"] for hit in newest} == {"salary_slip"}
    assert len({hit["documentId"] for hit in newest}) == 1

    db.update_document_status(docs["rent"], "processing")
    hits = db.hybrid_search(f"Kaltmiete{tag}", _vec(1), top_k=5, document_ids=scoped)
    assert docs["rent"] not in _ids(hits)
