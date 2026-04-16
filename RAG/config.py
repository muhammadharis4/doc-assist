import os
from dataclasses import dataclass


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
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "mistral")
    max_chunk_chars: int = int(os.getenv("MAX_CHUNK_CHARS", "900"))
    chunk_overlap_chars: int = int(os.getenv("CHUNK_OVERLAP_CHARS", "120"))
    top_k: int = int(os.getenv("RAG_TOP_K", "4"))


settings = Settings()
