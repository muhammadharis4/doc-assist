import httpx

from config import settings


class LlmService:
    """Interfaces with Ollama for answer generation."""

    def __init__(self) -> None:
        self.base_url = settings.ollama_base_url
        self.model = settings.ollama_model
        self.use_mock = True  # Set to False when Ollama is ready

    async def answer(self, query: str, chunks: list) -> str:
        """Generates an answer using Ollama or mock."""

        if not chunks:
            return "No relevant documents found."

        if self.use_mock:
            return self._mock_answer(query, chunks)

        # Real Ollama implementation (uncomment when ready)
        return await self._ollama_answer(query, chunks)

    def _mock_answer(self, query: str, chunks: list) -> str:
        """Mock LLM: combines chunk content into a coherent answer."""

        # Take first 2 chunks and combine them
        context = " ".join([chunk.content[:200] for chunk in chunks[:2]])
        return f"Based on the documents: {context}. This is relevant to your question about '{query}'."

    async def _ollama_answer(self, query: str, chunks: list) -> str:
        """Real answer generation using Ollama."""

        context = "\n\n".join([chunk.content for chunk in chunks])
        prompt = self._build_prompt(query, context)

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                    },
                )
                response.raise_for_status()
                data = response.json()
                return data.get("response", "").strip()
        except httpx.RequestError as error:
            raise RuntimeError(f"Ollama service error: {error}") from error

    def _build_prompt(self, query: str, context: str) -> str:
        """Builds a prompt for the LLM with context and query."""

        return f"""Based on the following documents, answer the question clearly and concisely.

Documents:
{context}

Question: {query}

Answer:"""