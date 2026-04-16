from pydantic import BaseModel, Field, model_validator


class RagQueryRequest(BaseModel):
    """Request payload for semantic query execution."""

    query: str = Field(min_length=1, max_length=2000)


class RagSource(BaseModel):
    """A source chunk contributing to an answer."""

    documentId: str | None = None
    filename: str | None = None
    snippet: str | None = None
    score: float | None = None


class RagQueryResponse(BaseModel):
    """Response payload returned to Backend for query execution."""

    answer: str
    sources: list[RagSource]


class DocumentIndexRequest(BaseModel):
    """Document payload provided by Backend for indexing."""

    id: str = Field(min_length=1, max_length=200)
    filename: str = Field(min_length=1, max_length=1024)
    content: str = Field(min_length=1)
    project: str | None = Field(default=None, max_length=120)
    category: str | None = Field(default=None, max_length=120)

    @model_validator(mode="before")
    @classmethod
    def normalize_backend_shape(cls, value: object) -> object:
        if not isinstance(value, dict):
            return value

        normalized = dict(value)

        if "id" not in normalized and "documentId" in normalized:
            normalized["id"] = normalized.get("documentId")

        if "content" not in normalized and "text" in normalized:
            normalized["content"] = normalized.get("text")

        return normalized


class DocumentIndexResponse(BaseModel):
    """Document indexing result."""

    status: str


class DeleteDocumentResponse(BaseModel):
    """Document delete result."""

    status: str
