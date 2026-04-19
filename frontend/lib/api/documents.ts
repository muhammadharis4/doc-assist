import type { CreateDocumentInput, DocumentItem } from "@/lib/types/documents";

/**
 * Fetches uploaded documents from the backend via proxy.
 */
export async function listDocuments(): Promise<DocumentItem[]> {
    const response = await fetch(`/api/documents`, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("Failed to load documents.");
    }

    return (await response.json()) as DocumentItem[];
}

/**
 * Creates a document record in the backend via proxy.
 */
export function createDocument(
    input: CreateDocumentInput,
): Promise<DocumentItem> {
    return fetchJson<DocumentItem>(`/api/documents`, {
        method: "POST",
        body: JSON.stringify(input),
    });
}

/**
 * Extracts text from one PDF through the backend OCR endpoint.
 */
export async function extractPdfText(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file, file.name);

    const response = await fetch(`/api/documents/extract`, {
        method: "POST",
        body: form,
    });

    if (!response.ok) {
        throw new Error("Failed to extract PDF text.");
    }

    const payload = (await response.json()) as { text?: string };
    return typeof payload.text === "string" ? payload.text : "";
}

/**
 * Deletes a document by id from the backend via proxy.
 */
export function deleteDocument(id: string): Promise<DocumentItem> {
    return fetchJson<DocumentItem>(`/api/documents/${id}`, {
        method: "DELETE",
    });
}

async function fetchJson<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(path, {
        ...init,
        headers: {
            ...(typeof init.body === "string"
                ? { "Content-Type": "application/json" }
                : {}),
            ...(init.headers ?? {}),
        },
    });

    if (!response.ok) {
        throw new Error("Request failed.");
    }

    return (await response.json()) as T;
}
