"""Keyword router: question -> types / latest N, and document type guessing."""

from __future__ import annotations

import pytest

from src.rag.router import guess_document_type, infer_document_types, latest_n


def test_infer_document_types_from_german_and_english() -> None:
    assert infer_document_types("Wie hoch ist mein Gehalt?") == ["salary_slip"]
    assert infer_document_types("Which Krankenkasse do I have?") == ["insurance"]
    assert infer_document_types("What is my latest payslip?") == ["salary_slip"]
    assert infer_document_types("Hello") == []


@pytest.mark.parametrize(
    ("query", "expected"),
    [
        ("my latest payslip", 1),
        ("show the newest 3 tax documents", 3),
        ("zeig die neuesten 2 Dokumente", 2),
        ("what was my last tax bill", None),
        ("Wie hoch ist die Miete?", None),
    ],
)
def test_latest_n(query: str, expected: int | None) -> None:
    assert latest_n(query) == expected


def test_guess_document_type_uses_filename_and_text() -> None:
    assert guess_document_type("Miete.pdf", "Kaltmiete 900 Euro, Vermieter und Mieter") == "rental_contract"
    assert guess_document_type("scan.pdf", "Abrechnung Brutto Netto Lohn") == "salary_slip"
    # A registration form mentions "Wohnung" a lot: it must not be read as a rental contract.
    assert guess_document_type("x.pdf", "Meldebestätigung für die Anmeldung. Neue Wohnung, Wohnung") == "registration"
    assert guess_document_type("x.pdf", "nothing recognisable here") == "other"
