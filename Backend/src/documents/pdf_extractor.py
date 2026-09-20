"""Document text extraction: the PDF text layer when present, Docling for scans and photos."""

from __future__ import annotations

import io
import logging
import re
import shutil
import subprocess
import threading
from functools import lru_cache

import pypdfium2 as pdfium
from docling.backend.pypdfium2_backend import PyPdfiumDocumentBackend
from docling.datamodel.base_models import DocumentStream, InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption

from src.rag.chunking import clean_text

logger = logging.getLogger(__name__)

# A page with less text than this is treated as a scan.
MIN_TEXT_LAYER_CHARS_PER_PAGE = 50

# ponytail: one conversion at a time keeps CPU/RAM bounded; a job queue if uploads pile up.
_convert_lock = threading.Lock()


def _pdf_text_layer(file_bytes: bytes) -> str:
    """
    Reads the embedded text of a digital PDF.

    Docling's PDF backends each dropped the body of some digital forms (payslips) and not
    others, while the text layer was complete every time. Rows keep their values on one line.

    Args:
        file_bytes (bytes): Raw file bytes.

    Returns:
        str: The text, or an empty string when the file is not a PDF or any page has no
            usable text layer (a scan), so the caller falls back to OCR.
    """

    try:
        pdf = pdfium.PdfDocument(file_bytes)
    except pdfium.PdfiumError:  # not a PDF, e.g. a photo saved with a .pdf name
        return ""

    try:
        pages = [page.get_textpage().get_text_range() for page in pdf]
    finally:
        pdf.close()

    if not pages or any(len(page.strip()) < MIN_TEXT_LAYER_CHARS_PER_PAGE for page in pages):
        return ""
    return _layout_text(file_bytes) or "\n\n".join(pages)


def _layout_text(file_bytes: bytes) -> str:
    """
    Reads a digital PDF in reading layout, so table labels stay next to their values.

    pdfium returns a form's labels and values as two separate blocks; poppler's layout mode
    keeps each value under its label ("Netto-Verdienst" above "1.257,26"), which a
    language model can map correctly.

    Args:
        file_bytes (bytes): Raw PDF bytes.

    Returns:
        str: The text, or an empty string when poppler is not installed or fails.
    """

    if not shutil.which("pdftotext"):
        return ""
    result = subprocess.run(
        ["pdftotext", "-layout", "-", "-"], input=file_bytes, capture_output=True, timeout=60
    )
    if result.returncode != 0:
        return ""
    text = result.stdout.decode("utf-8", errors="replace").replace("\f", "\n\n")
    return re.sub(r"[ \t]{2,}", "  ", text)


@lru_cache(maxsize=1)
def _converter() -> DocumentConverter:
    """
    Builds and caches the Docling converter (OCR and table structure on).

    Returns:
        DocumentConverter: The cached converter.
    """

    options = PdfPipelineOptions()
    options.do_ocr = True
    options.do_table_structure = True
    return DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=options, backend=PyPdfiumDocumentBackend
            )
        }
    )


def extract_text_from_pdf_bytes(file_bytes: bytes, source_name: str | None = None) -> str:
    """
    Extracts text from a PDF or image payload (tables as markdown when OCR is needed).

    The real file type is detected from the content, not the extension.

    Args:
        file_bytes (bytes): Raw file bytes.
        source_name (str | None): Optional display name for logs.

    Returns:
        str: Extracted and cleaned text.
    """

    display_name = source_name or "uploaded.pdf"

    text = _pdf_text_layer(file_bytes)
    if text.strip():
        logger.info("Read text layer of %s", display_name)
        return clean_text(text)

    logger.info("No usable text layer in %s; running Docling OCR", display_name)
    with _convert_lock:
        result = _converter().convert(
            DocumentStream(name=display_name, stream=io.BytesIO(file_bytes))
        )
    return clean_text(result.document.export_to_markdown())
