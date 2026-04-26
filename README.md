# DocAssist Monorepo

DocAssist is a retrieval-augmented documentation assistant with a Python backend and a Next.js frontend.

## Project Layout

```text
Doc Assist/
├── Backend/      # FastAPI API + retrieval pipeline
├── frontend/     # Next.js App Router UI
├── .github/      # Agent/docs guidance (ignored from git in this repo)
└── .gitignore
```

## Current Architecture

- `frontend` calls local Next.js route handlers under `frontend/app/api/*`.
- Route handlers proxy requests to `Backend`.
- `Backend` handles ingestion, retrieval, and answer generation.
- Retrieval stack is backend-internal: chunking + embeddings + OpenSearch hybrid search + Ollama.
- Persistence uses SQLite for documents, query history, and source records.

## Backend Quick Start

```bash
cd Backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs on `http://localhost:8000`.

## Frontend Quick Start

Create `frontend/.env.local`:

```bash
BACKEND_API_URL=http://localhost:8000
```

Run frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

## Main API Endpoints

- `GET /health`
- `GET /documents`
- `POST /documents`
- `POST /documents/extract`
- `DELETE /documents/:id`
- `POST /queries`
- `POST /queries/stream`
- `GET /queries/history`
- `POST /integrations/telegram/webhook`

## Service Docs

- `Backend/README.md`
- `frontend/README.md`

## Contribution Notes

- Keep contracts stable unless intentionally changing them.
- Add or update tests for behavior changes where practical.
- Keep docs synchronized with implementation when contracts change.

## License

UNLICENSED
