import type {
    CreateDocumentInput,
    DocumentItem,
    DocumentListParams,
} from "@/types/documents";

function listParamsToSearchParams(params?: DocumentListParams): URLSearchParams {
    const search = new URLSearchParams();
    if (!params) {
        return search;
    }
    if (params.q?.trim()) {
        search.set("q", params.q.trim());
    }
    if (params.documentType) {
        search.set("document_type", params.documentType);
    }
    if (params.status) {
        search.set("status", params.status);
    }
    if (params.tag?.trim()) {
        search.set("tag", params.tag.trim());
    }
    if (params.createdFrom?.trim()) {
        search.set("created_from", params.createdFrom.trim());
    }
    if (params.createdTo?.trim()) {
        search.set("created_to", params.createdTo.trim());
    }
    return search;
}

/**
 * Fetches documents from the Next API (`GET /api/documents`) with optional filters.
 * @param params - Optional list filters (filename, type, status/inbox, tag, dates).
 * @returns Parsed `DocumentItem[]`; throws a generic `Error` if the request fails.
 */
export async function listDocuments(
    params?: DocumentListParams,
): Promise<DocumentItem[]> {
    const qs = listParamsToSearchParams(params).toString();
    const url = qs ? `/api/documents?${qs}` : "/api/documents";
    const response = await fetch(url, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("Failed to load documents.");
    }

    return (await response.json()) as DocumentItem[];
}

/**
 * Persists a new document (text + metadata) through the Next API (`POST /api/documents`).
 * @param input - `CreateDocumentInput` (content, type, filename, optional tags).
 * @param file - Original file to store next to the text so it can be opened later.
 * @returns The created `DocumentItem`.
 */
export async function createDocument(
    input: CreateDocumentInput,
    file?: File,
): Promise<DocumentItem> {
    const document = await fetchJson<DocumentItem>(`/api/documents`, {
        method: "POST",
        body: JSON.stringify(input),
    });
    if (file) {
        // Keep the original so citations can open it later.
        await fetch(`/api/documents/${document.id}/file`, { method: "PUT", body: file });
    }
    return document;
}

/**
 * Replaces tags on an existing document (`PATCH /api/documents/:id`).
 * @param id - Document id.
 * @param tags - Full tag list to store (may be empty).
 */
export function patchDocumentTags(
    id: string,
    tags: string[],
): Promise<DocumentItem> {
    return fetchJson<DocumentItem>(`/api/documents/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ tags }),
    });
}

/** Best-effort message from `/api/documents/extract` error JSON (FastAPI `detail`, etc.). */
async function parseExtractErrorDetail(response: Response): Promise<string | null> {
    const ct = response.headers.get("content-type");
    if (!ct?.includes("application/json")) {
        return response.statusText || `HTTP ${response.status}`;
    }
    try {
        const data = (await response.json()) as {
            detail?: unknown;
            message?: string;
        };
        if (typeof data.message === "string" && data.message.trim()) {
            return data.message.trim();
        }
        const d = data.detail;
        if (typeof d === "string" && d.trim()) {
            return d.trim();
        }
        if (Array.isArray(d) && d.length > 0) {
            const first = d[0] as { msg?: string };
            if (typeof first?.msg === "string" && first.msg.trim()) {
                return first.msg.trim();
            }
        }
    } catch {
        // ignore malformed JSON
    }
    return null;
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
        const detail = await parseExtractErrorDetail(response);
        throw new Error(detail ?? "Failed to extract PDF text.");
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
