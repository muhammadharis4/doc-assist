import os
from dataclasses import dataclass


def _env_to_bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default

    return raw.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    """Runtime settings loaded from environment variables."""

    app_name: str = "DocAssist RAG Service"
    app_version: str = "0.1.0"
    chroma_path: str = os.getenv("CHROMA_PATH", "./chroma")
    chroma_collection: str = os.getenv("CHROMA_COLLECTION", "documents")
    embedding_model: str = os.getenv(
        "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
    )
    asymmetric_embedding: bool = _env_to_bool("ASYMMETRIC_EMBEDDING", default=False)
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "llama3")
    ollama_temperature: float = float(os.getenv("OLLAMA_TEMPERATURE", "0.2"))
    use_mock_llm: bool = _env_to_bool("USE_MOCK_LLM", default=False)
    chunk_size_words: int = int(os.getenv("CHUNK_SIZE_WORDS", "180"))
    chunk_overlap_words: int = int(os.getenv("CHUNK_OVERLAP_WORDS", "40"))
    top_k: int = int(os.getenv("RAG_TOP_K", "4"))


settings = Settings()
