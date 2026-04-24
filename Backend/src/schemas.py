"""Request and response schemas for API endpoints."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator

from src.constants import (
    DOCUMENT_TYPE_INSURANCE,
    DOCUMENT_TYPE_OTHER,
    DOCUMENT_TYPE_REGISTRATION,
    DOCUMENT_TYPE_RENTAL_CONTRACT,
    DOCUMENT_TYPE_SALARY_SLIP,
    DOCUMENT_TYPE_TAX,
    DOCUMENT_TYPE_WORK_CONTRACT,
    MAX_QUERY_LENGTH,
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


class DocumentCreateRequest(BaseModel):
    """
    Payload used to create and index a document.

    Returns:
        DocumentCreateRequest: Validated document create payload.
    """

    filename: str = Field(min_length=1, max_length=1024)
    content: str = Field(min_length=1)
    mimeType: str | None = Field(default=None, max_length=256)
    documentType: DocumentType = DOCUMENT_TYPE_OTHER

    @model_validator(mode="before")
    @classmethod
    def normalize_payload(cls, value: object) -> object:
        """
        Accepts legacy frontend payload fields for a smooth migration.

        Args:
            value (object): Raw incoming payload.

        Returns:
            object: Normalized payload.
        """

        if not isinstance(value, dict):
            return value

        normalized = dict(value)
        if "content" not in normalized and "extractedText" in normalized:
            normalized["content"] = normalized.get("extractedText")

        return normalized


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

    query: str = Field(min_length=1, max_length=MAX_QUERY_LENGTH)


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
