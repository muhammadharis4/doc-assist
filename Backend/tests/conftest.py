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
os.environ.setdefault("WATCH_FOLDER", "")
os.environ.setdefault("TELEGRAM_BOT_TOKEN", "")
os.environ.setdefault("TELEGRAM_WEBHOOK_URL", "")
os.environ.setdefault("DOCASSIST_TESTING", "1")

import pytest
from starlette.testclient import TestClient


@pytest.fixture(scope="session", autouse=True)
def _empty_test_database() -> None:
    """Starts every test run on an empty database (tests assume no leftover rows)."""

    from src import db

    db.init_db()
    with db._connection() as connection:
        connection.execute("TRUNCATE documents, query_history CASCADE")


@pytest.fixture
def client() -> TestClient:
    """
    FastAPI client on the test Postgres, with warmup, embedding and LLM calls faked so
    tests need no Ollama (CI-safe).
    """

    from src.constants import EMBEDDING_DIMENSIONS

    async def fake_answer(self, query, chunks, *, temperature=None):
        return f"Answer based on {len(chunks)} sources"

    main_mod = importlib.import_module("src.main")
    with patch.object(main_mod, "warmup_runtime", new_callable=AsyncMock):
        with patch(
            "src.rag.embeddings.generate_embeddings",
            lambda chunks: [[0.1] * EMBEDDING_DIMENSIONS for _ in chunks],
        ):
            with patch(
                "src.rag.embeddings.generate_query_embedding",
                lambda query: [0.1] * EMBEDDING_DIMENSIONS,
            ):
                with patch("src.rag.llm.LlmService.answer", fake_answer):
                    with TestClient(main_mod.app) as test_client:
                        yield test_client
