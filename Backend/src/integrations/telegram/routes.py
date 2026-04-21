"""Telegram webhook routes."""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, Request

from src.integrations.telegram.service import TelegramService

router = APIRouter(prefix="/integrations/telegram", tags=["telegram"])
service = TelegramService()


@router.get("/health")
def health() -> dict[str, str | bool]:
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

    if not service.validate_secret(telegram_secret):
        raise HTTPException(status_code=401, detail="invalid telegram secret")

    payload = await request.json()
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="invalid payload")

    await service.handle_update(payload)
    return {"status": "ok"}
