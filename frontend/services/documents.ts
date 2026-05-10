import type { CreateDocumentInput, DocumentItem } from "@/types/documents";

/**
 * Fetches the user’s document list and indexing status from the Next API (`GET /api/documents`).
 * @returns Parsed `DocumentItem[]`; throws a generic `Error` if the request fails.
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
 * Persists a new document (text + metadata) through the Next API (`POST /api/documents`).
 * @param input - `CreateDocumentInput` (content, type, filename, etc.).
 * @returns The created `DocumentItem`.
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
 * Extracts plain text from a PDF via the app’s extract endpoint (used when staging uploads).
 * @param file - PDF `File` from an input or drag-and-drop.
 * @returns Extracted `text` string, or `""` if the payload omits `text`.
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
 * Removes a document by id and returns the API’s last snapshot of that row.
 * @param id - Document id to delete.
 * @returns `DocumentItem` from the API response.
 */
export function deleteDocument(id: string): Promise<DocumentItem> {
    return fetchJson<DocumentItem>(`/api/documents/${id}`, {
        method: "DELETE",
    });
}

/**
 * Internal helper: JSON `fetch` to an app API route, with a generic response body.
 * @param path - App-relative path.
 * @param init - `RequestInit` (e.g. `method`, `body`).
 * @returns Parsed JSON as `T`, or throws `"Request failed."` on non-OK.
 */
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
