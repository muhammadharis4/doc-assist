"""Smoke tests for public HTTP endpoints."""

from __future__ import annotations

from starlette.testclient import TestClient


def test_health_returns_ok(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_telegram_health_reports_disabled_when_no_token(client: TestClient) -> None:
    response = client.get("/integrations/telegram/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["enabled"] is False
