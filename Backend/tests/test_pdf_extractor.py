"""Extraction on local sample files (git-ignored; skipped when absent)."""

from __future__ import annotations

from pathlib import Path

import pytest

from src.documents.pdf_extractor import extract_text_from_pdf_bytes

SAMPLES = Path(__file__).resolve().parents[1] / "Sample data"


def _extract(name: str) -> str:
    path = SAMPLES / name
    if not path.exists():
        pytest.skip(f"missing sample: {name}")
    return extract_text_from_pdf_bytes(path.read_bytes(), name)


@pytest.mark.parametrize("month", ["02 Februar", "03 März", "04 April", "05 Mai"])
def test_digital_payslips_keep_their_body(month: str) -> None:
    # "Stundenlohn Std" only occurs in the value row. Docling dropped it on some months
    # (each backend on different ones), so all four must come through the text layer.
    assert "Stundenlohn Std" in _extract(f"Brutto-Netto-Abrechnung 2023 {month}.pdf")


def test_photo_named_pdf_is_ocrd_in_german() -> None:
    # Really a JPEG: no text layer, so Docling OCR runs; umlauts must survive.
    assert "Meldebestätigung" in _extract("City Registration.pdf")
