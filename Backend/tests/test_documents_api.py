"""Document API smoke tests (see ``test_documents_filters`` for list/tags coverage)."""

from __future__ import annotations

from starlette.testclient import TestClient


def test_post_document_minimal(client: TestClient) -> None:
    response = client.post(
        "/documents",
        json={"filename": "x.txt", "content": "body", "documentType": "other"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["tags"] == []
    assert data["status"] == "pending"
    delete = client.delete(f"/documents/{data['id']}")
    assert delete.status_code == 200


def test_original_file_is_stored_and_served(client: TestClient) -> None:
    document = client.post(
        "/documents", json={"filename": "slip.pdf", "content": "body", "documentType": "other"}
    ).json()
    url = f"/documents/{document['id']}/file"
    assert client.get(url).status_code == 404

    assert client.put(url, content=b"%PDF-1.4 data").status_code == 200
    response = client.get(url)
    assert response.status_code == 200
    assert response.content == b"%PDF-1.4 data"
    assert response.headers["content-type"] == "application/pdf"

    client.delete(f"/documents/{document['id']}")
    assert client.get(url).status_code == 404
