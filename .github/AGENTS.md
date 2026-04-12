# DocAssist Agent Modes

This file defines specialized agent configurations for working on different parts of the DocAssist monorepo with full project context.

## Backend Agent
**Purpose:** Work on NestJS API, Prisma models, and core backend features

**Scope:** Everything in `/Backend`

**Context to understand:**
- NestJS feature modules (Documents, Queries, RAG, Prisma)
- Dependency injection patterns (constructor-based, service wiring)
- Error handling (BadRequestException, NotFoundException)
- Prisma data layer (direct model access, no repository pattern)

**Typical tasks:**
- Add new endpoints or services
- Extend Prisma models and migrations
- Improve RAG boundary (local or external)
- Add or fix tests

**Before starting:**
1. Read `.github/copilot-instructions.md` (Backend Architecture section)
2. Review `Backend/src/app.module.ts` (module structure)
3. Check `Backend/prisma/schema.prisma` (data models)
4. Run `npm run dev --workspace=Backend` to verify local setup

**Key files to reference:**
- `Backend/src/{documents,queries,rag}/` — feature modules
- `Backend/src/prisma/prisma.service.ts` — database access
- `Backend/prisma/schema.prisma` — data schema
- `Backend/package.json` — @docassist/backend workspace

---

## Frontend Agent
**Purpose:** Build the React/Next.js user interface

**Scope:** Everything in `/Frontend`

**Context to understand:**
- Backend API endpoints (POST /documents, POST /queries, GET /queries/history, etc.)
- Document ingestion payload format
- Query execution and result structure (answer + sources)
- Query history and saved queries

**Typical tasks:**
- Set up React/Next.js project
- Build search interface
- Create results display component
- Implement query history UI
- Add source viewer

**Before starting:**
1. Understand the Backend API by reading `Backend/README.md`
2. Review Backend endpoints in `Backend/src/{documents,queries}/documents.controller.ts`
3. Check Prisma models for response structure in `Backend/prisma/schema.prisma`
4. Run `npm run dev --workspace=Backend` to have API available for integration

**Backend API Reference:**
```
POST /documents               # Ingest document
POST /queries                 # Execute query
GET /queries/history?limit=20 # Get query history
GET /queries/saved            # Get saved queries
POST /queries/saved           # Save a query
DELETE /queries/saved/:id     # Delete saved query
```

---

## RAG Service Agent
**Purpose:** Build the Python FastAPI retrieval-augmented generation service

**Scope:** Everything in `/RAG`

**Context to understand:**
- Backend expects RAG service at `RAG_SERVICE_URL` (or uses local fallback)
- RAG service exposes: `POST /query` and `POST /documents` endpoints
- Integration point: Backend's `RagService` calls RAG via HTTP
- Local fallback in Backend: basic keyword-based retrieval from Prisma

**Typical tasks:**
- Set up FastAPI project
- Implement document indexing (vector embeddings)
- Build retrieval pipeline
- Integrate with LLM for answer generation
- Add API endpoints for query and indexing

**Before starting:**
1. Understand Backend's RAG boundary: `Backend/src/rag/rag.service.ts`
2. Review expected API contract (see below)
3. Note: Backend has `RAG_SERVICE_URL` env var to point to your service

**Expected RAG API Contract:**
```
POST /query
Request:  { "query": "string" }
Response: {
  "answer": "string",
  "sources": [
    {
      "documentId": "string",
      "filename": "string",
      "snippet": "string",
      "score": number
    }
  ]
}

POST /documents
Request: {
  "documentId": "string",
  "text": "string",
  "filename": "string (optional)",
  "project": "string (optional)",
  "category": "string (optional)"
}
Response: 200 OK

DELETE /documents/:documentId
Response: 200 OK
```

---

## Monorepo Agent
**Purpose:** Work on cross-service concerns, infrastructure, and coordination

**Scope:** Root-level configuration, documentation, git/deployment

**Context to understand:**
- npm workspaces (Backend + Frontend coordination)
- Python service (RAG) managed separately
- Unified git history across all services
- Environment variables and service configuration

**Typical tasks:**
- Update monorepo documentation
- Add GitHub Actions CI/CD
- Coordinate workspace scripts
- Manage environment configuration
- Update architectural decisions

**Key files:**
- `package.json` — npm workspace config
- `.github/copilot-instructions.md` — this documentation
- `.github/AGENTS.md` — agent modes (this file)
- `.gitignore` — shared ignore rules

---

## How to Invoke an Agent

When working on a specific part of the project, clearly indicate which agent mode you're in:

**Example prompt:**
```
[Backend Agent] Add a new endpoint to list documents by category.
Implement it in DocumentsService and DocumentsController.
```

**Example prompt:**
```
[RAG Service Agent] Set up FastAPI project with endpoints for /query and /documents.
Use Pydantic for request/response validation.
```

**Example prompt:**
```
[Frontend Agent] Build a search form component that:
1. Has input for query text
2. Has optional project/category filters
3. Handles submission to Backend API
```

---

## Integration Points Between Services

### Backend ↔ RAG Service
- Backend calls RAG via HTTP at `process.env.RAG_SERVICE_URL`
- Falls back to local keyword retrieval if service unavailable
- See: `Backend/src/rag/rag.service.ts`

### Backend ↔ Frontend
- Frontend calls Backend REST API on port 3000
- Current endpoints: `/documents`, `/queries`, `/queries/history`, `/queries/saved`
- See: `Backend/src/{documents,queries}/*.controller.ts`

### Git Coordination
- All services in same git repo
- Commits affect entire monorepo
- Use clear commit messages describing which services changed

---

## Common Development Scenarios

**Scenario 1: Add a new query feature**
- Backend Agent: Extend QueriesService and QueriesController
- Frontend Agent: Add UI component for the feature
- Commit: Include both file changes in single commit

**Scenario 2: Improve RAG answers**
- RAG Service Agent: Enhance retrieval or LLM integration
- Backend Agent (optional): Adjust RAG boundary if contract changes
- Test Backend ↔ RAG integration

**Scenario 3: Fix a bug in document ingestion**
- Backend Agent: Fix DocumentsService ingest method
- RAG Service Agent (if needed): Update indexing logic
- Add tests for the fix

---

## When in Doubt

1. **Check current status** — which parts are MVP vs. todo?
   → Read the "Project Overview" section in `.github/copilot-instructions.md`

2. **Understand data flow** — how does a query flow through the system?
   → Trace: Frontend → Backend API → RagService.query() → Response

3. **Find examples** — how should new code look?
   → Read existing modules in `Backend/src/{documents,queries}/`

4. **Run locally** — does the implementation work?
   → `npm run dev --workspace=Backend` + test with curl/Frontend

5. **Check conventions** — what are the NestJS/Python patterns here?
   → Review "Conventions & Patterns" in `.github/copilot-instructions.md`
