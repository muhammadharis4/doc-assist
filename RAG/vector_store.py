from dataclasses import dataclass

import chromadb
from chromadb.api.models.Collection import Collection

from config import settings


@dataclass
class RetrievedChunk:
    """Represents one retrieved chunk from vector search."""

    document_id: str | None
    filename: str | None
    content: str
    score: float


class VectorStore:
    """Encapsulates Chroma operations for indexing and searching chunks."""

    def __init__(self) -> None:
        self._client = chromadb.PersistentClient(path=settings.chroma_path)
        self._collection: Collection = self._client.get_or_create_collection(
            name=settings.chroma_collection,
            metadata={"hnsw:space": "cosine"},
        )

    def upsert_document(
        self,
        document_id: str,
        filename: str,
        content: str,
        embeddings: list[list[float]],
        project: str | None,
        category: str | None,
    ) -> None:
        chunks = chunk_text(content)
        if not chunks:
            return

        chunk_ids = [f"{document_id}:{index}" for index in range(len(chunks))]
        metadatas = [
            {
                "document_id": document_id,
                "filename": filename,
                "project": project or "",
                "category": category or "",
            }
            for _ in chunks
        ]

        self.delete_document(document_id)

        self._collection.upsert(
            ids=chunk_ids,
            documents=chunks,
            metadatas=metadatas,
            embeddings=embeddings,
        )

    def delete_document(self, document_id: str) -> None:
        self._collection.delete(where={"document_id": document_id})

    def query(self, query_vector: list[float], top_k: int) -> list[RetrievedChunk]:
        raw = self._collection.query(
            query_embeddings=[query_vector],
            n_results=top_k,
            include=["documents", "metadatas", "distances"],
        )

        documents = raw.get("documents", [[]])[0]
        metadatas = raw.get("metadatas", [[]])[0]
        distances = raw.get("distances", [[]])[0]

        rows: list[RetrievedChunk] = []
        for index, content in enumerate(documents):
            metadata = metadatas[index] if index < len(metadatas) else {}
            distance = float(distances[index]) if index < len(distances) else 1.0
            similarity = max(0.0, min(1.0, 1.0 - distance))
            rows.append(
                RetrievedChunk(
                    document_id=(metadata or {}).get("document_id"),
                    filename=(metadata or {}).get("filename"),
                    content=content,
                    score=round(similarity, 4),
                )
            )

        return rows


def chunk_text(text: str) -> list[str]:
    """Splits text into overlapping chunks for semantic retrieval."""

    normalized = " ".join(text.split())
    if not normalized:
        return []

    step = max(1, settings.max_chunk_chars - settings.chunk_overlap_chars)
    chunks: list[str] = []

    for start in range(0, len(normalized), step):
        end = start + settings.max_chunk_chars
        chunk = normalized[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= len(normalized):
            break

    return chunks
