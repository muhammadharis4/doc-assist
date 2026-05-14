"""PDF text extraction helpers with OCR fallback."""

from __future__ import annotations

import io
import logging

from PIL import Image
from PyPDF2 import PdfReader
from PyPDF2._page import PageObject

from src.config import settings
from src.rag.chunking import clean_text

logger = logging.getLogger(__name__)


def _prepare_image_for_ocr(image: Image.Image) -> Image.Image:
    """
    Applies lightweight preprocessing before OCR.

    Args:
        image (Image.Image): Source image.

    Returns:
        Image.Image: OCR-ready image.
    """

    # Grayscale plus autocontrast improves OCR on scanned forms.
    return image.convert("L")


def extract_text_from_pdf_bytes(file_bytes: bytes, source_name: str | None = None) -> str:
    """
    Extracts text from a PDF file payload with OCR fallback.

    Args:
        file_bytes (bytes): Raw PDF bytes.
        source_name (str | None): Optional display name for logs.

    Returns:
        str: Extracted and cleaned text.
    """

    text_parts: list[str] = []
    display_name = source_name or "uploaded.pdf"

    pdf_reader = PdfReader(io.BytesIO(file_bytes))
    logger.info("Opened PDF for extraction: %s", display_name)

    for page_num, page in enumerate(pdf_reader.pages):
        try:
            page_text = page.extract_text() or ""
            if page_text.strip():
                text_parts.append(page_text)
                logger.info("Extracted text from page %d without OCR", page_num)
                continue

            logger.info("No text found on page %d; attempting OCR", page_num)
            image_text = _extract_text_from_images(page)
            if image_text:
                text_parts.append(image_text)
        except Exception as error:  # pragma: no cover - corrupt pages are environment-dependent
            logger.warning("Error processing page %d in %s: %s", page_num, display_name, error)

    cleaned = clean_text("\n".join(text_parts))
    logger.info("Completed PDF extraction for %s", display_name)
    return cleaned


def _extract_text_from_images(page: PageObject) -> str:
    """
    Extracts text from embedded page images using OCR.

    Args:
        page (PageObject): PDF page object.

    Returns:
        str: OCR text extracted from embedded images.
    """

    text_parts: list[str] = []
    images = getattr(page, "images", None)
    if not images:
        return ""

    import pytesseract

    for image_file_object in images:
        try:
            image = Image.open(io.BytesIO(image_file_object.data))
            ocr_ready = _prepare_image_for_ocr(image)
            ocr_text = pytesseract.image_to_string(ocr_ready, lang=settings.ocr_languages)
            if ocr_text.strip():
                text_parts.append(ocr_text)
                logger.info("Extracted text from embedded image using OCR")
        except Exception as error:  # pragma: no cover - image formats vary by PDF
            logger.warning("Error processing embedded image for OCR: %s", error)

    return "\n".join(text_parts)
