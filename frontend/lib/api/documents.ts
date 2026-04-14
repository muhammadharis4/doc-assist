import type { CreateDocumentInput, DocumentItem } from "@/lib/types/documents";

const API_BASE_URL = "http://localhost:3000";

/**
 * Fetches uploaded documents through the Next.js API rewrite.
 */
export async function listDocuments(): Promise<DocumentItem[]> {
    const response = await fetch(`${API_BASE_URL}/documents`, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("Failed to load documents.");
    }

    return (await response.json()) as DocumentItem[];
}

/**
 * Creates a document record through the Next.js API rewrite.
 */
export function createDocument(
    input: CreateDocumentInput,
): Promise<DocumentItem> {
    return fetchJson<DocumentItem>(`${API_BASE_URL}/documents`, {
        method: "POST",
        body: JSON.stringify(input),
    });
}

/**
 * Deletes a document by id through the Next.js API rewrite.
 */
export function deleteDocument(id: string): Promise<DocumentItem> {
    return fetchJson<DocumentItem>(`${API_BASE_URL}/documents/${id}`, {
        method: "DELETE",
    });
}

async function fetchJson<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(path, {
        ...init,
        headers: {
            ...(init.body ? { "Content-Type": "application/json" } : {}),
            ...(init.headers ?? {}),
        },
    });

    if (!response.ok) {
        throw new Error("Request failed.");
    }

    return (await response.json()) as T;
}
