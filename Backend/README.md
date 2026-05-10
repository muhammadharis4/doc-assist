# DocAssist Backend

FastAPI service for document ingestion, **OpenSearch hybrid retrieval** (lexical + vector), and grounded answer generation (Ollama or mock). Persistence: **SQLite**. Optional **Telegram** webhook integration.

---

## Requirements

- Python **3.11+**
- Running **OpenSearch** (see `OPENSEARCH_URL`)
- **Ollama** on the same host or network (or set `USE_MOCK_LLM=true`)

---

## Run locally

```bash
cd Backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

- Base URL: `http://localhost:8000`
- Interactive docs: `http://localhost:8000/docs`

Use a `.env` file in this directory (loaded by `python-dotenv`; keep it out of git). **Do not commit secrets.**

---

## Configuration: environment vs code

### Environment variables (minimal)

These are the **only** values read from the environment in `src/config.py`:

| Variable | Purpose |
|----------|---------|
| `APP_DB_PATH` | SQLite database file path (default `./data/app.db`) |
| `OPENSEARCH_URL` | OpenSearch HTTP base URL |
| `OLLAMA_BASE_URL` | Ollama API base URL |
| `USE_MOCK_LLM` | If truthy, skip live Ollama calls (useful for CI / Compose without a model) |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (empty disables Telegram features) |
| `TELEGRAM_WEBHOOK_SECRET` | Strong secret for webhook validation header (recommended when using webhooks) |
| `TELEGRAM_WEBHOOK_URL` | Public HTTPS URL for `setWebhook` |

### Constants (code, not env)

Retrieval tuning, embedding model id, chunk sizes, OpenSearch **index / pipeline names**, Ollama **model name and temperature**, Telegram message limits, etc. live in **`src/constants.py`**. Change those in code (or fork) rather than scattering env knobs.

See also the repository root **`SECURITY.md`** for Telegram webhook and deployment notes.

---

## Main HTTP routes

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/health` | Liveness |
| `GET` / `POST` | `/documents` | List / create documents |
| `POST` | `/documents/extract` | PDF/text extraction helper |
| `DELETE` | `/documents/{id}` | Remove document |
| `POST` | `/queries` | Non-streaming Q&A |
| `POST` | `/queries/stream` | SSE streaming answer |
| `GET` | `/queries/history` | Recent queries |
| `GET` | `/integrations/telegram/health` | Telegram enabled flag |
| `POST` | `/integrations/telegram/webhook` | Telegram updates (validated when secret is set) |

---

## Processing flow (high level)

1. **Ingest** stores metadata (and staging) in SQLite; processing chunks text and computes embeddings.
2. **Indexing** writes chunks into OpenSearch (text + `knn_vector`) with the configured hybrid search pipeline.
3. **Query** runs hybrid search, optional type boosting, caps per-document hits.
4. **Generate** sends context to Ollama (or mock); history and sources are persisted in SQLite.

---

## License

The monorepo is under the **MIT License** — see the root [`LICENSE`](../LICENSE) file. Python code in this directory is covered by that license.

---

## Key modules

| Path | Role |
|------|------|
| `src/main.py` | App factory, lifespan: DB init, OpenSearch pipeline, warmup, Telegram webhook loop |
| `src/config.py` | `Settings` from env + constants |
| `src/constants.py` | Non-env tuning and defaults |
| `src/db.py` | SQLite access |
| `src/documents/` | Document routes & processing |
| `src/queries/` | Query routes & streaming service |
| `src/rag/` | Chunking, embeddings, OpenSearch, LLM |
| `src/integrations/telegram/` | Webhook and bot messaging |
