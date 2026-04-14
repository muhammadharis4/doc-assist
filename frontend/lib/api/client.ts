import { ApiError } from "@/lib/types/api";

interface RequestOptions extends Omit<RequestInit, "body"> {
    body?: unknown;
}

const API_PREFIX = "/api";

/**
 * Runs a JSON HTTP request through the Next.js proxy and normalizes API errors.
 */
export async function apiRequest<T>(
    path: string,
    options: RequestOptions = {},
): Promise<T> {
    const response = await fetch(`${API_PREFIX}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers ?? {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const payload = await readJson(response);

    if (!response.ok) {
        throw new ApiError(
            response.status,
            extractErrorMessage(payload, response.statusText),
            payload,
        );
    }

    return payload as T;
}

/**
 * Converts filter values into a stable query string.
 */
export function toQueryString(
    query: Record<string, string | number | undefined>,
) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== "") {
            params.set(key, String(value));
        }
    }

    const built = params.toString();
    return built ? `?${built}` : "";
}

async function readJson(response: Response): Promise<unknown> {
    if (response.status === 204) {
        return null;
    }

    const text = await response.text();
    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text) as unknown;
    } catch {
        return { message: text };
    }
}

function extractErrorMessage(payload: unknown, fallback: string): string {
    if (typeof payload === "string" && payload.trim()) {
        return payload;
    }

    if (
        typeof payload === "object" &&
        payload !== null &&
        "message" in payload
    ) {
        const message = (payload as { message?: unknown }).message;

        if (Array.isArray(message)) {
            return message.join(", ");
        }

        if (typeof message === "string" && message.trim()) {
            return message;
        }
    }

    return fallback || "Request failed";
}
