"""Document list filters and tags."""

from __future__ import annotations

from starlette.testclient import TestClient


def test_list_documents_empty(client: TestClient) -> None:
    response = client.get("/documents")
    assert response.status_code == 200
    assert response.json() == []


def test_create_and_list_with_tag_filter(client: TestClient) -> None:
    create = client.post(
        "/documents",
        json={
            "filename": "lease.txt",
            "content": "hello world",
            "documentType": "rental_contract",
            "tags": ["important", "2024"],
        },
    )
    assert create.status_code == 200
    doc_id = create.json()["id"]
    assert create.json()["tags"] == ["important", "2024"]

    by_tag = client.get("/documents", params={"tag": "important"})
    assert by_tag.status_code == 200
    rows = by_tag.json()
    assert len(rows) == 1
    assert rows[0]["id"] == doc_id

    miss = client.get("/documents", params={"tag": "nope"})
    assert miss.status_code == 200
    assert miss.json() == []


def test_filename_query_filter(client: TestClient) -> None:
    client.post(
        "/documents",
        json={
            "filename": "Alpha-notes.txt",
            "content": "x",
            "documentType": "other",
            "tags": [],
        },
    )
    r = client.get("/documents", params={"q": "alpha"})
    assert r.status_code == 200
    assert len(r.json()) == 1
    assert "Alpha" in r.json()[0]["filename"]


def test_patch_tags(client: TestClient) -> None:
    create = client.post(
        "/documents",
        json={"filename": "a.txt", "content": "c", "documentType": "other", "tags": ["a"]},
    )
    doc_id = create.json()["id"]

    patch = client.patch(f"/documents/{doc_id}", json={"tags": ["b", "c"]})
    assert patch.status_code == 200
    assert patch.json()["tags"] == ["b", "c"]
