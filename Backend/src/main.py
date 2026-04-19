"""FastAPI entrypoint for the rebuilt DocAssist backend."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI

from src import db
from src.config import settings
from src.rag.opensearch_store import ensure_index_and_pipeline
from src.documents.routes import router as documents_router
from src.queries.routes import router as queries_router
from src.warmup import warmup_runtime
from src.utils.logging import setup_logging

setup_logging()


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Initializes storage dependencies when the API starts."""

    db.init_db()
    ensure_index_and_pipeline()
    await warmup_runtime()
    yield


app = FastAPI(title=settings.app_name, version=settings.app_version, lifespan=lifespan)
app.include_router(documents_router)
app.include_router(queries_router)


@app.get("/health")
def health() -> dict[str, str]:
    """Reports backend readiness for local checks."""

    return {"status": "ok"}
