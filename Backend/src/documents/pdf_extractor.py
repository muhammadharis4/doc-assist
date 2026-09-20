"""Document text extraction through Docling (digital PDFs, scans, and photos)."""

from __future__ import annotations

import io
import logging
import threading
from functools import lru_cache

from docling.backend.pypdfium2_backend import PyPdfiumDocumentBackend
from docling.datamodel.base_models import DocumentStream, InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption

from src.rag.chunking import clean_text

logger = logging.getLogger(__name__)

# ponytail: one conversion at a time keeps CPU/RAM bounded; a job queue if uploads pile up.
_convert_lock = threading.Lock()


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
    # The default PDF backend silently dropped the body of some digital forms
    # (payslips); the pypdfium2 backend keeps it.
    return DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=options, backend=PyPdfiumDocumentBackend
            )
        }
    )


def extract_text_from_pdf_bytes(file_bytes: bytes, source_name: str | None = None) -> str:
    """
    Extracts text (tables as markdown) from a PDF or image payload.

    The real file type is detected from the content, not the extension.

    Args:
        file_bytes (bytes): Raw file bytes.
        source_name (str | None): Optional display name for logs.

    Returns:
        str: Extracted and cleaned text.
    """

    display_name = source_name or "uploaded.pdf"
    with _convert_lock:
        result = _converter().convert(
            DocumentStream(name=display_name, stream=io.BytesIO(file_bytes))
        )

    cleaned = clean_text(result.document.export_to_markdown())
    logger.info("Extracted %d characters from %s", len(cleaned), display_name)
    return cleaned
