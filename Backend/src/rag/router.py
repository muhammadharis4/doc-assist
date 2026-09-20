"""Keyword routing: which document types a text is about, and "latest N" hints."""

from __future__ import annotations

import re

from src.constants import (
    DOCUMENT_TYPE_INSURANCE,
    DOCUMENT_TYPE_OTHER,
    DOCUMENT_TYPE_REGISTRATION,
    DOCUMENT_TYPE_RENTAL_CONTRACT,
    DOCUMENT_TYPE_SALARY_SLIP,
    DOCUMENT_TYPE_TAX,
    DOCUMENT_TYPE_WORK_CONTRACT,
)

# Lowercase substrings (German and English) that point to a document type.
_TYPE_KEYWORDS: dict[str, tuple[str, ...]] = {
    DOCUMENT_TYPE_RENTAL_CONTRACT: ("miet", "rental", "kaltmiete", "warmmiete", "landlord", "tenant"),
    DOCUMENT_TYPE_WORK_CONTRACT: ("arbeits", "employment", "arbeitgeber", "arbeitnehmer", "vertrag"),
    DOCUMENT_TYPE_SALARY_SLIP: ("gehalt", "salary", "payslip", "lohn", "abrechnung", "brutto", "netto"),
    DOCUMENT_TYPE_INSURANCE: ("versicherung", "insurance", "renten", "krankenkasse"),
    DOCUMENT_TYPE_TAX: ("steuer", "tax", "finanzamt"),
    DOCUMENT_TYPE_REGISTRATION: ("anmeldung", "meldebestätigung", "meldebehörde", "wohnsitz", "registration"),
}

_LATEST = re.compile(r"\b(?:latest|newest|most recent|neueste\w*|aktuellste\w*)\b(?:\s+(\d{1,2})\b)?")
_CLASSIFY_CHARS = 5000


def infer_document_types(text: str) -> list[str]:
    """
    Returns the document types whose keywords appear in a question.

    Args:
        text (str): The user question.

    Returns:
        list[str]: Matching document types (possibly empty).
    """

    lowered = text.lower()
    return [
        doc_type
        for doc_type, keywords in _TYPE_KEYWORDS.items()
        if any(keyword in lowered for keyword in keywords)
    ]


def latest_n(query: str) -> int | None:
    """
    Reads "latest" hints such as "my latest payslip" (1) or "newest 3 documents" (3).

    Args:
        query (str): The user question.

    Returns:
        int | None: How many recent documents to consider, or ``None`` without a hint.
    """

    match = _LATEST.search(query.lower())
    if match is None:
        return None
    return max(1, int(match.group(1) or 1))


def guess_document_type(filename: str, text: str) -> str:
    """
    Picks the document type with the most keyword hits in the filename and opening text.

    Args:
        filename (str): Original filename.
        text (str): Extracted document text.

    Returns:
        str: A document type, or ``other`` when nothing matches.
    """

    haystack = f"{filename}\n{text[:_CLASSIFY_CHARS]}".lower()
    scores = {
        doc_type: sum(haystack.count(keyword) for keyword in keywords)
        for doc_type, keywords in _TYPE_KEYWORDS.items()
    }
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else DOCUMENT_TYPE_OTHER
