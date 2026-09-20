"""Whole path through the API: upload a document, ask a question, get a source back."""

from __future__ import annotations

from starlette.testclient import TestClient


def test_question_returns_the_uploaded_document_as_source(client: TestClient) -> None:
    created = client.post(
        "/documents",
        json={
            "filename": "Mietvertrag.txt",
            "content": "Die Kaltmiete betraegt 900 Euro pro Monat. " * 10,
            "documentType": "rental_contract",
        },
    ).json()
    # Background indexing has finished by the time the response returns in TestClient.
    assert client.get("/documents").json()[0]["status"] == "ready"

    response = client.post("/queries", json={"query": "Wie hoch ist die Kaltmiete?"})

    assert response.status_code == 200
    sources = response.json()["sources"]
    assert sources[0]["filename"] == "Mietvertrag.txt"
    assert sources[0]["documentId"] == created["id"]

    client.delete(f"/documents/{created['id']}")
