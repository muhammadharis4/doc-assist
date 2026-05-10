"""
Pytest fixtures. Environment for `APP_DB_PATH` must be set before any `src` import.
"""

from __future__ import annotations

import os
import tempfile
from unittest.mock import AsyncMock, patch

# Isolated SQLite file for the test process (before importing `src.config`).
_fd, _TEST_DB = tempfile.mkstemp(suffix=".db")
os.close(_fd)
os.environ["APP_DB_PATH"] = _TEST_DB
os.environ.setdefault("USE_MOCK_LLM", "true")
os.environ.setdefault("TELEGRAM_BOT_TOKEN", "")
os.environ.setdefault("TELEGRAM_WEBHOOK_URL", "")

import pytest
from starlette.testclient import TestClient


@pytest.fixture
def client() -> TestClient:
    """
    FastAPI client with OpenSearch setup and embedding/LLM warmup skipped (fast, CI-safe).
    """

    with patch("src.main.ensure_index_and_pipeline", lambda: None):
        with patch("src.main.warmup_runtime", new_callable=AsyncMock):
            from src.main import app

            with TestClient(app) as test_client:
                yield test_client
