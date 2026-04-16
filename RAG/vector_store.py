from dataclasses import dataclass
import re

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

    def query(self, query_text: str, query_vector: list[float], top_k: int) -> list[RetrievedChunk]:
        raw = self._collection.query(
            query_embeddings=[query_vector],
            n_results=max(top_k * 2, top_k),
            include=["documents", "metadatas", "distances"],
        )

        documents = raw.get("documents", [[]])[0]
        metadatas = raw.get("metadatas", [[]])[0]
        distances = raw.get("distances", [[]])[0]

        rows: list[RetrievedChunk] = []
        terms = _query_terms(query_text)
        for index, content in enumerate(documents):
            metadata = metadatas[index] if index < len(metadatas) else {}
            distance = float(distances[index]) if index < len(distances) else 1.0
            similarity = max(0.0, min(1.0, 1.0 - distance))
            lexical = _lexical_overlap(terms, content)
            final_score = (0.7 * similarity) + (0.3 * lexical)
            rows.append(
                RetrievedChunk(
                    document_id=(metadata or {}).get("document_id"),
                    filename=(metadata or {}).get("filename"),
                    content=content,
                    score=round(final_score, 4),
                )
            )

        rows.sort(key=lambda row: row.score, reverse=True)
        return rows[:top_k]


def chunk_text(text: str) -> list[str]:
    """Splits cleaned text into overlapping word chunks."""

    normalized = _clean_text(text)
    if not normalized:
        return []

    words = normalized.split(" ")
    size = max(1, settings.chunk_size_words)
    overlap = max(0, min(settings.chunk_overlap_words, size - 1))
    step = max(1, size - overlap)
    chunks: list[str] = []

    for start in range(0, len(words), step):
        end = start + size
        chunk = " ".join(words[start:end]).strip()
        if chunk:
            chunks.append(chunk)

        if end >= len(words):
            break

    return chunks


def _clean_text(text: str) -> str:
    text = re.sub(r"(\w+)-\n(\w+)", r"\1\2", text)
    text = re.sub(r"(?<!\n)\n(?!\n)", " ", text)
    text = re.sub(r"\n+", "\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def _query_terms(query_text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[A-Za-z0-9_]+", query_text.lower())
        if len(token) >= 3
    }


def _lexical_overlap(terms: set[str], content: str) -> float:
    if not terms:
        return 0.0

    haystack = content.lower()
    matches = sum(1 for term in terms if term in haystack)
    return matches / len(terms)
