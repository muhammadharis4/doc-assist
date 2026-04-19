"""Application-wide constants for retrieval and API behavior."""

from __future__ import annotations

APP_NAME = "DocAssist Backend"
APP_VERSION = "1.0.0"

EMBEDDING_MODEL_PATH = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIMENSIONS = 384

CHUNK_SIZE_CHARS = 220
CHUNK_OVERLAP_CHARS = 40

TOP_K = 3
TEXT_SCORE_WEIGHT = 0.3
VECTOR_SCORE_WEIGHT = 0.7

OPENSEARCH_INDEX_NAME = "docassist_chunks"
OPENSEARCH_PIPELINE_NAME = "nlp-search-pipeline"

MAX_QUERY_LENGTH = 2000
DEFAULT_HISTORY_LIMIT = 20
MAX_HISTORY_LIMIT = 100

SOURCE_SNIPPET_MAX_CHARS = 320
