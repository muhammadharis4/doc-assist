# DocAssist Frontend

Next.js **App Router** UI for DocAssist: marketing home, document hub, chat with streamed answers and history.

---

## Prerequisites

- **Node.js 20+** (aligned with `frontend/Dockerfile`)

---

## Environment

Create **`frontend/.env.local`** (gitignored):

```bash
BACKEND_API_URL=http://localhost:8000
```

The browser calls **same-origin** routes under `app/api/*`; those server handlers forward to `BACKEND_API_URL`. Set this to the FastAPI base URL (no trailing slash required — it is normalized in code).

**Security note:** `BACKEND_API_URL` must be a **trusted** internal URL in production. It is not end-user input in the default app, but a compromised deployment could misuse it if you inject untrusted values into the server environment.

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
| `/` | Landing / product overview |
| `/documents` | Upload, list, delete documents |
| `/chat` | Ask questions, stream tokens, history |

`/queries` redirects to `/chat` (see `next.config.ts`).

---

## Project layout

| Folder | Role |
|--------|------|
| `app/` | Next.js App Router: routes, layouts, `app/api/*` proxies |
| `components/` | Reusable UI (including `marketing/` for the home page) |
| `containers/` | Page-level compositions (chat, documents, home) wired to state and services |
| `services/` | Browser API clients (`services/*.ts`) and server-only helpers (`services/server/`) |
| `types/` | Shared TypeScript models and API shapes |
| `libs/` | Theme factory and cross-cutting UI tokens |
| `hooks/` | Client hooks and context (e.g. theme mode) |
| `styles/` | Global CSS (`globals.css` imported from `app/layout.tsx`) |
| `actions/` | Reserved for Server Actions |
| `store/` | Reserved for client global state if you add it later |

---

## API proxy shape

Client code under `services/*` talks to **Next.js** routes, which proxy to the backend:

| Next route | Proxies to backend |
|------------|---------------------|
| `GET` `/api/documents` | `/documents` (forwards query string for filters) |
| `POST` `/api/documents` | `/documents` |
| `PATCH` `/api/documents/[id]` | `/documents/{id}` (tags) |
| `DELETE` `/api/documents/[id]` | `/documents/{id}` |
| `POST` `/api/documents/extract` | `/documents/extract` |
| `POST` `/api/queries` | `/queries` |
| `POST` `/api/queries/stream` | `/queries/stream` (SSE) |
| `GET` `/api/queries/history` | `/queries/history` |
| `DELETE` `/api/queries/history/[id]` | `/queries/history/{id}` |

Implementation: `services/server/backend.ts` (`backendUrl`, `proxyRequest`).

---

## Docker

From the **repository root** (not `frontend/` alone):

```bash
docker compose build frontend
docker compose up frontend
```

The image uses Next **`output: "standalone"`**. Runtime env for the Node process should include **`BACKEND_API_URL`** pointing at the backend service (Compose sets `http://backend:8000` for `frontend`).

---

## Quality targets

- Strict TypeScript on API helpers and typed domain models (`types/*`).
- Accessible UI patterns via MUI; theme mode persisted client-side (`hooks/theme-mode.tsx`).

For repository-wide security and deployment assumptions, see the root **`SECURITY.md`**.

## License

MIT — see the repository root [`LICENSE`](../LICENSE).
