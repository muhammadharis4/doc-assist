/** Base URL of the Python API (no trailing slash). */
const BACKEND_API_URL =
    process.env.BACKEND_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

/**
 * Joins the configured backend origin with a path for Next.js route proxying.
 * @param path - Path beginning with or without `/` (e.g. `documents` or `/documents`).
 * @returns Absolute URL string (`BACKEND_API_URL` + normalized path).
 */
export function backendUrl(path: string): string {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${BACKEND_API_URL}${normalized}`;
}

/**
 * Forwards a request to the configured backend and returns a new `Response` with the same body and headers.
 * Used by `app/api/**` route handlers to avoid duplicating the backend base URL in each file.
 * @param path - Backend path (e.g. `/queries`).
 * @param init - Optional `RequestInit` merged into `fetch` (method, body, headers).
 * @returns A fresh `Response` streaming the backend body; always `no-store` cached.
 */
export async function proxyRequest(
    path: string,
    init?: RequestInit,
): Promise<Response> {
    const response = await fetch(backendUrl(path), {
        ...init,
        cache: "no-store",
    });

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
            ...Object.fromEntries(response.headers.entries()),
        },
    });
}
