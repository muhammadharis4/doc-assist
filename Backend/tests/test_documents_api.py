"""Document list endpoint (empty DB)."""

from __future__ import annotations

from starlette.testclient import TestClient


def test_list_documents_empty(client: TestClient) -> None:
    response = client.get("/documents")
    assert response.status_code == 200
    assert response.json() == []
