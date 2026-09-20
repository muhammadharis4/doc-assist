"""Telegram file uploads: immediate acknowledgement, background ingest, final reply."""

from __future__ import annotations

import asyncio
import types

import pytest
from telegram import Bot

from src.integrations.telegram.service import TelegramService


class _FakeFile:
    async def download_as_bytearray(self) -> bytearray:
        return bytearray(b"data")


@pytest.fixture
def telegram(monkeypatch: pytest.MonkeyPatch) -> tuple[TelegramService, list[str], list[tuple]]:
    fake_settings = types.SimpleNamespace(
        telegram_bot_token="test-token", telegram_webhook_secret="", telegram_webhook_url=""
    )
    monkeypatch.setattr("src.integrations.telegram.service.settings", fake_settings)

    sent: list[str] = []
    ingested: list[tuple] = []

    async def send_message(self, chat_id, text, **kwargs):
        sent.append(text)

    async def get_file(self, file_id, **kwargs):
        return _FakeFile()

    def ingest_file(self, file_bytes, filename, source):
        ingested.append((file_bytes, filename, source))
        return {"status": "ready", "errorMessage": None}

    # Bot instances are frozen, so patch the class.
    monkeypatch.setattr(Bot, "send_message", send_message)
    monkeypatch.setattr(Bot, "get_file", get_file)
    monkeypatch.setattr("src.documents.service.DocumentService.ingest_file", ingest_file)
    return TelegramService(), sent, ingested


def _update(**attachment: object) -> dict[str, object]:
    return {
        "update_id": 1,
        "message": {"message_id": 1, "date": 0, "chat": {"id": 42, "type": "private"}, **attachment},
    }


def _handle(service: TelegramService, payload: dict[str, object]) -> None:
    async def run() -> None:
        await service.handle_update(payload)
        await asyncio.gather(*service._ingest_tasks)

    asyncio.run(run())


def test_document_is_acknowledged_then_ingested(telegram) -> None:
    service, sent, ingested = telegram
    document = {"file_id": "f", "file_unique_id": "u", "file_name": "Miete.pdf", "file_size": 10}

    _handle(service, _update(document=document))

    assert ingested == [(b"data", "Miete.pdf", "telegram")]
    assert sent[0].startswith("Received Miete.pdf")
    assert sent[1] == "Miete.pdf is ready. Ask me a question about it."


def test_photo_gets_a_generated_jpg_name(telegram) -> None:
    service, sent, ingested = telegram
    photo = [
        {"file_id": "small", "file_unique_id": "u1", "width": 10, "height": 10, "file_size": 5},
        {"file_id": "big", "file_unique_id": "u2", "width": 100, "height": 100, "file_size": 50},
    ]

    _handle(service, _update(photo=photo))

    assert ingested[0][1] == "telegram-u2.jpg"


def test_unsupported_type_is_rejected(telegram) -> None:
    service, sent, ingested = telegram
    document = {"file_id": "f", "file_unique_id": "u", "file_name": "x.zip", "file_size": 10}

    _handle(service, _update(document=document))

    assert ingested == []
    assert sent == ["Unsupported file type. Send a PDF, JPG, or PNG."]
