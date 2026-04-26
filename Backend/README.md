# DocAssist Backend

FastAPI backend for document ingestion, hybrid retrieval (BM25 + vector), and grounded answer generation.

## Stack

- FastAPI
- SQLite (documents + query history persistence)
- OpenSearch (hybrid lexical/vector retrieval)
- SentenceTransformer embeddings
- Ollama generation
- Telegram webhook integration

## Run Locally

```bash
cd Backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Backend URL: `http://localhost:8000`

## Environment Variables

### Core

- `APP_DB_PATH` (default: `./data/app.db`)
- `OPENSEARCH_URL` (default: `http://localhost:9200`)
- `OPENSEARCH_INDEX_NAME` (default: `docassist_chunks`)
- `OPENSEARCH_PIPELINE_NAME` (default: `nlp-search-pipeline`)

### Retrieval and Ranking

- `CHUNK_SIZE_CHARS` (default: `500`)
- `CHUNK_OVERLAP_CHARS` (default: `120`)
- `RAG_TOP_K` (default: `8`)
- `RAG_CANDIDATE_MULTIPLIER` (default: `6`)
- `RAG_MAX_RESULTS_PER_DOCUMENT` (default: `3`)
- `SOURCE_SNIPPET_MAX_CHARS` (default: `500`)
- `DOC_TYPE_SCORE_BOOST` (default: `0.2`)
- `TEXT_SCORE_WEIGHT` (default: `0.6`)
- `VECTOR_SCORE_WEIGHT` (default: `0.4`)
- `EMBEDDING_MODEL` (default: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`)
- `OCR_LANGUAGES` (default: `deu+eng`)

### LLM Generation

- `OLLAMA_BASE_URL` (default: `http://localhost:11434`)
- `OLLAMA_MODEL` (default: `llama3.2:1b`)
- `OLLAMA_TEMPERATURE` (default: `0.2`)

### Telegram Integration

- `TELEGRAM_BOT_TOKEN` (default: empty, integration disabled)
- `TELEGRAM_WEBHOOK_SECRET` (default: empty)
- `TELEGRAM_WEBHOOK_URL` (default: empty)
- `TELEGRAM_SOURCE_LIMIT` (default: `3`)
- `TELEGRAM_MAX_MESSAGE_CHARS` (default: `3500`)
- `TELEGRAM_DOCS_LIST_LIMIT` (default: `20`)
- `TELEGRAM_SCOPE_LABEL_ENABLED` (default: `true`)

## API Endpoints

### Health

- `GET /health`

### Documents

- `GET /documents`
- `POST /documents`
- `POST /documents/extract`
- `DELETE /documents/:id`

### Queries

- `POST /queries`
- `POST /queries/stream`
- `GET /queries/history`

### Telegram

- `GET /integrations/telegram/health`
- `POST /integrations/telegram/webhook`

## Request/Response Notes

### `POST /documents`

Creates a document, then processes chunking/embedding/indexing asynchronously.

Typical request fields:

- `filename`
- `content`
- `mimeType` (optional)
- `documentType` (optional)

Document lifecycle:

`pending` -> `processing` -> `ready` or `failed`

### `POST /queries`

Accepts:

```json
{ "query": "How do I reset my password?" }
```

Returns:

```json
{
  "answer": "string",
  "sources": [
    {
      "documentId": "string",
      "filename": "string",
      "snippet": "string",
      "score": 0.9
    }
  ]
}
```

### `GET /queries/history`

Query params:

- `limit` (optional, default `20`, max `100`)

Returns latest query records with answer + sources.

## Processing Flow

1. Ingest endpoint stores document metadata/content in SQLite.
2. Background processing chunks content and creates embeddings.
3. Chunks are indexed into OpenSearch with text + vector fields.
4. Query endpoint retrieves candidates through hybrid search.
5. Retrieved chunks are sent to Ollama for grounded answer generation.
6. Query history and sources are persisted and returned.

## Testing and Verification

```bash
# Run backend service locally
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Use `/health`, `/documents`, and `/queries` endpoints to validate the pipeline end-to-end.

## Key Source Files

- `src/main.py`
- `src/config.py`
- `src/db.py`
- `src/documents/routes.py`
- `src/documents/service.py`
- `src/queries/routes.py`
- `src/queries/service.py`
- `src/rag/chunking.py`
- `src/rag/embeddings.py`
- `src/rag/opensearch_store.py`
- `src/rag/llm.py`
- `src/integrations/telegram/routes.py`
