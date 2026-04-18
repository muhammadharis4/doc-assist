"""Environment-driven runtime settings."""

from __future__ import annotations

import os
from dataclasses import dataclass

from src.constants import (
    APP_NAME,
    APP_VERSION,
    CHUNK_OVERLAP_CHARS,
    CHUNK_SIZE_CHARS,
    DEFAULT_HISTORY_LIMIT,
    EMBEDDING_MODEL_PATH,
    MAX_QUERY_LENGTH,
    OPENSEARCH_INDEX_NAME,
    OPENSEARCH_PIPELINE_NAME,
    TEXT_SCORE_WEIGHT,
    TOP_K,
    VECTOR_SCORE_WEIGHT,
)


def _as_bool(raw: str | None, default: bool = False) -> bool:
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    """Holds all configurable runtime settings."""

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
    text_score_weight: float = float(os.getenv("TEXT_SCORE_WEIGHT", str(TEXT_SCORE_WEIGHT)))
    vector_score_weight: float = float(os.getenv("VECTOR_SCORE_WEIGHT", str(VECTOR_SCORE_WEIGHT)))

    max_query_length: int = int(os.getenv("MAX_QUERY_LENGTH", str(MAX_QUERY_LENGTH)))
    default_history_limit: int = int(os.getenv("DEFAULT_HISTORY_LIMIT", str(DEFAULT_HISTORY_LIMIT)))

    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "llama3")
    ollama_temperature: float = float(os.getenv("OLLAMA_TEMPERATURE", "0.2"))
    use_mock_llm: bool = _as_bool(os.getenv("USE_MOCK_LLM"), default=False)


settings = Settings()
