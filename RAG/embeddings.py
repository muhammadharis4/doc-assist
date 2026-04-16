from sentence_transformers import SentenceTransformer

from config import settings


class EmbeddingService:
    """Loads the embedding model once and serves vector encodings."""

    def __init__(self) -> None:
        self._model = SentenceTransformer(settings.embedding_model)

    def encode_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        vectors = self._model.encode(texts, normalize_embeddings=True)
        return [vector.tolist() for vector in vectors]

    def encode_query(self, query: str) -> list[float]:
        vector = self._model.encode([query], normalize_embeddings=True)
        return vector[0].tolist()
