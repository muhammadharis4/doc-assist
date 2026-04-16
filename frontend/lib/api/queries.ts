import {
    DEFAULT_HISTORY_LIMIT,
    type ExecuteQueryInput,
    type QueryHistoryItem,
    type SavedQueryItem,
} from "@/lib/types/queries";

/**
 * Executes a natural-language query through the backend.
 */
export function executeQuery(
    input: ExecuteQueryInput,
): Promise<QueryHistoryItem> {
    return fetchJson<QueryHistoryItem>("/api/queries", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

/**
 * Returns recent query history.
 */
export async function getQueryHistory(
    limit = DEFAULT_HISTORY_LIMIT,
): Promise<QueryHistoryItem[]> {
    const response = await fetch(`/api/queries/history?limit=${limit}`, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(
            await readErrorMessage(response, "Failed to load query history."),
        );
    }

    return (await response.json()) as QueryHistoryItem[];
}

/**
 * Returns all saved queries.
 */
export async function getSavedQueries(): Promise<SavedQueryItem[]> {
    const response = await fetch("/api/queries/saved", {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(
            await readErrorMessage(response, "Failed to load saved queries."),
        );
    }

    return (await response.json()) as SavedQueryItem[];
}

/**
 * Saves a query for future reuse.
 */
export function saveQuery(
    title: string,
    query: string,
): Promise<SavedQueryItem> {
    return fetchJson<SavedQueryItem>("/api/queries/saved", {
        method: "POST",
        body: JSON.stringify({ title, query }),
    });
}

/**
 * Removes a saved query by id.
 */
export function deleteSavedQuery(id: string): Promise<SavedQueryItem> {
    return fetchJson<SavedQueryItem>(`/api/queries/saved/${id}`, {
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
        throw new Error(await readErrorMessage(response, "Request failed."));
    }

    return (await response.json()) as T;
}

async function readErrorMessage(
    response: Response,
    fallbackMessage: string,
): Promise<string> {
    try {
        const payload = (await response.json()) as {
            message?: string | string[];
        };

        if (Array.isArray(payload.message) && payload.message.length > 0) {
            return payload.message.join(" ");
        }

        if (typeof payload.message === "string" && payload.message.trim()) {
            return payload.message;
        }
    } catch {
        return fallbackMessage;
    }

    return fallbackMessage;
}
