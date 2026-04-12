# DocAssist Monorepo

A comprehensive RAG-powered documentation assistant that helps developers find answers by searching through company documentation using natural language.

## 📁 Project Structure

```
doc-assist/
├── Backend/          # NestJS API server (Node.js)
├── RAG/              # Retrieval-Augmented Generation service (Python + FastAPI)
├── Frontend/         # User-facing web interface (Node.js)
├── .github/          # GitHub configuration & workspace instructions
├── package.json      # npm workspaces config (Backend + Frontend only)
└── .gitignore        # Root-level .gitignore
```

**Note:** Backend and Frontend are Node.js workspaces managed by npm. RAG is a separate Python service.

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9 (supports workspaces)

### Installation & Development

**Node.js Workspaces (Backend + Frontend):**

```bash
# Install dependencies
npm install

# Start the backend in watch mode
npm run dev

# Build all packages
npm run build

# Run all tests
npm test

# Format and lint
npm run format
npm run lint
```

**Python Service (RAG):**

```bash
cd RAG
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start RAG service
uvicorn app.main:app --reload
```

### Database Setup

The backend uses Prisma + SQLite. On first run or after schema changes:

````bash
# Generate Prisma client and run migrations
### npm Workspaces (Backend + Frontend)

```bash
# Run a command in a specific workspace
npm run <script> --workspace=Backend
npm run <script> --workspace=Frontend

# Run command in all workspaces
npm run <script> --workspaces
````

### Python Service (RAG)

````bash
cd RAG
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m pytestithub/copilot-instructions.md)** — Architecture, conventions, and development guide
- **[Backend README](Backend/README.md)** — API endpoints and setup
- **[RAG README](RAG/README.md)** — Retrieval service (placeholder)
- **[Frontend README](Frontend/README.md)** — UI setup (placeholder)

## 🔧 Commands

```bash
# Node.js workspaces (Backend + Frontend)
npm run <script> --workspace=Backend
npm run <script> --workspace=Frontend
npm run <script> --workspaces

# Python service (RAG) - managed separately
cd RAG
# Set up virtual environment and install when ready
````

## 📂 Services

### Backend (`/Backend`)

- NestJS REST API
- Document ingestion endpoints
- Query answering endpoints
- Query history tracking with source attribution
- Prisma ORM for SQLite database
- RAG service boundary (configurable external or local retrieval)

**Key Commands:**

```bash
npm run start:dev --workspace=Backend   # Watch-mode development
npm run build --workspace=Backend       # Build for production
npm test --workspace=Backend            # Run tests
```

**Environment Variables:**

- `PORT` — Server port (default: 3000)
- `DATABASE_URL` — SQLite connection string (default: `file:./prisma/dev.db`)
- `RAG_SERVICE_URL` — External RAG service endpoint (optional; uses local fallback if not set)

### RAG (`/RAG`)

_Placeholder for future RAG implementation_

Will handle:

- Vector embeddings and indexing
- Document retrieval and ranking
- Answer generation (LLM integration)
- External RAG service connectivity

### Frontend (`/Frontend`)

\_Placeholdeis a **polyglot monorepo** with:

1. **Backend** (Node.js) — NestJS API with modules (Documents, Queries, RAG boundary, Prisma)
2. **RAG Service** (Python) — FastAPI service for embeddings, retrieval, and LLM integration
3. **Frontend** (Node.js) — React/Next.js client consuming the Backend API

**Integration:**

- Backend → calls RAG service via HTTP (or uses local fallback)
- Frontend → calls Backend REST API
- All services share a single git history but use independent package managers (npm for Node.js, pip for Python)
- Saved queries

## 📖 Architecture

The system follows a modular monorepo structure:

1. **Backend** — NestJS modules (Documents, Queries, RAG, Prisma)
2. **RAG Service** — Configurable boundary for answer generation (external or local)
3. **Frontend** — React/Next.js client consuming the Backend API

All packages share a common git history and can be developed independently with unified command structure.

## RAG Service:\*\* FastAPI, Pydantic, Python 3.9+

- **Frontend:** React/Next.js, TypeScript (TBD)
- **Tests:** Jest (Node.js), Pytest (Python)
- **Code Quality:** ESLint, Prettier (Node.js), Black, Ruff (Python)
- **Package Management:** npm workspaces (Node.js), pip (Python)ypeScript
- **Tests:** Jest, Supertest
- **Code Quality:** ESLint, Prettier
- **Package Management:** npm workspaces

## 🔄 Development Workflow

1. **Create a feature branch:** `git checkout -b feature/your-feature`
2. **Make changes** in one or more workspaces
3. **Test locally:** `npm test --workspace=Backend` (or all: `npm test --workspaces`)

### Node.js Services (Backend + Frontend)

```bash
npm run build                       # Build both
npm run build --workspace=Backend   # Build Backend → dist/
npm run build --workspace=Frontend  # Build Frontend → .next/ or build/
```

### Python Service (RAG)

```bash
cd RAG
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 5000
```

Deploy each service to your hosting platform (Docker, Heroku, AWS, GCP, etc.)
npm run build --workspace=Backend # Creates Backend/dist
npm run build --workspace=Frontend # Creates Frontend/.next or build/

```

Deploy to your hosting platform of choice using the compiled outputs.

## 🤝 Contributing

- Follow the conventions in [.github/copilot-instructions.md](.github/copilot-instructions.md)
- Add tests for new features
- Run `npm run format:all` before committing
- Reference the [Backend Architecture](Backend/README.md) for module patterns

## 📄 License

UNLICENSED

---

For detailed workspace instructions and architecture decisions, see [.github/copilot-instructions.md](.github/copilot-instructions.md).
```
