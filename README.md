# DocAssist Monorepo

DocAssist is a retrieval-augmented assistant over your uploaded documents: a **FastAPI** backend (chunking, embeddings, OpenSearch hybrid search, optional Ollama) and a **Next.js** App Router frontend.

**License:** [MIT](./LICENSE) — see the [License](#license) section below.

---

## Repository layout

```text
Doc Assist/
├── Backend/           # FastAPI API + RAG pipeline
├── frontend/        # Next.js UI + `app/api/*` proxies to Backend
├── LICENSE            # MIT
├── docker-compose.yml # Optional full stack for local/demo (see SECURITY.md)
└── SECURITY.md        # Threat model and hardening notes (read before exposing to a network)
```

---

## Prerequisites

- **Python 3.11+**, **Node 20+** (matching the frontend Docker image).
- **OpenSearch** reachable at `OPENSEARCH_URL` (default `http://localhost:9200` for native dev).
- **Ollama** (optional) at `OLLAMA_BASE_URL`, or `USE_MOCK_LLM=true` for tests/demo without an LLM.

---

## Backend quick start

```bash
cd Backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

- API: `http://localhost:8000` — OpenAPI: `/docs`
- **Environment:** only a small set of variables is read from the process environment; see `Backend/src/config.py` (`_build_settings`) and **`Backend/README.md`**. Other defaults live in **`Backend/src/constants.py`** (not env).

---

## Frontend quick start

Create **`frontend/.env.local`** (not committed):

```bash
BACKEND_API_URL=http://localhost:8000
```

```bash
cd frontend
npm install
npm run dev
```

- App: `http://localhost:3000` — routes: `/`, `/documents`, `/chat` (legacy `/queries` redirects to `/chat`).
- Quality gates: `npm run lint`, `npm run typecheck`, `npm run check` (includes `next build`).

---

## Docker (optional)

From the repo root:

```bash
docker compose build
docker compose up
```

- UI: `http://localhost:3000` — backend: `http://localhost:8000/docs`
- Compose includes a **development-only** OpenSearch configuration. **Do not** use that topology as-is on the public internet — read **`SECURITY.md`**.

---

## HTTP API surface (backend)

| Area        | Examples |
|------------|----------|
| Health     | `GET /health` |
| Documents  | `GET/POST /documents`, `POST /documents/extract`, `DELETE /documents/{id}` |
| Queries    | `POST /queries`, `POST /queries/stream`, `GET /queries/history` |
| Telegram   | `POST /integrations/telegram/webhook` (when bot + webhook configured) |

Full detail: **`Backend/README.md`**, **`frontend/README.md`**.

---

## Security

**Read [`SECURITY.md`](./SECURITY.md)** before deploying. The REST API does not implement per-user sign-in; treat network placement and your own reverse proxy or identity layer as your control plane for anything beyond a trusted environment.

---

## Testing and CI

**Backend** (from `Backend/`):

```bash
pip install -r requirements.txt -r requirements-dev.txt
pytest -q
```

**Frontend** (from `frontend/`):

```bash
npm install
npm run test
npm run check
```

**GitHub Actions**: `.github/workflows/ci.yml` runs the same checks on push/PR to `main` or `master`.

---

## Contributing

- Keep API contracts stable unless you intentionally version or document a break.
- Prefer small, reviewable changes; run **`pytest`** in `Backend/` and **`npm run check`** in `frontend/` before opening a PR.
- Update READMEs when behavior, env vars, or deployment assumptions change.

---

## License

This project is licensed under the **MIT License** — see [`LICENSE`](./LICENSE).

The `frontend/package.json` field `license` is set to `MIT` for npm tooling. The Python backend in `Backend/` is covered by the same root `LICENSE` file (no separate PyPI package is defined in-repo; if you publish one, set `license` in `pyproject.toml` to match).
