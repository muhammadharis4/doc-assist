# RAG Service (Retrieval-Augmented Generation)

This folder contains the RAG backend service for DocAssist. It handles:

- Document indexing and vector embeddings
- Query-document retrieval and ranking
- Answer generation (integration with LLM)
- Integration with external RAG services

## Setup

```bash
npm install --workspace=RAG
npm run dev --workspace=RAG
```

## Future Implementation

- [ ] Vector database setup (Pinecone, Weaviate, or local)
- [ ] Embedding service (OpenAI, Hugging Face, local)
- [ ] Question-answering pipeline
- [ ] API service for the backend
