"""
Runtime configuration.

Only a handful of values come from the process environment (see `_build_settings`);
everything else lives in ``src.constants`` so defaults stay in code, not scattered env files.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv

from src.constants import (
    APP_NAME,
    APP_VERSION,
    CHUNK_OVERLAP_CHARS,
    CHUNK_SIZE_CHARS,
    DOC_TYPE_SCORE_BOOST,
    EMBEDDING_MODEL,
    MAX_QUERY_LENGTH,
    OLLAMA_MODEL,
    OLLAMA_TEMPERATURE,
    OPENSEARCH_INDEX_NAME,
    OPENSEARCH_PIPELINE_NAME,
    RAG_CANDIDATE_MULTIPLIER,
    RAG_MAX_RESULTS_PER_DOCUMENT,
    SOURCE_SNIPPET_MAX_CHARS,
    TEXT_SCORE_WEIGHT,
    TOP_K,
    VECTOR_SCORE_WEIGHT,
)


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


def _as_bool(raw: str | None, default: bool = False) -> bool:
    """
    Converts a string environment value into a boolean.

    Args:
        raw (str | None): Raw environment value.
        default (bool): Value returned when the input is missing.

    Returns:
        bool: Parsed boolean value.
    """

    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    """
    Holds all runtime settings (env-backed fields are set in `_build_settings`).

    Returns:
        Settings: Immutable settings container.
    """

    app_name: str
    app_version: str
    database_url: str
    watch_folder: str
    opensearch_url: str
    opensearch_index_name: str
    opensearch_pipeline_name: str
    embedding_model: str
    chunk_size_chars: int
    chunk_overlap_chars: int
    top_k: int
    rag_candidate_multiplier: int
    rag_max_results_per_document: int
    source_snippet_max_chars: int
    doc_type_score_boost: float
    text_score_weight: float
    vector_score_weight: float
    max_query_length: int
    ollama_base_url: str
    ollama_model: str
    ollama_temperature: float
    use_mock_llm: bool
    telegram_bot_token: str
    telegram_webhook_secret: str
    telegram_webhook_url: str
    cors_allow_origins: tuple[str, ...]
    trusted_hosts: tuple[str, ...]


def _build_settings() -> Settings:
    """
    Builds Settings from constants plus a minimal environment surface:

    ``DATABASE_URL``, ``WATCH_FOLDER``, ``OPENSEARCH_URL``, ``OLLAMA_BASE_URL``, ``USE_MOCK_LLM``,
    ``TELEGRAM_BOT_TOKEN``, ``TELEGRAM_WEBHOOK_SECRET``, ``TELEGRAM_WEBHOOK_URL``,
    ``CORS_ALLOW_ORIGINS``, ``TRUSTED_HOSTS``.
    """

    return Settings(
        app_name=APP_NAME,
        app_version=APP_VERSION,
        database_url=os.getenv(
            "DATABASE_URL", "postgresql://docassist:docassist@localhost:5432/docassist"
        ),
        watch_folder=os.getenv("WATCH_FOLDER", "Sample data"),
        opensearch_url=os.getenv("OPENSEARCH_URL", "http://localhost:9200"),
        opensearch_index_name=OPENSEARCH_INDEX_NAME,
        opensearch_pipeline_name=OPENSEARCH_PIPELINE_NAME,
        embedding_model=EMBEDDING_MODEL,
        chunk_size_chars=CHUNK_SIZE_CHARS,
        chunk_overlap_chars=CHUNK_OVERLAP_CHARS,
        top_k=TOP_K,
        rag_candidate_multiplier=RAG_CANDIDATE_MULTIPLIER,
        rag_max_results_per_document=RAG_MAX_RESULTS_PER_DOCUMENT,
        source_snippet_max_chars=SOURCE_SNIPPET_MAX_CHARS,
        doc_type_score_boost=DOC_TYPE_SCORE_BOOST,
        text_score_weight=TEXT_SCORE_WEIGHT,
        vector_score_weight=VECTOR_SCORE_WEIGHT,
        max_query_length=MAX_QUERY_LENGTH,
        ollama_base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        ollama_model=OLLAMA_MODEL,
        ollama_temperature=OLLAMA_TEMPERATURE,
        use_mock_llm=_as_bool(os.getenv("USE_MOCK_LLM"), default=False),
        telegram_bot_token=os.getenv("TELEGRAM_BOT_TOKEN", ""),
        telegram_webhook_secret=os.getenv("TELEGRAM_WEBHOOK_SECRET", ""),
        telegram_webhook_url=os.getenv("TELEGRAM_WEBHOOK_URL", ""),
        cors_allow_origins=_parse_cors_origins(os.getenv("CORS_ALLOW_ORIGINS")),
        trusted_hosts=_parse_csv_tuple(os.getenv("TRUSTED_HOSTS")),
    )


settings = _build_settings()
