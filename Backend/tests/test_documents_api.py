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
