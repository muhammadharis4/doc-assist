# DocAssist Backend

FastAPI backend for document ingest, hybrid retrieval (BM25 + vector), and answer generation.

## Stack

- FastAPI
- OpenSearch (text + vector in one engine)
- SentenceTransformer embeddings
- Ollama generation
- SQLite for document/query history persistence

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

- `APP_DB_PATH`: SQLite file path for documents/query history. Default `./data/app.db`.
- `OPENSEARCH_URL`: OpenSearch endpoint URL. Default `http://localhost:9200`.
- `OPENSEARCH_INDEX_NAME`: Index name for stored chunks. Default `docassist_chunks`.
- `OPENSEARCH_PIPELINE_NAME`: Hybrid search pipeline name. Default `nlp-search-pipeline`.

- `CHUNK_SIZE_CHARS`: Max chars per indexed chunk. Default `500`.
- `CHUNK_OVERLAP_CHARS`: Overlap chars between chunks. Default `120`.
- `RAG_TOP_K`: Final number of chunks returned to answer. Default `8`.
- `RAG_CANDIDATE_MULTIPLIER`: Candidate expansion before reranking. Default `6`.
- `RAG_MAX_RESULTS_PER_DOCUMENT`: Per-document cap in final hits. Default `3`.
- `SOURCE_SNIPPET_MAX_CHARS`: Max snippet length returned in sources/history. Default `500`.
- `DOC_TYPE_SCORE_BOOST`: Score bonus when query-intent type matches document type. Default `0.2`.
- `TEXT_SCORE_WEIGHT`: Lexical match weight in hybrid scoring. Default `0.6`.
- `VECTOR_SCORE_WEIGHT`: Embedding similarity weight in hybrid scoring. Default `0.4`.
- `EMBEDDING_MODEL`: Sentence-transformers model name/path. Default `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`.
- `OCR_LANGUAGES`: OCR language codes for scanned PDFs. Default `deu+eng`.

- `OLLAMA_BASE_URL`: Ollama API base URL. Default `http://localhost:11434`.
- `OLLAMA_MODEL`: Ollama model used for generation. Default `llama3.2:1b`.
- `OLLAMA_TEMPERATURE`: LLM generation temperature. Default `0.2`.

- `TELEGRAM_BOT_TOKEN`: Bot token to enable Telegram integration. Default empty (disabled).
- `TELEGRAM_WEBHOOK_SECRET`: Optional webhook secret header validator. Default empty (no secret check).
- `TELEGRAM_WEBHOOK_URL`: Public HTTPS webhook target for auto-registration. Default empty.
- `TELEGRAM_SOURCE_LIMIT`: Number of sources shown in Telegram replies. Default `3`.
- `TELEGRAM_MAX_MESSAGE_CHARS`: Max Telegram reply length before truncation. Default `3500`.
- `TELEGRAM_DOCS_LIST_LIMIT`: Max docs shown by `/docs`. Default `20`.
- `TELEGRAM_SCOPE_LABEL_ENABLED`: Include scope label in Telegram answers. Default `true`.

## API Endpoints

- `GET /health`
- `GET /documents`
- `POST /documents`
- `POST /documents/extract`
- `DELETE /documents/:id`
- `POST /queries`
- `POST /queries/stream`
- `GET /queries/history`
- `GET /integrations/telegram/health`
- `POST /integrations/telegram/webhook`

## App Flow

1. `POST /documents` stores a document row in SQLite with `status=pending`.
2. Background processing updates status to `processing`, then runs chunking and embedding.
3. Chunks are indexed in OpenSearch with both text and vector fields.
4. On success status becomes `ready`; on failure status becomes `failed` with an error message.
5. `POST /queries` embeds the query, runs OpenSearch hybrid search, and retrieves top chunks.
6. Retrieved chunks are sent to Ollama for grounded answer generation.
7. Query answer and sources are persisted to SQLite and returned.

Query params:

- `limit` (optional): max rows to return, default `20`, max `100`

Response:

```json
[
    {
        "id": "history-id",
        "query": "How do I run tests?",
        "answer": "Use npm run test --workspace=Backend",
        "userId": null,
        "createdAt": "2026-04-12T10:05:00.000Z"
    }
]
```

#### `GET /queries/saved`

Returns saved queries ordered by recency.

Response:

```json
[
    {
        "id": "saved-id",
        "title": "Run tests",
        "query": "How do I run tests?",
        "userId": null,
        "createdAt": "2026-04-12T10:10:00.000Z"
    }
]
```

#### `POST /queries/saved`

Creates a saved query.

Validation:

- `title` is required, trimmed, and limited to 120 characters
- `query` is required, trimmed, and limited to 2000 characters

Request body:

```json
{
    "title": "Run tests",
    "query": "How do I run tests?"
}
```

Response: created saved query object

#### `DELETE /queries/saved/:id`

Deletes a saved query by id.

Path params:

- `id`: saved query id

Response: deleted saved query object

## RAG Integration Behavior

The backend `RagService` behavior is:

- Try external RAG endpoint when `RAG_SERVICE_URL` is configured
- Fall back to local keyword retrieval when external RAG is unavailable
- Continue persisting query history either way

## Testing

```bash
# Unit tests
npm run test --workspace=Backend

# E2E tests
npm run test:e2e --workspace=Backend

# Build
npm run build --workspace=Backend
```

## Key Source Files

- `Backend/src/documents/documents.controller.ts`
- `Backend/src/documents/documents.service.ts`
- `Backend/src/queries/queries.controller.ts`
- `Backend/src/queries/queries.service.ts`
- `Backend/src/rag/rag.service.ts`
- `Backend/src/prisma/prisma.service.ts`
- `Backend/prisma/schema.prisma`
