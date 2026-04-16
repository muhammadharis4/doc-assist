import httpx

from config import settings


class LlmService:
    """Interfaces with Ollama for answer generation."""

    def __init__(self) -> None:
        self.base_url = settings.ollama_base_url
        self.model = settings.ollama_model
        self.use_mock = settings.use_mock_llm

    async def answer(self, query: str, chunks: list) -> str:
        """Generates an answer using Ollama or mock."""

        if not chunks:
            return "No relevant documents found."

        if self.use_mock:
            return self._mock_answer(query, chunks)

        return await self._ollama_answer(query, chunks)

    def _source_labels(self, chunks: list) -> list[str]:
        """Returns unique non-empty source filenames."""

        labels: list[str] = []
        for chunk in chunks:
            filename = getattr(chunk, "filename", None)
            if isinstance(filename, str):
                normalized = filename.strip()
                if normalized and normalized not in labels:
                    labels.append(normalized)

        return labels

    def _with_sources_suffix(self, answer: str, chunks: list) -> str:
        """Appends a sources line unless it already exists."""

        labels = self._source_labels(chunks)
        if not labels or "Sources:" in answer:
            return answer

        return f"{answer.rstrip()}\n\nSources: {', '.join(labels)}"

    def _mock_answer(self, query: str, chunks: list) -> str:
        """Mock LLM: returns a concise direct answer from top chunks."""

        context = " ".join(
            [str(getattr(chunk, "content", "")).strip() for chunk in chunks[:2]],
        )
        direct_answer = context[:240].strip()

        if not direct_answer:
            direct_answer = f"No direct answer was found for '{query}'."
        elif direct_answer[-1] not in {".", "!", "?"}:
            direct_answer = f"{direct_answer}."

        return self._with_sources_suffix(direct_answer, chunks)

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
                answer = data.get("response", "").strip()
                return self._with_sources_suffix(answer, chunks)
        except httpx.RequestError:
            return self._mock_answer(query, chunks)

    def _build_prompt(self, query: str, context: str) -> str:
        """Builds a prompt for the LLM with context and query."""

        return f"""Based on the following documents, provide a direct answer to the question.
    Do not use wording like "best matches".
    Finish with one line in this format:
    Sources: <comma-separated filenames>

Documents:
{context}

Question: {query}

Answer:"""