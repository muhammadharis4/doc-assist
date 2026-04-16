from sentence_transformers import SentenceTransformer

from config import settings


class EmbeddingService:
    """Loads the embedding model once and serves vector encodings."""

    def __init__(self) -> None:
        self._model = SentenceTransformer(settings.embedding_model)

    def _prefix(self, text: str, is_query: bool) -> str:
        if not settings.asymmetric_embedding:
            return text

        lead = "query: " if is_query else "passage: "
        return f"{lead}{text}"

    def encode_chunks(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        prepared = [self._prefix(text, is_query=False) for text in texts]
        vectors = self._model.encode(prepared, normalize_embeddings=True)
        return [vector.tolist() for vector in vectors]

    def encode_query(self, query: str) -> list[float]:
        prepared = self._prefix(query, is_query=True)
        vector = self._model.encode([prepared], normalize_embeddings=True)
        return vector[0].tolist()
