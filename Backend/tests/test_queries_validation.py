"""Query route validation without hitting OpenSearch or Ollama."""

from __future__ import annotations

from starlette.testclient import TestClient

from src.constants import MAX_QUERY_LENGTH


def test_post_queries_rejects_empty_query(client: TestClient) -> None:
    response = client.post("/queries", json={"query": "   "})
    assert response.status_code == 400


def test_post_queries_rejects_overlong_query(client: TestClient) -> None:
    response = client.post(
        "/queries",
        json={"query": "x" * (MAX_QUERY_LENGTH + 1)},
    )
    # Pydantic rejects overlong body before the route handler (422).
    assert response.status_code == 422


def test_query_history_returns_list(client: TestClient) -> None:
    response = client.get("/queries/history?limit=5")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
