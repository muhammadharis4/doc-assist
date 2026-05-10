"""Telegram webhook secret validation."""

from __future__ import annotations

import types

import pytest

from src.integrations.telegram.service import TelegramService


@pytest.fixture
def telegram_with_secret(monkeypatch: pytest.MonkeyPatch) -> TelegramService:
    fake = types.SimpleNamespace(
        telegram_bot_token="test-token",
        telegram_webhook_secret="expected-secret",
        telegram_webhook_url="",
    )
    monkeypatch.setattr("src.integrations.telegram.service.settings", fake)
    return TelegramService()


@pytest.fixture
def telegram_no_secret(monkeypatch: pytest.MonkeyPatch) -> TelegramService:
    fake = types.SimpleNamespace(
        telegram_bot_token="test-token",
        telegram_webhook_secret="",
        telegram_webhook_url="",
    )
    monkeypatch.setattr("src.integrations.telegram.service.settings", fake)
    return TelegramService()


def test_validate_secret_accepts_match(telegram_with_secret: TelegramService) -> None:
    assert telegram_with_secret.validate_secret("expected-secret") is True


def test_validate_secret_rejects_mismatch(telegram_with_secret: TelegramService) -> None:
    assert telegram_with_secret.validate_secret("wrong") is False
    assert telegram_with_secret.validate_secret(None) is False


def test_validate_secret_skipped_when_not_configured(
    telegram_no_secret: TelegramService,
) -> None:
    assert telegram_no_secret.validate_secret(None) is True
    assert telegram_no_secret.validate_secret("any") is True
