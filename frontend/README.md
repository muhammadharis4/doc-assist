# DocAssist Frontend

Next.js App Router frontend for DocAssist.

## Current Feature Slice

- Document upload form
- Document list
- Delete documents
- Query chat + history
- Typed API calls through Next.js route handlers

## Environment Setup

Create `frontend/.env.local`:

```bash
BACKEND_API_URL=http://localhost:8000
```

Route handlers under `app/api` proxy requests to this backend origin.

## Run Locally

```bash
npm run dev
```

App default URL: http://localhost:3000

## API Flow

Browser components call local Next.js API routes:

- `GET /api/documents`
- `POST /api/documents`
- `DELETE /api/documents/:id`
- `POST /api/queries`
- `GET /api/queries/history`

Route handlers forward requests to Backend:

- `GET /documents`
- `POST /documents`
- `DELETE /documents/:id`
- `POST /queries`
- `GET /queries/history`

## Quality Goals in This Slice

- Strict TypeScript on component props and API models
- Minimal request handling via one documents API module
- Clear loading, empty, success, and error states
- Brief behavior-focused comments in component modules
