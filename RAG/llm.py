import ollama
import re
from typing import Dict, Iterable, List, Optional

from config import settings


class LlmService:
    """Interfaces with Ollama for answer generation."""

    def __init__(self) -> None:
        self.base_url = settings.ollama_base_url
        self.model = settings.ollama_model
        self.temperature = settings.ollama_temperature
        self.use_mock = settings.use_mock_llm
        self._client = ollama.AsyncClient(host=self.base_url)

    async def answer(self, query: str, chunks: list) -> str:
        """Generates an answer using Ollama or mock."""

        if not chunks:
            return "No relevant documents found."

        if self.use_mock:
            return self._mock_answer(query, chunks)

        return await self._ollama_answer(query, chunks)

    def _tokenize_query(self, query: str) -> list[str]:
        """Converts a query into normalized search terms."""

        return [
            token
            for token in query.lower().replace("?", " ").split()
            if len(token.strip()) >= 3
        ]

    def _split_into_sentences(self, text: str) -> list[str]:
        """Splits text into readable sentence candidates."""

        if not text.strip():
            return []

        # Remove fenced code blocks; they often contain noisy examples.
        without_code = re.sub(r"```[\s\S]*?```", " ", text)
        # Remove inline code fragments.
        without_inline_code = re.sub(r"`[^`]+`", " ", without_code)
        # Remove common code-style fragments that break readability.
        without_decorators = re.sub(r"@app\.[a-z_]+\([^)]*\)", " ", without_inline_code)
        without_defs = re.sub(r"\bdef\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*:", " ", without_decorators)
        without_json_blocks = re.sub(r"\{[^{}]{0,220}\}", " ", without_defs)
        without_assignments = re.sub(r"\b[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[^\n]{0,120}", " ", without_json_blocks)
        # Strip markdown syntax that degrades readability.
        flattened = re.sub(r"[#>*_\-]{1,6}", " ", without_assignments)
        flattened = re.sub(r"\b(?:status_code|oauth2|tokenurl|response_model)\b", " ", flattened, flags=re.IGNORECASE)
        normalized = re.sub(r"\s+", " ", flattened).strip()
        if not normalized:
            return []

        raw_parts = re.split(r"(?<=[.!?])\s+", normalized)
        sentences: list[str] = []
        for part in raw_parts:
            cleaned = part.strip()
            if not cleaned or len(cleaned) < 28:
                continue

            # Remove broken leading fragments and punctuation noise.
            cleaned = re.sub(r"^[^A-Za-z]+", "", cleaned)
            cleaned = re.sub(r"\s+", " ", cleaned).strip()
            if not cleaned:
                continue

            if cleaned[-1] not in {".", "!", "?"}:
                cleaned = f"{cleaned}."

            if self._is_noisy_sentence(cleaned):
                continue

            # Keep sentence length bounded for readable summaries.
            if len(cleaned) > 220:
                continue

            sentences.append(cleaned)

        return sentences

    def _is_noisy_sentence(self, sentence: str) -> bool:
        """Detects sentence candidates that look like retrieval or code noise."""

        lowered = sentence.lower()

        if "skip" in lowered and "limit" in lowered and "query" in lowered:
            return True

        if "http://" in lowered or "https://" in lowered:
            return True

        if re.search(r"\b(score|documentid|uuid|json|payload)\b", lowered):
            return True

        if re.search(r"\b(?:raise|return|except|async|await|pip install)\b", lowered):
            return True

        if re.search(r"[{}\[\]:]{2,}", sentence):
            return True

        # Reject low-signal fragments with too few words.
        words = sentence.split()
        if len(words) < 6:
            return True

        if re.fullmatch(r"[0-9a-f]{8}-[0-9a-f-]{27}", lowered):
            return True

        return False

    def _extract_key_points(self, query: str, chunks: list) -> list[str]:
        """Ranks candidate sentences by overlap with query terms."""

        terms = self._tokenize_query(query)
        candidates: list[tuple[int, str]] = []

        for chunk in chunks[:3]:
            content = str(getattr(chunk, "content", "")).strip()
            for sentence in self._split_into_sentences(content):
                score = sum(1 for term in terms if term in sentence.lower())
                # Require stronger term overlap to avoid weak matches.
                min_score = 1 if len(terms) <= 2 else 2
                if score >= min_score:
                    candidates.append((score, sentence))

        ranked = [sentence for _, sentence in sorted(candidates, key=lambda item: item[0], reverse=True)]

        unique: list[str] = []
        for sentence in ranked:
            if sentence not in unique:
                unique.append(sentence)

        return unique[:4]

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
        """Appends a canonical sources line."""

        labels = self._source_labels(chunks)
        if not labels:
            return answer

        without_sources = re.sub(
            r"(?im)^\s*Sources\s*:\s*.*$",
            "",
            answer,
        ).strip()
        return f"{without_sources}\n\nSources: {', '.join(labels)}"

    def _first_paragraph(self, text: str) -> str:
        """Returns the first non-empty paragraph from text."""

        for paragraph in [part.strip() for part in text.split("\n\n")]:
            if paragraph:
                return paragraph
        return ""

    def _extract_steps(self, text: str) -> list[str]:
        """Extracts numbered implementation steps from freeform model output."""

        steps = re.findall(r"(?m)^\s*(?:\d+\.|[-*])\s+(.+?)\s*$", text)
        cleaned = [step.strip() for step in steps if step.strip()]
        return cleaned[:3]

    def _default_steps(self, query: str, chunks: list) -> list[str]:
        """Builds fallback steps when the model omits them."""

        source_labels = self._source_labels(chunks)
        first_source = source_labels[0] if source_labels else "the uploaded documentation"
        return [
            f"Open {first_source} and locate the section most relevant to: {query}.",
            "Apply the documented configuration or code pattern in your service module.",
            "Validate the flow by calling the endpoint and confirming the expected response.",
        ]

    def _sanitize_generated_text(self, text: str) -> str:
        """Removes retrieval-noise fragments from model output."""

        normalized = text.replace("\r\n", "\n").replace("\r", "\n")
        lines: list[str] = []
        for raw_line in normalized.split("\n"):
            line = raw_line.strip()
            lowered = line.lower()
            if not line:
                lines.append("")
                continue

            if "best matches" in lowered:
                continue

            if lowered.startswith("score "):
                continue

            if re.search(r"\bscore\s*[:=]\s*\d", lowered):
                continue

            if re.fullmatch(r"[0-9a-f]{8}-[0-9a-f-]{27}", lowered):
                continue

            lines.append(raw_line)

        return "\n".join(lines).strip()

    def _normalize_answer(self, query: str, raw_answer: str, chunks: list) -> str:
        """Forces model output into a consistent, user-friendly structure."""

        cleaned = self._sanitize_generated_text(raw_answer)
        if not cleaned:
            return self._mock_answer(query, chunks)

        direct_answer = ""
        answer_match = re.search(
            r"(?is)Direct\s+answer\s*:\s*(.+?)(?:\n\s*Implementation\s+steps\s*:|$)",
            cleaned,
        )
        if answer_match:
            direct_answer = answer_match.group(1).strip()

        if not direct_answer:
            direct_answer = self._first_paragraph(cleaned)

        if not direct_answer:
            return self._mock_answer(query, chunks)

        steps = self._extract_steps(cleaned)
        if len(steps) < 3:
            steps = self._default_steps(query, chunks)

        formatted = (
            f"Direct answer:\n{direct_answer}\n\n"
            "Implementation steps:\n"
            f"1. {steps[0]}\n"
            f"2. {steps[1]}\n"
            f"3. {steps[2]}"
        )
        return self._with_sources_suffix(formatted, chunks)

    def _mock_answer(self, query: str, chunks: list) -> str:
        """Mock LLM: generates a structured answer from relevant sentences."""

        key_points = self._extract_key_points(query, chunks)
        summary = (
            key_points[0]
            if key_points
            else f"I could not find enough context to answer '{query}' confidently."
        )

        detail_lines = "\n".join([f"- {point}" for point in key_points[1:4]])
        details_block = f"\n\nKey points:\n{detail_lines}" if detail_lines else ""

        response = f"Direct answer:\n{summary}{details_block}"
        return self._normalize_answer(query, response, chunks)

    async def _ollama_answer(self, query: str, chunks: list) -> str:
        """Real answer generation using Ollama chat API."""

        context = "\n\n".join([chunk.content for chunk in chunks])
        prompt = self._build_prompt(query, context)

        try:
            if not await self._ensure_model_available():
                return self._mock_answer(query, chunks)

            stream = await self._run_llama_streaming(
                prompt=prompt,
                temperature=self.temperature,
            )

            if stream is None:
                return self._mock_answer(query, chunks)

            answer = await self._collect_stream_text(stream)
            if not answer:
                return self._mock_answer(query, chunks)

            return self._normalize_answer(query, answer, chunks)
        except ollama.ResponseError:
            return self._mock_answer(query, chunks)

    async def _ensure_model_available(self) -> bool:
        """Ensures Ollama model exists locally, pulling when missing."""

        try:
            tags = await self._client.list()
            available = self._extract_model_names(tags)

            if self.model in available:
                return True

            await self._client.pull(self.model)
            return True
        except ollama.ResponseError:
            return False

    def _extract_model_names(self, tags: object) -> set[str]:
        """Parses model names from Ollama list response objects."""

        names: set[str] = set()

        models = []
        if hasattr(tags, "models"):
            models = list(getattr(tags, "models") or [])
        elif isinstance(tags, dict):
            models = list(tags.get("models", []))

        for model in models:
            name = ""
            if isinstance(model, dict):
                name = str(model.get("model") or model.get("name") or "").strip()
            elif hasattr(model, "model"):
                name = str(getattr(model, "model") or "").strip()
            elif hasattr(model, "name"):
                name = str(getattr(model, "name") or "").strip()

            if name:
                names.add(name)

        return names

    async def _run_llama_streaming(
        self,
        prompt: str,
        temperature: float,
    ) -> Optional[object]:
        """Runs Ollama chat with streaming enabled and returns the stream iterator."""

        try:
            stream = await self._client.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                stream=True,
                options={"temperature": temperature},
            )
            return stream
        except ollama.ResponseError:
            return None

    async def _collect_stream_text(self, stream: object) -> str:
        """Aggregates streamed Ollama chunks into one answer string."""

        parts: List[str] = []
        async for chunk in stream:
            message = chunk.get("message") if isinstance(chunk, dict) else None
            if isinstance(message, dict):
                content = str(message.get("content") or "")
                if content:
                    parts.append(content)

        return "".join(parts).strip()

    def _prompt_template(
        self,
        query: str,
        context: str,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        """Builds prompt text with context and optional conversation history."""

        prompt = "You are a documentation assistant. "
        if context.strip():
            prompt += (
                "Use the following context to answer the question.\n"
                "Context:\n"
                f"{context}\n"
            )
        else:
            prompt += "Answer questions to the best of your knowledge.\n"

        if history:
            prompt += "Conversation History:\n"
            for msg in history[-10:]:
                role = "User" if msg.get("role") == "user" else "Assistant"
                prompt += f"{role}: {msg.get('content', '')}\n"
            prompt += "\n"

        prompt += (
            "Use exactly this structure:\n"
            "Direct answer:\n"
            "<2-4 sentences>\n\n"
            "Implementation steps:\n"
            "1. <step>\n"
            "2. <step>\n"
            "3. <step>\n\n"
            "Finish with one line in this exact format:\n"
            "Sources: <comma-separated filenames>\n\n"
            f"Question: {query}\n"
            "Assistant:"
        )
        return prompt

    def _build_prompt(self, query: str, context: str) -> str:
        """Builds a prompt for the LLM with context and query."""

        return self._prompt_template(query=query, context=context, history=None)