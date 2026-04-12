# DocAssist Monorepo

A comprehensive RAG-powered documentation assistant that helps developers find answers by searching through company documentation using natural language.

## 📁 Project Structure

```
doc-assist/
├── Backend/          # NestJS API server
├── RAG/              # Retrieval-Augmented Generation service
├── Frontend/         # User-facing web interface
├── .github/          # GitHub configuration & workspace instructions
└── package.json      # Root monorepo workspace configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9 (supports workspaces)

### Installation & Development

```bash
# Install all dependencies for all workspaces
npm install

# Start the backend in watch mode
npm run dev

# Build all packages
npm run build:all

# Run all tests
npm run test:all

# Format and lint all packages
npm run lint:all
npm run format:all
```

### Database Setup

The backend uses Prisma + SQLite. On first run or after schema changes:

```bash
# Generate Prisma client and run migrations
npx prisma migrate deploy --schema=Backend/prisma/schema.prisma
```

## 📚 Documentation

- **[Backend Instructions](.github/copilot-instructions.md)** — Architecture, conventions, and development guide
- **[Backend README](Backend/README.md)** — API endpoints and setup
- **[RAG README](RAG/README.md)** — Retrieval service (placeholder)
- **[Frontend README](Frontend/README.md)** — UI setup (placeholder)

## 🔧 Workspace Commands

```bash
# Run a command in a specific workspace
npm run <script> --workspace=Backend
npm run <script> --workspace=RAG
npm run <script> --workspace=Frontend

# Run command in all workspaces
npm run <script> --workspaces
```

## 🗂️ What Each Workspace Does

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
*Placeholder for future RAG implementation*

Will handle:
- Vector embeddings and indexing
- Document retrieval and ranking
- Answer generation (LLM integration)
- External RAG service connectivity

### Frontend (`/Frontend`)
*Placeholder for future UI implementation*

Will provide:
- Search interface for documentation
- Query results with source attribution
- Query history
- Saved queries

## 📖 Architecture

The system follows a modular monorepo structure:

1. **Backend** — NestJS modules (Documents, Queries, RAG, Prisma)
2. **RAG Service** — Configurable boundary for answer generation (external or local)
3. **Frontend** — React/Next.js client consuming the Backend API

All packages share a common git history and can be developed independently with unified command structure.

## 🛠️ Technologies

- **Backend:** NestJS, Prisma, SQLite, TypeScript
- **Tests:** Jest, Supertest
- **Code Quality:** ESLint, Prettier
- **Package Management:** npm workspaces

## 🔄 Development Workflow

1. **Create a feature branch:** `git checkout -b feature/your-feature`
2. **Make changes** in one or more workspaces
3. **Test locally:** `npm test --workspace=Backend` (or all: `npm test --workspaces`)
4. **Format code:** `npm run format:all`
5. **Commit and push:** Git tracks the entire monorepo

## 🚀 Deployment

Each workspace can be built independently:

```bash
npm run build --workspace=Backend    # Creates Backend/dist
npm run build --workspace=Frontend   # Creates Frontend/.next or build/
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
