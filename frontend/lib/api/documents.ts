import { apiRequest, toQueryString } from "@/lib/api/client";
import type {
    CreateDocumentInput,
    DocumentFilters,
    DocumentItem,
} from "@/lib/types/documents";

/**
 * Fetches documents with pagination and optional filters.
 */
export function listDocuments(
    filters: DocumentFilters,
): Promise<DocumentItem[]> {
    return apiRequest<DocumentItem[]>(
        `/documents${toQueryString({
            skip: filters.skip,
            take: filters.take,
            project: filters.project,
            category: filters.category,
            keyword: filters.keyword,
        })}`,
    );
}

/**
 * Creates a document record in Backend via Next.js proxy.
 */
export function createDocument(
    input: CreateDocumentInput,
): Promise<DocumentItem> {
    return apiRequest<DocumentItem>("/documents", {
        method: "POST",
        body: input,
    });
}

/**
 * Deletes a document by id via Next.js proxy.
 */
export function deleteDocument(id: string): Promise<DocumentItem> {
    return apiRequest<DocumentItem>(`/documents/${id}`, {
        method: "DELETE",
    });
}
