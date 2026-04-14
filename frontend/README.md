# DocAssist Frontend

Next.js App Router frontend for DocAssist.

## Current Feature Slice

- Document management workspace
- Create document records
- Filter and paginate document list
- Delete documents
- Typed API calls through Next.js route proxy

## Environment Setup

1. Copy `.env.local.example` to `.env.local`.
2. Set `BACKEND_API_URL` to your NestJS backend origin.

Example:

```env
BACKEND_API_URL=http://localhost:3000
```

## Run Locally

```bash
npm run dev
```

App default URL: http://localhost:3000

## API Flow

Browser components call Next.js route handlers:

- `GET /api/documents`
- `POST /api/documents`
- `DELETE /api/documents/:id`

Route handlers proxy requests to Backend:

- `GET /documents`
- `POST /documents`
- `DELETE /documents/:id`

## Quality Goals in This Slice

- Strict TypeScript on component props and API models
- DRY request handling via shared API client
- Clear loading, empty, success, and error states
- Brief behavior-focused comments in component modules
