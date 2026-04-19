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

- `APP_DB_PATH` (default `./data/app.db`)
- `OPENSEARCH_URL` (default `http://localhost:9200`)
- `OPENSEARCH_INDEX_NAME` (default `docassist_chunks`)
- `OPENSEARCH_PIPELINE_NAME` (default `nlp-search-pipeline`)
- `CHUNK_SIZE_CHARS` (default `220`)
- `CHUNK_OVERLAP_CHARS` (default `40`)
- `RAG_TOP_K` (default `3`)
- `TEXT_SCORE_WEIGHT` (default `0.3`)
- `VECTOR_SCORE_WEIGHT` (default `0.7`)
- `EMBEDDING_MODEL` (default `sentence-transformers/all-MiniLM-L6-v2`)
- `OLLAMA_BASE_URL` (default `http://localhost:11434`)
- `OLLAMA_MODEL` (default `llama3.2:1b`)
- `OLLAMA_TEMPERATURE` (default `0.2`)

## API Endpoints

- `GET /health`
- `GET /documents`
- `POST /documents`
- `DELETE /documents/:id`
- `POST /queries`
- `GET /queries/history`

## App Flow

1. `POST /documents` stores a document row in SQLite.
2. Text is chunked by character length (`CHUNK_SIZE_CHARS`).
3. Chunks are embedded with SentenceTransformer.
4. Chunks are indexed in OpenSearch with both text and vector fields.
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
