"""
Runtime configuration.

Only a handful of values come from the process environment (see `_build_settings`);
everything else lives in ``src.constants`` so defaults stay in code, not scattered env files.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


def _parse_csv_tuple(raw: str | None) -> tuple[str, ...]:
    """
    Parses a comma-separated list into a tuple of non-empty strings.

    Args:
        raw (str | None): Raw environment value.

    Returns:
        tuple[str, ...]: Ordered unique-ish tokens (caller trims each segment).
    """

    if not raw or not str(raw).strip():
        return ()
    return tuple(part.strip() for part in str(raw).split(",") if part.strip())


def _parse_cors_origins(raw: str | None) -> tuple[str, ...]:
    """
    Parses ``CORS_ALLOW_ORIGINS``: empty disables CORS middleware; ``*`` allows all.

    Args:
        raw (str | None): Raw environment value.

    Returns:
        tuple[str, ...]: Origins list, or ``("*",)`` when set to a lone asterisk.
    """

    stripped = (raw or "").strip()
    if not stripped:
        return ()
    if stripped == "*":
        return ("*",)
    return _parse_csv_tuple(stripped)


@dataclass(frozen=True)
class Settings:
    """
    Holds all runtime settings (env-backed fields are set in `_build_settings`).

    Returns:
        Settings: Immutable settings container.
    """

    database_url: str
    watch_folder: str
    ollama_base_url: str
    telegram_bot_token: str
    telegram_webhook_secret: str
    telegram_webhook_url: str
    cors_allow_origins: tuple[str, ...]
    trusted_hosts: tuple[str, ...]


def _build_settings() -> Settings:
    """
    Builds Settings from constants plus a minimal environment surface:

    ``DATABASE_URL``, ``WATCH_FOLDER``, ``OLLAMA_BASE_URL``,
    ``TELEGRAM_BOT_TOKEN``, ``TELEGRAM_WEBHOOK_SECRET``, ``TELEGRAM_WEBHOOK_URL``,
    ``CORS_ALLOW_ORIGINS``, ``TRUSTED_HOSTS``.
    """

    return Settings(
        database_url=os.getenv(
            "DATABASE_URL", "postgresql://docassist:docassist@localhost:5432/docassist"
        ),
        watch_folder=os.getenv("WATCH_FOLDER", "Sample data"),
        ollama_base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        telegram_bot_token=os.getenv("TELEGRAM_BOT_TOKEN", ""),
        telegram_webhook_secret=os.getenv("TELEGRAM_WEBHOOK_SECRET", ""),
        telegram_webhook_url=os.getenv("TELEGRAM_WEBHOOK_URL", ""),
        cors_allow_origins=_parse_cors_origins(os.getenv("CORS_ALLOW_ORIGINS")),
        trusted_hosts=_parse_csv_tuple(os.getenv("TRUSTED_HOSTS")),
    )


settings = _build_settings()
