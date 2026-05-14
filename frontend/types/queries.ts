export interface QuerySource {
    id?: string;
    documentId: string | null;
    snippet: string;
}

export interface QueryHistoryItem {
    id: string;
    query: string;
    answer: string | null;
    userId: string | null;
    createdAt: string;
    sources: QuerySource[];
}

export interface ExecuteQueryInput {
    query: string;
    userId?: string | null;
    /** When false, the backend answers without document retrieval. */
    ragEnabled?: boolean;
    /** Hybrid retrieval depth (1–20); omit to use server default. */
    topK?: number;
    /** LLM sampling temperature (0–1). */
    temperature?: number;
}

export const MAX_QUERY_LENGTH = 2000;
export const DEFAULT_HISTORY_LIMIT = 20;
