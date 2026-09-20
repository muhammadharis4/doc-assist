"""
Pytest fixtures. `DATABASE_URL` must be set before any `src` import.

Needs a throwaway pgvector Postgres (never point this at real data):
    docker run -d --rm --name docassist-test-db -p 5433:5432 -e POSTGRES_USER=docassist \
        -e POSTGRES_PASSWORD=docassist -e POSTGRES_DB=docassist_test pgvector/pgvector:pg17
"""

from __future__ import annotations

import importlib
import os
from unittest.mock import AsyncMock, patch

os.environ["DATABASE_URL"] = "postgresql://docassist:docassist@localhost:5433/docassist_test"
os.environ.setdefault("USE_MOCK_LLM", "true")
os.environ.setdefault("TELEGRAM_BOT_TOKEN", "")
os.environ.setdefault("TELEGRAM_WEBHOOK_URL", "")
os.environ.setdefault("DOCASSIST_TESTING", "1")

import pytest
from starlette.testclient import TestClient


@pytest.fixture
def client() -> TestClient:
    """
    FastAPI client with OpenSearch index setup, embedding/LLM warmup, and document
    index writes skipped so tests run without a local OpenSearch cluster (CI-safe).
    """

    main_mod = importlib.import_module("src.main")
    with patch.object(main_mod, "ensure_index_and_pipeline", lambda: None):
        with patch.object(main_mod, "warmup_runtime", new_callable=AsyncMock):
            with patch(
                "src.db.replace_document_chunks",
                lambda *args, **kwargs: None,
            ):
                with patch(
                    "src.documents.routes.delete_document_chunks",
                    lambda *args, **kwargs: None,
                ):
                    with TestClient(main_mod.app) as test_client:
                        yield test_client
