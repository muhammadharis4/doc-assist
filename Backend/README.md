# DocAssist Backend

NestJS API for document ingestion, query execution, and query history/source tracking.

## Overview

The backend currently provides:

- Document ingest and lifecycle endpoints
- Query execution via RAG service boundary (external or local fallback)
- Query history and saved query endpoints
- Prisma + SQLite persistence

## Tech Stack

- NestJS
- TypeScript
- Prisma ORM
- SQLite
- Jest

## Run Locally

```bash
# From repo root
npm install
npm run start:dev --workspace=Backend
```

Backend runs at `http://localhost:3000` by default.

## Environment Variables

- `PORT`: backend HTTP port (default `3000`)
- `DATABASE_URL`: Prisma database URL (default sqlite file)
- `RAG_SERVICE_URL`: optional external RAG service URL

If `RAG_SERVICE_URL` is not set, backend uses local retrieval fallback.

## API Endpoints

### Health / App

#### `GET /`

Returns a simple health text.

Response:

```text
Hello World!
```

---

### Documents

#### `GET /documents`

Returns documents ordered by newest first.

Query params:

- `skip` (optional): number of rows to skip, default `0`
- `take` (optional): number of rows to return, default `20`, max `100`
- `project` (optional): exact project filter
- `category` (optional): exact category filter
- `keyword` (optional): search term matched against filename, extracted text, project, and category

Validation:

- `skip` and `take` must be non-negative integers

Behavior:

- `project` and `category` apply exact-match filters
- `keyword` performs a contains search across document fields

Response:

```json
[
  {
    "id": "uuid",
    "filename": "README.md",
    "mimeType": "text/markdown",
    "size": 1200,
    "project": "DocAssist",
    "category": "Setup",
    "version": 1,
    "storagePath": "./docs/README.md",
    "extractedText": "...",
    "createdAt": "2026-04-12T10:00:00.000Z",
    "updatedAt": "2026-04-12T10:00:00.000Z"
  }
]
```

#### `POST /documents`

Ingests and stores a document, then triggers RAG indexing.

Request body:

```json
{
  "filename": "README.md",
  "mimeType": "text/markdown",
  "storagePath": "./docs/README.md",
  "extractedText": "# Getting Started...",
  "size": 1200,
  "project": "DocAssist",
  "category": "Setup",
  "version": 1
}
```

Required fields:

- `filename`
- `mimeType`
- `storagePath`
- `extractedText`

Response:

```json
{
  "id": "uuid",
  "filename": "README.md",
  "mimeType": "text/markdown",
  "size": 1200,
  "project": "DocAssist",
  "category": "Setup",
  "version": 1,
  "storagePath": "./docs/README.md",
  "extractedText": "# Getting Started...",
  "createdAt": "2026-04-12T10:00:00.000Z",
  "updatedAt": "2026-04-12T10:00:00.000Z"
}
```

#### `GET /documents/:id`

Returns a single document.

Path params:

- `id`: document id

Response: document object

Errors:

- `404` if document does not exist

#### `DELETE /documents/:id`

Deletes a document and attempts to remove its RAG index entry.

Path params:

- `id`: document id

Response: deleted document object

Errors:

- `404` if document does not exist

---

### Queries

#### `POST /queries`

Executes a natural-language query through RAG service and stores history/sources.

Request body:

```json
{
  "query": "How do I run tests?",
  "userId": "optional-user-id"
}
```

Required fields:

- `query`

Response:

```json
{
  "id": "history-id",
  "query": "How do I run tests?",
  "answer": "Use npm run test --workspace=Backend",
  "userId": null,
  "createdAt": "2026-04-12T10:05:00.000Z",
  "sources": [
    {
      "id": "source-id",
      "queryHistoryId": "history-id",
      "documentId": "doc-id",
      "snippet": "Run npm run test --workspace=Backend",
      "score": 0.92
    }
  ]
}
```

Errors:

- `400` if `query` is missing/empty

#### `GET /queries/history`

Returns recent query history, newest first.

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
