"""Docling extraction on local sample files (git-ignored; skipped when absent, slow on CPU)."""

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


def test_digital_payslip_keeps_its_body() -> None:
    # "Stundenlohn Std" only occurs in the value row; the default backend dropped that row.
    assert "Stundenlohn Std" in _extract("Brutto-Netto-Abrechnung 2023 02 Februar.pdf")


def test_photo_named_pdf_is_ocrd_in_german() -> None:
    # The file is really a JPEG: type must come from content, umlauts must survive OCR.
    assert "Meldebestätigung" in _extract("City Registration.pdf")
