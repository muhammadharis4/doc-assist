# DocAssist Project Prompts

Common prompts for working on the DocAssist monorepo. Use these as templates or examples when asking an AI agent to work on specific tasks.

## Backend Development

### Add a New Document Metadata Field
```
[Backend Agent] Add a "tags" field to the Document model:
1. Extend Backend/prisma/schema.prisma with tags (String array or relation)
2. Create a migration
3. Update DocumentsService.ingest() to accept tags
4. Update DocumentsController.ingest() to pass tags
5. Add a test for the new field
```

### Implement Document Search by Metadata
```
[Backend Agent] Add an endpoint GET /documents/search that:
1. Accepts query parameters: project, category, tag (optional)
2. Filters documents in DocumentsService
3. Returns matching documents
4. Add test coverage
```

### Improve RAG Service Boundary
```
[Backend Agent] Enhance Backend/src/rag/rag.service.ts to:
1. Add timeout handling for external RAG service calls
2. Implement exponential backoff on failure
3. Add logging for retrieval performance
4. Add tests for timeout/retry scenarios
```

### Database Migration
```
[Backend Agent] Create a Prisma migration that:
1. Updates Backend/prisma/schema.prisma with [specific changes]
2. Generates migration file: npx prisma migrate dev --name [name]
3. Verify migration runs without errors
4. Test the schema change works end-to-end
```

---

## Frontend Development

### Build Search Interface
```
[Frontend Agent] Create a search interface in Frontend/ that:
1. Has an input field for query text
2. Shows optional filters (project, category)
3. Has a submit button
4. Displays loading state while fetching
5. Shows results with answer and source links
6. Use Frontend framework: [React/Next.js]
```

### Add Query History Panel
```
[Frontend Agent] Build a query history component that:
1. Calls GET /queries/history from Backend
2. Displays recent queries in timeline format
3. Allows clicking to re-run a query
4. Shows query creation date
5. Optional: Add pagination or infinite scroll
```

### Implement Saved Queries
```
[Frontend Agent] Create saved queries feature:
1. Add "Save this query" button on results
2. Show saved queries in sidebar/panel
3. Allow deleting saved queries
4. Call Backend endpoints: POST/DELETE /queries/saved
5. Persist UI state between page refreshes
```

---

## RAG Service Development

### Set Up FastAPI Project
```
[RAG Service Agent] Initialize Python FastAPI project in RAG/:
1. Create . venv and install requirements
2. Set up project structure: app/main.py, app/models.py, app/api/
3. Implement /query and /documents endpoints
4. Use Pydantic for request/response models
5. Add startup/shutdown lifecycle
6. Configure CORS for Backend communication
```

### Implement Basic Document Indexing
```
[RAG Service Agent] Build document indexing pipeline:
1. Accept POST /documents with documentId, text, filename, project, category
2. Store documents in memory or simple file-based store
3. Implement vector embeddings (use OpenAI API or local model)
4. Return 200 OK on success
5. Add error handling for invalid inputs
```

### Implement Query Retrieval
```
[RAG Service Agent] Build query endpoint:
1. Accept POST /query with query string
2. Retrieve top matching documents (using BM25 or embeddings)
3. Return answer + sources in required format
4. Handle missing/empty results gracefully
5. Add logging for debugging
```

### Add LLM Integration
```
[RAG Service Agent] Integrate LLM for answer generation:
1. Accept API key via environment variable
2. Build prompt with query + retrieved documents
3. Call LLM (OpenAI, HuggingFace, local)
4. Parse and return answer
5. Add timeout and error handling
6. Cache answer for same query argument
```

---

## Data & Migrations

### Schema Change Workflow
```
[Backend Agent] Change Prisma schema:
1. Edit Backend/prisma/schema.prisma (add/modify model)
2. Run: npx prisma migrate dev --name feature_description
3. Review generated SQL in Backend/prisma/migrations/
4. Run: npm run test --workspace=Backend (verify no breakage)
5. Commit both schema and migration files
```

### Seed Test Data
```
[Backend Agent] Create a data seeder for testing:
1. Create Backend/prisma/seed.ts with sample documents & queries
2. Add "seed": "ts-node prisma/seed.ts" to Backend/package.json scripts
3. Allow seeding via npx prisma db seed
4. Document what seed data is created in seed.ts comments
```

---

## Testing

### Add Backend Unit Tests
```
[Backend Agent] Write unit tests for [FeatureName]Service:
1. Create src/[feature]/[feature].service.spec.ts
2. Mock Prisma and RagService dependencies
3. Test public methods (success and error cases)
4. Achieve >80% coverage for the service
5. Run: npm run test:cov --workspace=Backend
```

### Add E2E Tests
```
[Backend Agent] Create end-to-end test flow:
1. Create test/[feature].e2e-spec.ts
2. Test full request → service → response cycle
3. Use real database or test database
4. Clean up test data after each test
5. Run: npm run test:e2e --workspace=Backend
```

---

## Documentation & Maintenance

### Update Architecture Docs
```
[Monorepo Agent] Update .github/copilot-instructions.md:
1. Add or update section: [Title]
2. Include code examples if applicable
3. Explain the "why" behind the pattern
4. Reference relevant files
5. Ensure consistency with existing style
```

### Add GitHub Actions CI/CD
```
[Monorepo Agent] Create .github/workflows/ci.yml:
1. Run on push to main and pull requests
2. Test: npm test --workspaces + Backend tests
3. Lint: npm run lint --workspaces
4. Build: npm run build --workspaces
5. Optional: Run Backend E2E tests
```

---

## Bug Fixes & Improvements

### Fix a Known Issue
```
[Backend Agent] Fix the issue: [Issue Description]
1. Locate the root cause in [file path]
2. Implement a minimal fix (no scope creep)
3. Add a test that reproduces the original bug
4. Verify the test passes with the fix
5. Confirm no other tests break
6. Commit with clear message: "fix: [clear description]"
```

### Performance Optimization
```
[Backend Agent] Optimize [feature] performance:
1. Identify bottleneck (use profiling/logging)
2. Implement optimization in [service]
3. Benchmark before/after performance
4. Add test to prevent regression
5. Document the optimization in code comments
6. Do NOT sacrifice code clarity for minor gains
```

---

## Integration Testing

### Test Backend ↔ RAG Integration
```
[Monorepo Agent] Verify Backend and RAG service work together:
1. Start RAG service on port 5000
2. Set RAG_SERVICE_URL=http://localhost:5000 in Backend
3. Start Backend on port 3000
4. POST /documents with sample doc
5. POST /queries with test query
6. Verify answer comes from RAG service
7. Document the happy path
```

### Test Backend ↔ Frontend Integration
```
[Frontend Agent] Test Frontend communicates with Backend:
1. Start Backend on port 3000
2. Start Frontend on port 3000 (or configured port)
3. Test document ingestion flow
4. Test query execution flow
5. Verify results display correctly
6. Test error handling (empty results, network error)
7. Document manual test steps
```

---

## Deployment Checklist

### Prepare for Production
```
[Monorepo Agent] Prepare for deployment:
1. Update version numbers in package.json files
2. Create CHANGELOG documenting new features/fixes
3. Run full test suite: npm test --workspaces
4. Build all packages: npm run build --workspaces
5. Verify environment variables are documented
6. Create deployment guide
7. Tag git release: git tag v0.X.X
```

---

## Tips for Effective Prompts

1. **Specify the agent mode** — [Backend Agent], [Frontend Agent], [RAG Service Agent], [Monorepo Agent]
2. **Be specific** — State exactly what you want, not just intent
3. **Reference files** — Include relative paths to relevant files
4. **Include acceptance criteria** — What does "done" look like?
5. **Mention tests** — Expected tests or verification steps
6. **Clarify scope** — Don't ask to "improve everything"; focus on one feature

**Good example:**
```
[Backend Agent] Add file upload endpoint:
1. Create POST /documents/upload endpoint
2. Accept multipart/form-data with file
3. Extract text using [extraction library]
4. Call DocumentsService.ingest()
5. Return created document with 201 status
6. Add error handling for unsupported file types
7. Create test: src/documents/documents.upload.spec.ts
```

**Vague example (avoid):**
```
Make document uploads work better
```
