"""Telegram webhook service that bridges chat messages to query execution."""

from __future__ import annotations

import logging

from telegram import Bot, Update
from telegram.constants import ChatAction

from src import db
from src.config import settings
from src.queries.service import QueryService

logger = logging.getLogger(__name__)


class TelegramService:
    """Handles Telegram update processing and response delivery."""

    def __init__(self) -> None:
        self._token = settings.telegram_bot_token.strip()
        self._secret = settings.telegram_webhook_secret.strip()
        self._bot = Bot(self._token) if self._token else None
        self._query_service = QueryService()
        self._chat_document_scope: dict[int, str] = {}

    @property
    def enabled(self) -> bool:
        """
        Returns whether Telegram integration is configured.

        Returns:
            bool: True when a bot token is configured.
        """

        return self._bot is not None

    def validate_secret(self, secret_token: str | None) -> bool:
        """
        Validates Telegram webhook secret token when configured.

        Args:
            secret_token (str | None): Incoming webhook secret header.

        Returns:
            bool: True when the secret is valid or not required.
        """

        if not self._secret:
            return True

        return (secret_token or "") == self._secret

    async def register_webhook(self) -> bool:
        """
        Registers the configured Telegram webhook when a public URL is available.

        Returns:
            bool: True when a webhook URL is configured and registration was attempted.
        """

        webhook_url = settings.telegram_webhook_url.strip()
        if not self._bot or not webhook_url:
            return False

        await self._bot.set_webhook(
            url=webhook_url,
            secret_token=self._secret or None,
        )
        logger.info("Telegram webhook registered for %s", webhook_url)
        return True

    async def handle_update(self, payload: dict[str, object]) -> None:
        """
        Handles a Telegram update payload.

        Args:
            payload (dict[str, object]): Raw Telegram update payload.

        Returns:
            None: This function only handles side effects.
        """

        if not self._bot:
            logger.info("Telegram update ignored because integration is disabled")
            return

        update = Update.de_json(payload, self._bot)
        message = update.effective_message
        if message is None:
            return

        text = (message.text or "").strip()
        if not text:
            return

        chat_id = message.chat_id

        if text.startswith("/start"):
            await self._bot.send_message(
                chat_id=chat_id,
                text=(
                    "Welcome to DocAssist.\n\n"
                    "Send me a question about your indexed documents.\n"
                    "Use /help for commands."
                ),
            )
            return

        if text.startswith("/help"):
            await self._bot.send_message(
                chat_id=chat_id,
                text=(
                    "Commands:\n"
                    "/start - Start the bot\n"
                    "/help - Show this help\n"
                    "/docs - List ready documents\n"
                    "/use <id|name> - Focus one document\n"
                    "/clear - Clear focused document\n"
                    "/status - Show document processing status\n\n"
                    "Or just send a plain question."
                ),
            )
            return

        if text.startswith("/docs"):
            await self._bot.send_message(chat_id=chat_id, text=self._build_docs_message())
            return

        if text.startswith("/use"):
            arg = text[4:].strip()
            if not arg:
                await self._bot.send_message(
                    chat_id=chat_id,
                    text="Usage: /use <document id or filename>",
                )
                return

            selected_document = self._resolve_document(arg)
            if selected_document is None:
                await self._bot.send_message(
                    chat_id=chat_id,
                    text="Document not found. Use /docs to list available files.",
                )
                return

            self._chat_document_scope[chat_id] = str(selected_document.get("id", ""))
            await self._bot.send_message(
                chat_id=chat_id,
                text=(
                    "Using document: "
                    f"{selected_document.get('filename', 'Unknown')} "
                    f"({str(selected_document.get('id', ''))[:8]})"
                ),
            )
            return

        if text.startswith("/clear"):
            self._chat_document_scope.pop(chat_id, None)
            await self._bot.send_message(
                chat_id=chat_id,
                text="Cleared document focus. Queries now use all documents.",
            )
            return

        if text.startswith("/status"):
            await self._bot.send_message(chat_id=chat_id, text=self._build_status_message())
            return

        query_text = text
        if len(query_text) > settings.max_query_length:
            await self._bot.send_message(
                chat_id=chat_id,
                text=f"Question is too long. Max length is {settings.max_query_length} characters.",
            )
            return

        try:
            await self._bot.send_chat_action(chat_id=chat_id, action=ChatAction.TYPING)
            scoped_document_id = self._chat_document_scope.get(chat_id)
            scope_label = "all documents"

            document_ids: list[str] | None = None
            if scoped_document_id:
                scoped_document = self._resolve_document(scoped_document_id)
                if scoped_document is None:
                    self._chat_document_scope.pop(chat_id, None)
                    await self._bot.send_message(
                        chat_id=chat_id,
                        text=(
                            "Your selected document is no longer ready/available. "
                            "Scope was cleared automatically."
                        ),
                    )
                else:
                    document_ids = [scoped_document_id]
                    scope_label = f"selected {scoped_document.get('filename', 'Unknown')}"

            result = await self._query_service.run_query(
                query_text,
                document_ids=document_ids,
            )
            await self._bot.send_message(
                chat_id=chat_id,
                text=self._format_query_response(result, scope_label=scope_label),
            )
        except Exception as error:  # pragma: no cover - network/runtime dependent
            logger.exception("Telegram query handling failed")
            await self._bot.send_message(
                chat_id=chat_id,
                text=f"Something went wrong while processing your question: {error}",
            )

    def _build_docs_message(self) -> str:
        """
        Builds a compact list of ready documents for Telegram users.

        Returns:
            str: Human-readable document list.
        """

        documents = db.list_documents()
        ready_documents = [item for item in documents if item.get("status") == "ready"]
        if not ready_documents:
            return "No ready documents found."

        lines = ["Ready documents:"]
        docs_list_limit = max(1, settings.telegram_docs_list_limit)
        for item in ready_documents[:docs_list_limit]:
            document_id = str(item.get("id", ""))
            filename = str(item.get("filename") or "Unknown")
            document_type = str(item.get("documentType") or "other")
            lines.append(f"- {document_id[:8]} | {filename} | {document_type}")

        extra_count = len(ready_documents) - docs_list_limit
        if extra_count > 0:
            lines.append(f"... and {extra_count} more")

        return "\n".join(lines)

    def _resolve_document(self, query: str) -> dict[str, object] | None:
        """
        Resolves one document from a user identifier or filename fragment.

        Args:
            query (str): User-provided document id or name fragment.

        Returns:
            dict[str, object] | None: Matching ready document row.
        """

        normalized = query.strip().lower()
        if not normalized:
            return None

        documents = db.list_documents()
        ready_documents = [item for item in documents if item.get("status") == "ready"]

        exact_id_match = next(
            (
                item
                for item in ready_documents
                if str(item.get("id", "")).lower() == normalized
            ),
            None,
        )
        if exact_id_match is not None:
            return exact_id_match

        prefix_id_match = next(
            (
                item
                for item in ready_documents
                if str(item.get("id", "")).lower().startswith(normalized)
            ),
            None,
        )
        if prefix_id_match is not None:
            return prefix_id_match

        return next(
            (
                item
                for item in ready_documents
                if normalized in str(item.get("filename", "")).lower()
            ),
            None,
        )

    def _build_status_message(self) -> str:
        """
        Builds a compact status summary for indexed documents.

        Returns:
            str: Human-readable document status summary.
        """

        documents = db.list_documents()
        if not documents:
            return "No documents uploaded yet."

        pending = sum(1 for item in documents if item.get("status") == "pending")
        processing = sum(1 for item in documents if item.get("status") == "processing")
        ready = sum(1 for item in documents if item.get("status") == "ready")
        failed = sum(1 for item in documents if item.get("status") == "failed")

        return (
            f"Documents: {len(documents)}\n"
            f"Ready: {ready}\n"
            f"Pending: {pending}\n"
            f"Processing: {processing}\n"
            f"Failed: {failed}"
        )

    def _format_query_response(self, result: dict[str, object], scope_label: str | None = None) -> str:
        """
        Formats a query response payload into a Telegram message.

        Args:
            result (dict[str, object]): Query result payload.

        Returns:
            str: Telegram-ready answer message.
        """

        answer = str(result.get("answer", "No answer generated.")).strip() or "No answer generated."
        sources = result.get("sources")
        source_lines: list[str] = []

        if isinstance(sources, list):
            source_limit = max(1, settings.telegram_source_limit)
            for source in sources[:source_limit]:
                if not isinstance(source, dict):
                    continue
                filename = str(source.get("filename") or "Unknown source")
                snippet = str(source.get("snippet") or "").strip()
                if snippet:
                    source_lines.append(f"- {filename}: {snippet}")
                else:
                    source_lines.append(f"- {filename}")

        message = answer
        if source_lines:
            message += "\n\nSources:\n" + "\n".join(source_lines)

        if scope_label and settings.telegram_scope_label_enabled:
            message += f"\n\nScope: {scope_label}"

        max_message_chars = max(100, settings.telegram_max_message_chars)
        if len(message) > max_message_chars:
            message = message[: max_message_chars - 3].rstrip() + "..."

        return message
