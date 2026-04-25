"""Environment-driven runtime settings."""

from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv

from src.constants import (
    APP_NAME,
    APP_VERSION,
    CHUNK_OVERLAP_CHARS,
    CHUNK_SIZE_CHARS,
    DEFAULT_HISTORY_LIMIT,
    DOC_TYPE_SCORE_BOOST,
    EMBEDDING_MODEL_PATH,
    MAX_QUERY_LENGTH,
    OCR_LANGUAGES,
    OPENSEARCH_INDEX_NAME,
    OPENSEARCH_PIPELINE_NAME,
    RAG_CANDIDATE_MULTIPLIER,
    RAG_MAX_RESULTS_PER_DOCUMENT,
    SOURCE_SNIPPET_MAX_CHARS,
    TELEGRAM_DOCS_LIST_LIMIT,
    TELEGRAM_MAX_MESSAGE_CHARS,
    TELEGRAM_SCOPE_LABEL_ENABLED,
    TELEGRAM_SOURCE_LIMIT,
    TEXT_SCORE_WEIGHT,
    TOP_K,
    VECTOR_SCORE_WEIGHT,
)


load_dotenv()


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
    Holds all configurable runtime settings.

    Returns:
        Settings: Dataclass-style settings container.
    """

    app_name: str = os.getenv("APP_NAME", APP_NAME)
    app_version: str = os.getenv("APP_VERSION", APP_VERSION)

    db_path: str = os.getenv("APP_DB_PATH", "./data/app.db")

    opensearch_url: str = os.getenv("OPENSEARCH_URL", "http://localhost:9200")
    opensearch_index_name: str = os.getenv("OPENSEARCH_INDEX_NAME", OPENSEARCH_INDEX_NAME)
    opensearch_pipeline_name: str = os.getenv("OPENSEARCH_PIPELINE_NAME", OPENSEARCH_PIPELINE_NAME)

    embedding_model_path: str = os.getenv("EMBEDDING_MODEL", EMBEDDING_MODEL_PATH)
    chunk_size_chars: int = int(os.getenv("CHUNK_SIZE_CHARS", str(CHUNK_SIZE_CHARS)))
    chunk_overlap_chars: int = int(os.getenv("CHUNK_OVERLAP_CHARS", str(CHUNK_OVERLAP_CHARS)))

    top_k: int = int(os.getenv("RAG_TOP_K", str(TOP_K)))
    rag_candidate_multiplier: int = int(
        os.getenv("RAG_CANDIDATE_MULTIPLIER", str(RAG_CANDIDATE_MULTIPLIER))
    )
    rag_max_results_per_document: int = int(
        os.getenv("RAG_MAX_RESULTS_PER_DOCUMENT", str(RAG_MAX_RESULTS_PER_DOCUMENT))
    )
    source_snippet_max_chars: int = int(
        os.getenv("SOURCE_SNIPPET_MAX_CHARS", str(SOURCE_SNIPPET_MAX_CHARS))
    )
    doc_type_score_boost: float = float(
        os.getenv("DOC_TYPE_SCORE_BOOST", str(DOC_TYPE_SCORE_BOOST))
    )
    text_score_weight: float = float(os.getenv("TEXT_SCORE_WEIGHT", str(TEXT_SCORE_WEIGHT)))
    vector_score_weight: float = float(os.getenv("VECTOR_SCORE_WEIGHT", str(VECTOR_SCORE_WEIGHT)))
    ocr_languages: str = os.getenv("OCR_LANGUAGES", OCR_LANGUAGES)

    max_query_length: int = int(os.getenv("MAX_QUERY_LENGTH", str(MAX_QUERY_LENGTH)))
    default_history_limit: int = int(os.getenv("DEFAULT_HISTORY_LIMIT", str(DEFAULT_HISTORY_LIMIT)))

    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "llama3.2:1b")
    ollama_temperature: float = float(os.getenv("OLLAMA_TEMPERATURE", "0.2"))
    use_mock_llm: bool = _as_bool(os.getenv("USE_MOCK_LLM"), default=False)

    telegram_bot_token: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    telegram_webhook_secret: str = os.getenv("TELEGRAM_WEBHOOK_SECRET", "")
    telegram_webhook_url: str = os.getenv("TELEGRAM_WEBHOOK_URL", "")
    telegram_source_limit: int = int(
        os.getenv("TELEGRAM_SOURCE_LIMIT", str(TELEGRAM_SOURCE_LIMIT))
    )
    telegram_max_message_chars: int = int(
        os.getenv("TELEGRAM_MAX_MESSAGE_CHARS", str(TELEGRAM_MAX_MESSAGE_CHARS))
    )
    telegram_docs_list_limit: int = int(
        os.getenv("TELEGRAM_DOCS_LIST_LIMIT", str(TELEGRAM_DOCS_LIST_LIMIT))
    )
    telegram_scope_label_enabled: bool = _as_bool(
        os.getenv("TELEGRAM_SCOPE_LABEL_ENABLED"),
        default=TELEGRAM_SCOPE_LABEL_ENABLED,
    )


settings = Settings()
