# DocAssist Monorepo — Workspace Instructions

**For AI Agents:** These instructions describe the complete project context. Use this to understand architecture, conventions, and how to work on specific features with full project awareness.

## 🏗️ Monorepo Structure

```
Doc Assist/
├── Backend/              (NestJS + Prisma + SQLite)
│   ├── src/
│   │   ├── documents/    (Document ingestion)
│   │   ├── queries/      (Query execution & history)
│   │   ├── rag/          (RAG boundary - external or local)
│   │   ├── prisma/       (Database access)
│   │   └── app.module.ts (Root module wiring)
│   ├── prisma/           (Schema & migrations)
│   └── test/             (E2E tests)
├── Frontend/             (To be set up - React/Next.js)
├── RAG/                  (To be set up - Python FastAPI)
└── .github/copilot-instructions.md (This file)
```

**Current Implementation Status:**
- ✅ Backend: MVP complete (document ingest, query answering, history)
- ⏳ Frontend: Not started
- ⏳ RAG: Not started (currently using local fallback in Backend)
- ✅ Git: Unified monorepo (all services share one git history)

---

## 🚀 Getting Started (For Any Agent)ring
Read this in order:
1. **This file** (overall conventions)
2. **Backend/README.md** (current API surface)
3. **Backend/src/app.module.ts** (module wiring)
4. **Backend/prisma/schema.prisma** (data model)

### Running the Project
```bash
# Install Node.js dependencies
npm install

# Start Backend in watch mode
npm run dev

# Access API
curl http://localhost:3000/documents  # List documents
curl -X POST http://localhost:3000/documents -H "Content-Type: application/json" \
  -d '{"filename":"test.md","mimeType":"text/markdown","storagePath":"./test.md","extractedText":"test content"}'

# Run tests
npm test --workspace=Backend
```

### Repository Structure
Unified git at root level:
```bash
git status              # Shows all monorepo changes
git log --oneline       # View commit history (all services)
```

---

## Project Overview

**DocAssist** is an AI-powered documentation assistant that helps developers find answers by searching through company documentation using natural language (RAG—Retrieval-Augmented Generation).

**Core Features (Phase 1 MVP):**

- Document ingestion for uploaded files
- Query answering via external RAG service (with local fallback)
- Query history tracking with source attribution
- Configurable retrieval layer (external service via `RAG_SERVICE_URL` env var)

**Future Phases:**

- Phase 2: Analytics (unanswered questions, topic coverage, usage trends)
- Phase 3: Collaboration (workspaces, RBAC, approval workflows)
- Phase 4: Frontend & deployment (React/Next.js UI, Docker, observability)

**Current Status:** Backend MVP complete with working ingest → query → history flow.

---

### Module Organization

```
AppModule (root)
├── PrismaModule (global, @Global() decorator)
│   └── PrismaService (extends PrismaClient, singleton)
├── DocumentsModule
│   ├── DocumentsController  (@Controller('/documents'))
│   └── DocumentsService     (ingest, findAll, findOne, remove)
├── QueriesModule
│   ├── QueriesController    (@Controller('/queries'))
│   └── QueriesService       (executeQuery, getHistory, getSaved, createSaved)
└── RagModule
    ├── RagService           (query, indexDocument, deleteDocumentIndex)
    └── (provides RAG boundary: external service or local fallback)
```

### Dependency Injection Pattern

- **Constructor-based DI** with `private readonly` modifiers
- Services declare dependencies as constructor params; NestJS IoC resolves automatically
- Modules declare `imports: [...]` to make services available
- **Global PrismaModule** exported automatically; other modules import explicitly to pass DI checks
- Example:
    ```typescript
    constructor(
      private readonly prisma: PrismaService,
      private readonly ragService: RagService,
    ) {}
    ```

### Data Layer (Prisma)

**Models** ([prisma/schema.prisma](Backend/prisma/schema.prisma)):

- `Document`: filename, mimeType, storagePath, extractedText, project, category, version
- `QueryHistory`: query, answer, userId, sources (nested relation)
- `QuerySource`: links QueryHistory → Document with snippet scoring
- `SavedQuery`: title, query, userId

**Pattern:** Services call `this.prisma.<model>.method()` directly (inline queries, no repository pattern).

**Lifecycle:** PrismaService connects on app init, disconnects on destroy (via `OnModuleInit`/`OnModuleDestroy`).

---

## Conventions & Patterns

### Error Handling

- **Use NestJS built-in exceptions** for HTTP responses:
    - `BadRequestException` (400) for validation/input errors
    - `NotFoundException` (404) for missing resources
    - Throw immediately in service layer; NestJS converts to HTTP status codes

**Example:**

```typescript
if (!query.trim()) {
    throw new BadRequestException("query is required");
}
```

### DTOs & Validation

- **Pattern:** Export interfaces as `Create{Feature}Dto`, `Execute{Feature}Dto`, etc.
- **Type guards:** Validate input types (e.g., `typeof data.query === 'string'`) before trimming/parsing
- **Future:** Add `class-validator` decorators for declarative validation at controller boundaries

### Naming Conventions

| Entity          | Naming                | Example                                |
| --------------- | --------------------- | -------------------------------------- |
| Controllers     | `{Feature}Controller` | `DocumentsController`                  |
| Services        | `{Feature}Service`    | `DocumentsService`                     |
| Modules         | `{Feature}Module`     | `DocumentsModule`                      |
| DTOs            | Suffix `Dto`          | `CreateDocumentDto`, `ExecuteQueryDto` |
| Routes          | Lowercase plural      | `/documents`, `/queries`               |
| Database Models | PascalCase            | `Document`, `QueryHistory`             |

### Testing

- **Unit Test Files:** Colocated as `{feature}.spec.ts` (same directory as service/controller)
- **E2E Tests:** In `test/` directory matching pattern `*.e2e-spec.ts`
- **Mocking:** Use `jest.fn()` to mock Prisma and RagService; instantiate services directly for unit tests
- **Coverage:** Services should have ≥1 test per public method; controllers tested via `@nestjs/testing` Test module

---

## Development Workflows

### Setup & Running

```bash
# Install dependencies
npm install  # or: bun install

# Database setup (if needed)
npx prisma migrate deploy

# Start development server (watch mode)
npm run start:dev

# Build for production
npm run build

# Run tests
npm run test           # run once
npm run test:watch    # watch mode
npm run test:cov      # with coverage
npm run test:e2e      # end-to-end
```

### Adding a New Feature

1. **Extend Prisma schema** ([prisma/schema.prisma](Backend/prisma/schema.prisma)) if new data required
2. **Create migration:** `npx prisma migrate dev --name feature_name`
3. **Create module folder:** `src/{feature}/`
4. **Create service:**
    - Declare DI dependencies in constructor
    - Use `this.prisma.<model>.*()` for data access
    - Throw `BadRequestException`/`NotFoundException` for errors
5. **Create controller:**
    - Declare service in constructor
    - Export DTOs from service
    - Route handlers: keep logic thin, delegate to service
6. **Create module:** Wire DI (imports, providers, controllers, exports)
7. **Add tests:**
    - Unit test for service
    - E2E test for controller flow (if flow is user-facing)
8. **Wire into AppModule:** Add `YourFeatureModule` to imports

### RAG Service Integration

The `RagService` provides a configurable boundary:

```typescript
// In environment variables or .env:
RAG_SERVICE_URL=https://your-rag-backend.com
```

**Behavior:**

- Attempts external service first (`RAG_SERVICE_URL`/query POST)
- Falls back to local Prisma-based retrieval if external unavailable
- Always tries to index documents to external service (if configured)

**Local Fallback:**

- Tokenizes query (3+ char terms, case-insensitive)
- Scores documents by term matches in filename/project/category/extractedText
- Returns top 3 matches with snippets + answer summary

**For External Service Integration:**

- Implement upstream service accepting `POST /query` and `POST /documents`
- Implement corresponding delete/index endpoints
- Return `{ answer: "...", sources: [{ documentId, filename, snippet, score }] }`

---

## Common Commands & Scripts

| Command                           | Purpose                        |
| --------------------------------- | ------------------------------ |
| `npm run start:dev`               | Watch-mode development server  |
| `npm run build`                   | Compile TypeScript → `dist/`   |
| `npm run test`                    | Run unit tests once            |
| `npm run test:watch`              | Run tests in watch mode        |
| `npm run test:cov`                | Run tests with coverage report |
| `npm run test:e2e`                | Run end-to-end tests           |
| `npm run lint`                    | ESLint check & fix             |
| `npm run format`                  | Prettier format (src + test)   |
| `npx prisma studio`               | Browse database in UI          |
| `npx prisma migrate dev --name X` | Create & run migration         |

---

## Key Files & Locations

| Path                                   | Purpose                                       |
| -------------------------------------- | --------------------------------------------- |
| `Backend/src/app.module.ts`            | Root module; imports all feature modules      |
| `Backend/src/main.ts`                  | Entry point; starts NestFactory               |
| `Backend/src/prisma/`                  | Prisma service & module                       |
| `Backend/src/{documents,queries,rag}/` | Feature modules (controller, service, module) |
| `Backend/prisma/schema.prisma`         | Database schema definition                    |
| `Backend/prisma/migrations/`           | SQL migration files                           |
| `Backend/test/`                        | E2E test files                                |
| `Backend/tsconfig.json`                | TypeScript config                             |
| `Backend/nest-cli.json`                | NestJS CLI config                             |
| `Backend/package.json`                 | Dependencies & scripts                        |

---

## Best Practices & Pitfalls

### ✅ Do

- **Validate input early:** Type-check + trim strings in service layer before DB/external calls
- **Use explicit error codes:** Throw `BadRequestException` for 400, `NotFoundException` for 404
- **Keep controllers thin:** Delegate business logic to services
- **Test public methods:** Each service method should have ≥1 unit test
- **Document DTOs:** Export interfaces with inline JSDoc for API consumers
- **Use async/await:** Avoid Promise `.then()` chains; use `async` methods
- **Check env vars safely:** Trim and validate `process.env.VAR` to avoid silent failures

### ❌ Avoid

- **Throwing generic `Error`:** Use NestJS exceptions (`BadRequestException`, `NotFoundException`)
- **Mixing data access & business logic:** Keep Prisma calls in services, not controllers
- **Unused dependencies:** Don't import modules/services if not needed; it bloats the DI container
- **Nullable types without null checks:** Always check `typeof x === 'string'` before calling `.trim()`
- **Hardcoded configuration:** Use environment variables for RAG_SERVICE_URL, DATABASE_URL, etc.
- **Skipping tests for "simple" code:** Even small services benefit from 1 focused test per method
- **Relying on external services without fallback:** RagService demonstrates graceful degradation

---

## Environment Variables

| Variable          | Purpose                                                  | Default                           |
| ----------------- | -------------------------------------------------------- | --------------------------------- |
| `PORT`            | HTTP server port                                         | `3000`                            |
| `DATABASE_URL`    | SQLite connection string (for Prisma)                    | `file:./prisma/dev.db`            |
| `RAG_SERVICE_URL` | External RAG backend URL (e.g., `http://localhost:5000`) | `undefined` (uses local fallback) |

**Note:** If `RAG_SERVICE_URL` is not set, the backend uses local document retrieval from Prisma.

---

## Future Roadmap (Phases 2–4)

| Phase                 | Features                                                      | Status     |
| --------------------- | ------------------------------------------------------------- | ---------- |
| **Phase 1 (Current)** | Document ingest, query answering, history tracking            | ✅ MVP     |
| **Phase 2**           | Analytics: unanswered questions, topic coverage, usage trends | 📋 Planned |
| **Phase 3**           | Workspaces, RBAC (admin/editor/viewer), approval workflows    | 📋 Planned |
| **Phase 4**           | Frontend UI, deployment, observability                        | 📋 Planned |

---

## Quick Onboarding Checklist

- [ ] Read this file end-to-end
- [ ] Run `npm install && npm run start:dev` and verify server starts on port 3000
- [ ] Test: POST `http://localhost:3000/documents` with sample document ingest payload
- [ ] Test: POST `http://localhost:3000/queries` with a sample query
- [ ] Run `npm run test` to verify suite passes
- [ ] Familiarize yourself with [Backend/prisma/schema.prisma](Backend/prisma/schema.prisma)
- [ ] Review an example service (e.g., [Backend/src/documents/documents.service.ts](Backend/src/documents/documents.service.ts)) to understand DI patterns
- [ ] Try adding a small feature: new endpoint or service method + test

---

## Questions & Support

If you encounter issues not covered here:

1. Check existing tests for usage patterns
2. Review Prisma docs (https://www.prisma.io/docs/)
3. Review NestJS docs (https://docs.nestjs.com/)
4. Look at similar feature modules in the codebase for patterns
