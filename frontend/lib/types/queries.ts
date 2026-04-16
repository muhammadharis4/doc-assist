export interface QuerySource {
    id?: string;
    documentId: string | null;
    snippet: string;
    score: number | null;
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
}

export interface SavedQueryItem {
    id: string;
    title: string;
    query: string;
    userId: string | null;
    createdAt: string;
}

export const MAX_QUERY_LENGTH = 2000;
export const DEFAULT_HISTORY_LIMIT = 20;
