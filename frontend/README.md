# DocAssist Frontend

Next.js App Router frontend for DocAssist.

## Current Feature Slice

- Document upload form
- Document list
- Delete documents
- Typed API calls through Next.js rewrite

## Environment Setup

No frontend env file is required for the current documents slice.

The frontend rewrites `/api/*` requests to the backend running at `http://localhost:3000`.

## Run Locally

```bash
npm run dev
```

App default URL: http://localhost:3000

## API Flow

Browser components call the Next.js rewrite path:

- `GET /api/documents`
- `POST /api/documents`
- `DELETE /api/documents/:id`

Next.js forwards those requests to Backend:

- `GET /documents`
- `POST /documents`
- `DELETE /documents/:id`

## Quality Goals in This Slice

- Strict TypeScript on component props and API models
- Minimal request handling via one documents API module
- Clear loading, empty, success, and error states
- Brief behavior-focused comments in component modules
