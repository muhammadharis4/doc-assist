"""Telegram webhook routes."""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, Request

from src.constants import RATE_LIMIT_TELEGRAM_HEALTH
from src.rate_limit import limiter
from src.integrations.telegram.service import TelegramService

router = APIRouter(prefix="/integrations/telegram", tags=["telegram"])
service = TelegramService()


@router.get("/health")
@limiter.limit(RATE_LIMIT_TELEGRAM_HEALTH)
def health(request: Request) -> dict[str, str | bool]:
    """
    Returns Telegram integration health information.

    Returns:
        dict[str, str | bool]: Health payload.
    """

    return {"status": "ok", "enabled": service.enabled}


@router.post("/webhook")
async def webhook(
    request: Request,
    telegram_secret: str | None = Header(default=None, alias="X-Telegram-Bot-Api-Secret-Token"),
) -> dict[str, str]:
    """
    Handles Telegram webhook updates.

    Args:
        request (Request): Incoming FastAPI request.
        telegram_secret (str | None): Telegram secret header.

    Returns:
        dict[str, str]: Processing status.
    """

    if not service.enabled:
        return {"status": "disabled"}

    # Header checked with constant-time compare when TELEGRAM_WEBHOOK_SECRET is set.
    if not service.validate_secret(telegram_secret):
        raise HTTPException(status_code=401, detail="invalid telegram secret")

    payload = await request.json()
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="invalid payload")

    await service.handle_update(payload)
    return {"status": "ok"}
