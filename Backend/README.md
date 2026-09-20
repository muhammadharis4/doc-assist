# DocAssist Backend

FastAPI service that ingests documents (digital PDFs, scans, photos), finds the right passages with **Postgres + pgvector hybrid search** (keyword + vector, merged with RRF), and writes grounded answers with a local **Ollama** model. Optional **Telegram** bot integration.

---

## Requirements

- Python **3.11+**
- **Postgres with the pgvector extension** (the `pgvector/pgvector` Docker image bundles it)
- **Ollama** with two models pulled: `qwen2.5:7b` (answers) and `bge-m3` (embeddings)

---

## Run locally

Start Postgres (data persists in a named volume; tables are created on startup):

```bash
docker run -d --name docassist-db --restart unless-stopped -p 5432:5432 \
  -e POSTGRES_USER=docassist -e POSTGRES_PASSWORD=docassist -e POSTGRES_DB=docassist \
  -v docassist_pgdata:/var/lib/postgresql/data pgvector/pgvector:pg17

ollama pull qwen2.5:7b
ollama pull bge-m3
```

Start the API (Docling needs PyTorch: install the **CPU-only** build first to avoid gigabytes of CUDA packages):

```bash
cd Backend
python -m venv .venv
source .venv/bin/activate          # Windows: .\.venv\Scripts\activate
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

- Base URL: `http://localhost:8000`
- Interactive docs: `http://localhost:8000/docs`

Use a `.env` file in this directory (loaded by `python-dotenv`; keep it out of git). **Do not commit secrets.**

---

## Configuration: environment vs code

### Environment variables

These are the **only** values read from the environment in `src/config.py`. Each one differs per machine or is a secret:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection URL (default `postgresql://docassist:docassist@localhost:5432/docassist`) |
| `OLLAMA_BASE_URL` | Ollama API base URL (default `http://localhost:11434`) |
| `WATCH_FOLDER` | Folder kept in sync every 60 s: new files are ingested, and a document is removed when its file is deleted (default `Sample data`; empty disables it) |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (empty disables Telegram features) |
| `TELEGRAM_WEBHOOK_SECRET` | Strong secret for webhook validation header (recommended when using webhooks) |
| `TELEGRAM_WEBHOOK_URL` | Public HTTPS URL for `setWebhook` |
| `TRUSTED_HOSTS` | Comma-separated `Host` values for `TrustedHostMiddleware` (empty disables the middleware) |

### Constants (code, not env)

Everything else lives in **`src/constants.py`**: model names, chunk sizes, top-k, the RRF constant, upload size limits, and Telegram message limits. Change them in code rather than adding env knobs.

See also the repository root **`SECURITY.md`** for Telegram webhook and deployment notes.

---

## Main HTTP routes

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/health` | Liveness |
| `GET` / `POST` | `/documents` | List (optional filters: `q`, `document_type`, `status`/`inbox`, `tag`, `created_from`, `created_to`) / create |
| `PATCH` | `/documents/{id}` | Replace document tags |
| `POST` | `/documents/extract` | Text extraction for a PDF, JPG, or PNG (can take minutes for scans) |
| `DELETE` | `/documents/{id}` | Remove document and its chunks |
| `POST` | `/queries` | Non-streaming Q&A |
| `POST` | `/queries/stream` | SSE streaming answer |
| `GET` | `/queries/history` | Recent queries |
| `GET` | `/integrations/telegram/health` | Telegram enabled flag |
| `POST` | `/integrations/telegram/webhook` | Telegram updates (validated when secret is set) |

---

## Processing flow

1. **Ingest.** Files arrive by upload, by the watched folder, or as a PDF/photo sent to the Telegram bot. Folder and Telegram files go through one function, `DocumentService.ingest_file`:
   - A PDF with a text layer is read directly (fast, exact numbers).
   - Scans and photos go through **Docling** (OCR and table structure; tables become markdown). The real file type is detected from the content, not the extension.
   - The file's SHA-256 is stored, so the same file is never ingested twice. A file that cannot be read is kept as `failed` and not retried.
   - The document type (`salary_slip`, `tax`, ...) is guessed from keywords.
   - The watched folder is kept in sync: files are matched to documents by hash, so a rename keeps the document and a deleted file removes it. A folder with no files at all removes nothing (it is more likely unmounted than emptied), and a missing folder is re-checked every cycle. In Docker Compose, `Backend/Sample data/` is mounted read-only at `/app/Sample data`.
2. **Index.** The text is chunked, each chunk is embedded with `bge-m3` (1024 dimensions), and both are stored in the Postgres `chunks` table (vector column plus a full-text `tsvector`).
3. **Query.** A keyword router picks a small score boost for the matching document type and reads hints like "latest payslip" (the newest one *of that type*). One SQL query ranks chunks by keyword and by vector similarity and merges the two rankings with RRF. The top 5 chunks are kept.
4. **Generate.** The chunks go to `qwen2.5:7b` through Ollama. History and sources are stored in Postgres.

---

## Tests

Tests run against a **throwaway** pgvector Postgres on port 5433. Never point them at real data: the database is emptied at the start of every run.

```bash
docker run -d --rm --name docassist-test-db -p 5433:5432 -e POSTGRES_USER=docassist \
  -e POSTGRES_PASSWORD=docassist -e POSTGRES_DB=docassist_test pgvector/pgvector:pg17

pip install -r requirements.txt -r requirements-dev.txt
pytest -q
```

Warmup, embedding, and LLM calls are faked, so Ollama is not required. Two groups skip themselves when their inputs are missing: `test_pdf_extractor.py` (needs local files in `Backend/Sample data/`, which is git-ignored) and `test_embeddings.py` (needs Ollama with `bge-m3`).

---

## Key modules

| Path | Role |
|------|------|
| `src/main.py` | App factory, lifespan: DB init, warmup, folder scanner, Telegram webhook loop |
| `src/config.py` | `Settings` from the environment |
| `src/constants.py` | Non-env tuning and defaults |
| `src/db.py` | Postgres access: documents, chunks, hybrid search, history |
| `src/documents/` | Routes, `ingest_file`, PDF/OCR extraction, folder scanner |
| `src/queries/` | Query routes and streaming service |
| `src/rag/` | Chunking, embeddings (Ollama), keyword router, LLM |
| `src/integrations/telegram/` | Webhook, bot messaging, file uploads |

---

## License

The monorepo is under the **MIT License** — see the root [`LICENSE`](../LICENSE) file. Python code in this directory is covered by that license.
