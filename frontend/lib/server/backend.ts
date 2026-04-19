const BACKEND_API_URL =
    process.env.BACKEND_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

/**
 * Builds a backend URL for server-side route handlers.
 */
export function backendUrl(path: string): string {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${BACKEND_API_URL}${normalized}`;
}

/**
 * Pass-through fetch helper used by Next.js API route handlers.
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
