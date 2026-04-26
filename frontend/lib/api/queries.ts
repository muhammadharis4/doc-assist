import {
    DEFAULT_HISTORY_LIMIT,
    type ExecuteQueryInput,
    type QueryHistoryItem,
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
    }).then(normalizeQueryHistoryItem);
}

interface StreamQueryHandlers {
    onToken?: (delta: string) => void;
    onDone?: (item: QueryHistoryItem) => void;
}

/**
 * Streams a natural-language query through the backend.
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

    const payload = (await response.json()) as QueryHistoryItem[];
    return payload.map(normalizeQueryHistoryItem);
}

/**
 * Deletes one chat history entry through the backend via proxy.
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

function normalizeQueryHistoryItem(item: QueryHistoryItem): QueryHistoryItem {
    return {
        ...item,
        sources: Array.isArray(item.sources) ? item.sources : [],
    };
}

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
