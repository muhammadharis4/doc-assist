"""Request and response schemas for API endpoints."""

from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from src.constants import (
    DOCUMENT_TYPE_INSURANCE,
    DOCUMENT_TYPE_OTHER,
    DOCUMENT_TYPE_REGISTRATION,
    DOCUMENT_TYPE_RENTAL_CONTRACT,
    DOCUMENT_TYPE_SALARY_SLIP,
    DOCUMENT_TYPE_TAX,
    DOCUMENT_TYPE_WORK_CONTRACT,
    MAX_DOCUMENT_CONTENT_CHARS,
    MAX_QUERY_LENGTH,
    MAX_TAG_LENGTH,
    MAX_TAGS_PER_DOCUMENT,
)

DocumentType = Literal[
    DOCUMENT_TYPE_RENTAL_CONTRACT,
    DOCUMENT_TYPE_WORK_CONTRACT,
    DOCUMENT_TYPE_SALARY_SLIP,
    DOCUMENT_TYPE_INSURANCE,
    DOCUMENT_TYPE_TAX,
    DOCUMENT_TYPE_REGISTRATION,
    DOCUMENT_TYPE_OTHER,
]

_TAG_PATTERN = re.compile(r"^[\w\-. ]+$", re.UNICODE)


def normalize_document_tags(value: object) -> list[str]:
    """
    Normalizes tag input: trims, dedupes case-insensitively, enforces count and length.

    Args:
        value (object): Raw ``tags`` field (list, ``None``, or missing).

    Returns:
        list[str]: Clean tag list (may be empty).

    Raises:
        ValueError: When the payload is not a list or a tag violates constraints.
    """

    if value is None:
        return []
    if not isinstance(value, list):
        raise ValueError("tags must be a list of strings")

    result: list[str] = []
    seen: set[str] = set()
    for item in value:
        raw = str(item).strip()
        if not raw:
            continue
        if len(raw) > MAX_TAG_LENGTH:
            raise ValueError(f"each tag must be at most {MAX_TAG_LENGTH} characters")
        if not _TAG_PATTERN.match(raw):
            raise ValueError(
                "tags may only contain letters, numbers, spaces, hyphen, dot, and underscore",
            )
        key = raw.casefold()
        if key in seen:
            continue
        seen.add(key)
        result.append(raw)
        if len(result) > MAX_TAGS_PER_DOCUMENT:
            raise ValueError(f"at most {MAX_TAGS_PER_DOCUMENT} tags allowed")

    return result


class DocumentCreateRequest(BaseModel):
    """
    Payload used to create and index a document.

    Returns:
        DocumentCreateRequest: Validated document create payload.
    """

    filename: str = Field(min_length=1, max_length=1024)
    content: str = Field(min_length=1, max_length=MAX_DOCUMENT_CONTENT_CHARS)
    mimeType: str | None = Field(default=None, max_length=256)
    documentType: DocumentType = DOCUMENT_TYPE_OTHER
    tags: list[str] = Field(default_factory=list, max_length=MAX_TAGS_PER_DOCUMENT)

    @field_validator("tags", mode="before")
    @classmethod
    def _validate_tags(cls, value: object) -> list[str]:
        return normalize_document_tags(value)


class DocumentResponse(BaseModel):
    """
    Document response used by the frontend document list.

    Returns:
        DocumentResponse: Document response payload.
    """

    id: str
    filename: str
    content: str
    mimeType: str | None = None
    documentType: DocumentType = DOCUMENT_TYPE_OTHER
    createdAt: str
    status: str
    errorMessage: str | None = None
    indexedAt: str | None = None
    tags: list[str] = Field(default_factory=list)


class DocumentPatchRequest(BaseModel):
    """
    Partial update for a document (tags only for now).

    Returns:
        DocumentPatchRequest: Validated patch payload.
    """

    tags: list[str] = Field(default_factory=list, max_length=MAX_TAGS_PER_DOCUMENT)

    @field_validator("tags", mode="before")
    @classmethod
    def _validate_tags(cls, value: object) -> list[str]:
        return normalize_document_tags(value)


class QuerySourceResponse(BaseModel):
    """
    Single source snippet returned with a generated answer.

    Returns:
        QuerySourceResponse: Query source payload.
    """

    documentId: str | None = None
    filename: str | None = None
    documentType: DocumentType = DOCUMENT_TYPE_OTHER
    snippet: str
    score: float | None = None


class QueryExecuteRequest(BaseModel):
    """
    Payload for running a retrieval-augmented query.

    Returns:
        QueryExecuteRequest: Validated query payload.
    """

    model_config = ConfigDict(populate_by_name=True)

    query: str = Field(min_length=1, max_length=MAX_QUERY_LENGTH)
    rag_enabled: bool = Field(default=True, alias="ragEnabled")
    top_k: int | None = Field(default=None, ge=1, le=20, alias="topK")
    temperature: float | None = Field(default=None, ge=0.0, le=1.0, alias="temperature")


class QueryResponse(BaseModel):
    """
    Stored and returned query response shape for frontend history.

    Returns:
        QueryResponse: Query response payload.
    """

    id: str
    query: str
    answer: str
    userId: str | None = None
    createdAt: str
    sources: list[QuerySourceResponse]


class DeleteStatusResponse(BaseModel):
    """
    Simple status result for delete operations.

    Returns:
        DeleteStatusResponse: Delete status payload.
    """

    status: str
