"""FastAPI entrypoint for the rebuilt DocAssist backend."""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.middleware.trustedhost import TrustedHostMiddleware

from src import db
from src.config import settings
from src.constants import APP_NAME, APP_VERSION
from src.documents.folder_scanner import watch_folder
from src.documents.routes import router as documents_router
from src.integrations.telegram.routes import router as telegram_router, service as telegram_service
from src.queries.routes import router as queries_router
from src.warmup import warmup_runtime

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
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

    try:
        await warmup_runtime()
    except Exception as error:  # pragma: no cover - environment-dependent startup
        logger.warning("Startup step failed for warmup: %s", error)

    asyncio.create_task(watch_folder())

    if telegram_service.enabled and settings.telegram_webhook_url.strip():
        asyncio.create_task(telegram_service.register_webhook_retry_loop())

    yield


app = FastAPI(title=APP_NAME, version=APP_VERSION, lifespan=lifespan)

app.include_router(documents_router)
app.include_router(queries_router)
app.include_router(telegram_router)

if settings.trusted_hosts:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=list(settings.trusted_hosts))


@app.get("/health")
def health() -> dict[str, str]:
    """Reports backend readiness for local checks."""

    return {"status": "ok"}
