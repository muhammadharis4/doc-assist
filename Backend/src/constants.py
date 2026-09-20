"""Application-wide constants for retrieval and API behavior."""

from __future__ import annotations

APP_NAME = "DocAssist Backend"
APP_VERSION = "1.0.0"

EMBEDDING_MODEL = "bge-m3"  # served by Ollama: `ollama pull bge-m3`
EMBEDDING_DIMENSIONS = 1024  # bge-m3; chunks.embedding in db.py uses this

CHUNK_SIZE_CHARS = 500
CHUNK_OVERLAP_CHARS = 120

TOP_K = 8

OLLAMA_MODEL = "llama3.2:1b"
OLLAMA_TEMPERATURE = 0.2

TEXT_SCORE_WEIGHT = 0.6
VECTOR_SCORE_WEIGHT = 0.4
RAG_CANDIDATE_MULTIPLIER = 6
RAG_MAX_RESULTS_PER_DOCUMENT = 3

OPENSEARCH_INDEX_NAME = "docassist_chunks"
OPENSEARCH_PIPELINE_NAME = "nlp-search-pipeline"

MAX_QUERY_LENGTH = 2000
DEFAULT_HISTORY_LIMIT = 20
MAX_HISTORY_LIMIT = 100

# Largest document body accepted on ``POST /documents`` (characters).
MAX_DOCUMENT_CONTENT_CHARS = 1_000_000
# Largest PDF upload for ``POST /documents/extract`` (bytes).
MAX_PDF_UPLOAD_BYTES = 25 * 1024 * 1024
# File types Docling reads; shared by the upload route, folder scanner, and Telegram.
INGEST_EXTENSIONS = (".pdf", ".jpg", ".jpeg", ".png")
# Seconds between scans of the watched folder.
WATCH_INTERVAL_SEC = 60

# Per-IP rate limits (SlowAPI). Disabled when ``DOCASSIST_TESTING`` is set (pytest).
RATE_LIMIT_DOCUMENTS_LIST = "120/minute"
RATE_LIMIT_DOCUMENTS_CREATE = "20/minute"
# Batches often upload many PDFs in sequence; Next proxies as one IP, so keep headroom.
RATE_LIMIT_DOCUMENTS_EXTRACT = "60/minute"
RATE_LIMIT_DOCUMENTS_DELETE = "60/minute"
RATE_LIMIT_DOCUMENTS_PATCH = "60/minute"
RATE_LIMIT_QUERIES_EXECUTE = "30/minute"
RATE_LIMIT_QUERIES_STREAM = "15/minute"
RATE_LIMIT_QUERY_HISTORY_LIST = "120/minute"
RATE_LIMIT_QUERY_HISTORY_DELETE = "60/minute"
RATE_LIMIT_TELEGRAM_HEALTH = "60/minute"

SOURCE_SNIPPET_MAX_CHARS = 500

TELEGRAM_SOURCE_LIMIT = 3
TELEGRAM_MAX_MESSAGE_CHARS = 3500
TELEGRAM_DOCS_LIST_LIMIT = 20
TELEGRAM_SCOPE_LABEL_ENABLED = True
# 0 = unlimited setWebhook retries when TELEGRAM_WEBHOOK_URL is configured.
TELEGRAM_WEBHOOK_RETRY_MAX = 0

DOCUMENT_TYPE_RENTAL_CONTRACT = "rental_contract"
DOCUMENT_TYPE_WORK_CONTRACT = "work_contract"
DOCUMENT_TYPE_SALARY_SLIP = "salary_slip"
DOCUMENT_TYPE_INSURANCE = "insurance"
DOCUMENT_TYPE_TAX = "tax"
DOCUMENT_TYPE_REGISTRATION = "registration"
DOCUMENT_TYPE_OTHER = "other"

DOCUMENT_TYPES = (
    DOCUMENT_TYPE_RENTAL_CONTRACT,
    DOCUMENT_TYPE_WORK_CONTRACT,
    DOCUMENT_TYPE_SALARY_SLIP,
    DOCUMENT_TYPE_INSURANCE,
    DOCUMENT_TYPE_TAX,
    DOCUMENT_TYPE_REGISTRATION,
    DOCUMENT_TYPE_OTHER,
)

DOC_TYPE_SCORE_BOOST = 0.2

# Tags on documents (JSON array in SQLite). Validated in Pydantic.
MAX_TAGS_PER_DOCUMENT = 20
MAX_TAG_LENGTH = 48
