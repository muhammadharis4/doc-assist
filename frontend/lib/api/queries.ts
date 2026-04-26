import {
    DEFAULT_HISTORY_LIMIT,
    type ExecuteQueryInput,
    type QueryHistoryItem,
} from "@/lib/types/queries";

/**
 * Runs one full RAG query and returns the completed answer (no streaming).
 * Uses `POST /api/queries` and normalizes the history row you get back.
 * @param input - User question and optional model flags (see `ExecuteQueryInput`).
 * @returns A resolved `QueryHistoryItem` including the answer and `sources` (normalized to an array).
 */
export function executeQuery(
    input: ExecuteQueryInput,
): Promise<QueryHistoryItem> {
    return fetchJson<QueryHistoryItem>("/api/queries", {
        method: "POST",
        body: JSON.stringify(input),
    }).then(normalizeQueryHistoryItem);
}

/**
 * Optional callbacks for `streamQuery` SSE events.
 */
interface StreamQueryHandlers {
    /** Fired for each `token` event with a text delta. */
    onToken?: (delta: string) => void;
    /** Fired when the server sends `done` with the final `QueryHistoryItem`. */
    onDone?: (item: QueryHistoryItem) => void;
}

/**
 * POSTs a streaming query to `/api/queries/stream` and parses `text/event-stream` chunks.
 * Invokes `onToken` for streamed answer text and `onDone` with the final history row.
 * @param input - User question and options (see `ExecuteQueryInput`).
 * @param handlers - Optional `onToken` / `onDone` hooks.
 * @returns Resolves when the stream ends; throws if the request fails or an `error` event is received.
 */
export async function streamQuery(
    input: ExecuteQueryInput,
    handlers: StreamQueryHandlers,
): Promise<void> {
    const response = await fetch("/api/queries/stream", {
        method: "POST",
        body: JSON.stringify(input),
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Request failed."));
    }

    if (!response.body) {
        throw new Error("Streaming is not supported in this browser.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { value, done } = await reader.read();
        if (done) {
            break;
        }

        buffer += decoder.decode(value, { stream: true });

        let separatorIndex = buffer.indexOf("\n\n");
        while (separatorIndex >= 0) {
            const rawEvent = buffer.slice(0, separatorIndex);
            buffer = buffer.slice(separatorIndex + 2);
            const event = parseSseEvent(rawEvent);

            if (event?.event === "token") {
                handlers.onToken?.(String(event.data.delta ?? ""));
            } else if (event?.event === "done") {
                handlers.onDone?.(
                    normalizeQueryHistoryItem(
                        event.data as unknown as QueryHistoryItem,
                    ),
                );
            } else if (event?.event === "error") {
                throw new Error(
                    typeof event.data?.message === "string"
                        ? event.data.message
                        : "Streaming query failed.",
                );
            }

            separatorIndex = buffer.indexOf("\n\n");
        }
    }
}

/**
 * Loads past questions and answers for the chat history UI.
 * Calls `GET /api/queries/history` and normalizes each row’s `sources` field.
 * @param limit - Max number of items (defaults to `DEFAULT_HISTORY_LIMIT` from types).
 * @returns Normalized `QueryHistoryItem` rows, each with a safe `sources` array.
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

    const payload = (await response.json()) as QueryHistoryItem[];
    return payload.map(normalizeQueryHistoryItem);
}

/**
 * Permanently removes one history entry from the server (sidebar “delete” action).
 * Issues `DELETE /api/queries/history/{id}`.
 * @param id - History row id.
 * @returns Resolves on success; throws with a best-effort message on HTTP error.
 */
export async function deleteQueryHistory(id: string): Promise<void> {
    const response = await fetch(`/api/queries/history/${id}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        throw new Error(
            await readErrorMessage(response, "Failed to delete chat history."),
        );
    }
}

/**
 * Internal helper: typed JSON `fetch` to an app route, with JSON content-type for string bodies.
 * @param path - App-relative path (e.g. `/api/queries`).
 * @param init - Standard `RequestInit` (e.g. `method`, `body`).
 * @returns Parsed JSON cast to `T`, or throws if the response is not OK.
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
        throw new Error(await readErrorMessage(response, "Request failed."));
    }

    return (await response.json()) as T;
}

/**
 * Extracts an error message from a failed HTTP response’s JSON body when the server sends one.
 * @param response - Failed `Response` from `fetch`.
 * @param fallbackMessage - String used if JSON is missing or invalid.
 * @returns A single user-facing string.
 */
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

/**
 * Hardens API data before the UI uses it: always provide an array for `sources`, even if missing.
 * @param item - Raw or partial `QueryHistoryItem`.
 * @returns A copy of `item` with `sources` as an array.
 */
function normalizeQueryHistoryItem(item: QueryHistoryItem): QueryHistoryItem {
    return {
        ...item,
        sources: Array.isArray(item.sources) ? item.sources : [],
    };
}

/**
 * Parses one SSE `event:` + `data:` block (as used in `streamQuery`).
 * @param rawEvent - Text between double newlines in the stream.
 * @returns `{ event, data }` with `data` as parsed JSON, or `null` if empty; non-JSON `data` becomes `{ message: raw }`.
 */
function parseSseEvent(
    rawEvent: string,
): { event: string; data: Record<string, unknown> } | null {
    const lines = rawEvent.split(/\r?\n/);
    let event = "message";
    const dataLines: string[] = [];

    for (const line of lines) {
        if (line.startsWith("event:")) {
            event = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trimStart());
        }
    }

    if (dataLines.length === 0) {
        return null;
    }

    const rawData = dataLines.join("\n");

    try {
        return {
            event,
            data: JSON.parse(rawData) as Record<string, unknown>,
        };
    } catch {
        return {
            event,
            data: { message: rawData },
        };
    }
}
