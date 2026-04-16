from embeddings import EmbeddingService
from llm import LlmService
from schemas import RagQueryResponse, RagSource
from vector_store import VectorStore, chunk_text
from config import settings


class RagEngine:
    """Coordinates indexing, retrieval, and answer generation."""

    def __init__(self) -> None:
        self._embeddings = EmbeddingService()
        self._store = VectorStore()
        self._llm = LlmService()

    def index_document(
        self,
        document_id: str,
        filename: str,
        content: str,
        project: str | None,
        category: str | None,
    ) -> None:
        chunks = chunk_text(content)
        vectors = self._embeddings.encode_texts(chunks)
        self._store.upsert_document(
            document_id=document_id,
            filename=filename,
            content=content,
            embeddings=vectors,
            project=project,
            category=category,
        )

    def delete_document(self, document_id: str) -> None:
        self._store.delete_document(document_id)

    async def query(self, query_text: str) -> RagQueryResponse:
        query_vector = self._embeddings.encode_query(query_text)
        chunks = self._store.query(query_vector=query_vector, top_k=settings.top_k)
        answer = await self._llm.answer(query_text, chunks)
        sources = [
            RagSource(
                documentId=chunk.document_id,
                filename=chunk.filename,
                snippet=chunk.content[:320],
                score=chunk.score,
            )
            for chunk in chunks
        ]
        return RagQueryResponse(answer=answer, sources=sources)
