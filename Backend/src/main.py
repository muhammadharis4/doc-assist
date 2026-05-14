"""FastAPI entrypoint for the rebuilt DocAssist backend."""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from src import db
from src.config import settings
from src.documents.routes import router as documents_router
from src.http_security import install_security_middleware
from src.integrations.telegram.routes import router as telegram_router, service as telegram_service
from src.queries.routes import router as queries_router
from src.rag.opensearch_store import ensure_index_and_pipeline
from src.rate_limit import limiter
from src.warmup import warmup_runtime
from src.utils.logging import setup_logging

setup_logging()
logger = logging.getLogger(__name__)


def _run_startup_step(name: str, step) -> None:
    """
    Runs one startup step without letting optional infrastructure crash the app.

    Args:
        name (str): Human-readable startup step name.
        step: Callable startup step.

    Returns:
        None: This function only logs startup issues.
    """

    try:
        step()
    except Exception as error:  # pragma: no cover - environment-dependent startup
        logger.warning("Startup step failed for %s: %s", name, error)


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Initializes storage dependencies when the API starts."""

    _run_startup_step("database", db.init_db)
    _run_startup_step("opensearch", ensure_index_and_pipeline)

    try:
        await warmup_runtime()
    except Exception as error:  # pragma: no cover - environment-dependent startup
        logger.warning("Startup step failed for warmup: %s", error)

    if telegram_service.enabled and settings.telegram_webhook_url.strip():
        asyncio.create_task(telegram_service.register_webhook_retry_loop())

    yield


app = FastAPI(title=settings.app_name, version=settings.app_version, lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(documents_router)
app.include_router(queries_router)
app.include_router(telegram_router)

install_security_middleware(app)


@app.get("/health")
def health() -> dict[str, str]:
    """Reports backend readiness for local checks."""

    return {"status": "ok"}
