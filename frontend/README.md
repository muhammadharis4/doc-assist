# DocAssist Frontend

Next.js **App Router** UI for DocAssist: document hub, chat with streamed answers and history.

**Screenshots** (repo root): [`../docs/screenshots/`](../docs/screenshots/) — `ui-documents.png`, `ui-chat.png` (also embedded in the [root README](../README.md#screenshots)).

---

## Prerequisites

- **Node.js 20+** (aligned with `frontend/Dockerfile`)

---

## Environment

Create **`frontend/.env.local`** (gitignored):

```bash
BACKEND_API_URL=http://localhost:8000
```

The browser calls **same-origin** routes under `/api/*`; Next **rewrites** them to `BACKEND_API_URL` (see `next.config.ts`). Set this to the FastAPI base URL (no trailing slash required — it is normalized in code).

**`BACKEND_API_URL` is read at build time.** Next bakes rewrite destinations into the build, so `npm run dev` picks it up at start, but a production build needs it when you run `npm run build` (Docker passes it as a build arg).

**Security note:** `BACKEND_API_URL` must be a **trusted** internal URL in production. It is not end-user input in the default app, but a compromised deployment could misuse it if you inject untrusted values into the build environment.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Production server (after `build`) |
| `npm run lint` | ESLint, zero warnings |
| `npm run lint:fix` | ESLint with `--fix` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest unit tests (`**/*.test.ts`) |
| `npm run test:watch` | Vitest watch mode |
| `npm run check` | `typecheck` + `lint` + `test` + `build` |

---

## Routes

| Path | Description |
|------|-------------|
| `/documents` | Upload, list, delete documents |
| `/chat` | Ask questions, stream tokens, history |

`/` and `/queries` redirect to `/chat` (see `next.config.ts`).

---

## Project layout

| Folder | Role |
|--------|------|
| `app/` | Next.js App Router: routes and layouts |
| `components/` | Reusable UI |
| `containers/` | Page-level compositions (chat, documents) wired to state and services |
| `services/` | Browser API clients (`services/*.ts`) |
| `types/` | Shared TypeScript models and API shapes |
| `libs/` | MUI theme (light and dark color schemes) and cross-cutting UI tokens |
| `styles/` | Global CSS (`globals.css` imported from `app/layout.tsx`) |

---

## API proxy shape

Client code under `services/*` calls **same-origin** `/api/*` URLs, and `next.config.ts` rewrites two prefixes to the backend (nothing else is reachable through the UI port):

| Browser path | Forwarded to backend |
|--------------|-----------------------|
| `/api/documents/...` | `/documents/...` (list, create, tags, delete, `extract`) |
| `/api/queries/...` | `/queries/...` (ask, `stream` as SSE, `history`) |

Two Next proxy defaults are raised because they are too small for this app: request bodies are buffered up to **10 MB** (the backend accepts PDFs up to 25 MB, so it is set to 30 MB) and proxied calls time out after **30 s** (a CPU answer or a scan extraction takes minutes, so it is set to 10 min). Both are `experimental` options in `next.config.ts`.

---

## Docker

From the **repository root** (not `frontend/` alone):

```bash
docker compose build frontend
docker compose up frontend
```

The image uses Next **`output: "standalone"`**. `BACKEND_API_URL` is a **build argument** pointing at the backend service (Compose passes `http://backend:8000`); changing it means rebuilding the frontend image.

---

## Quality targets

- Strict TypeScript on API helpers and typed domain models (`types/*`).
- Accessible UI patterns via MUI; theme mode (light/dark) persisted client-side by MUI's `ThemeProvider` (`app/providers.tsx`).

For repository-wide security and deployment assumptions, see the root **`SECURITY.md`**.

## License

MIT — see the repository root [`LICENSE`](../LICENSE).
