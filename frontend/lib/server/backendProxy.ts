import { NextResponse } from "next/server";

const BACKEND_API_URL_ENV = "BACKEND_API_URL";

/**
 * Resolves the backend API origin from server-side environment configuration.
 */
export function getBackendApiUrl(): string {
    const value = process.env[BACKEND_API_URL_ENV]?.trim();

    if (!value) {
        throw new Error(`${BACKEND_API_URL_ENV} is not configured.`);
    }

    return value.endsWith("/") ? value.slice(0, -1) : value;
}

/**
 * Forwards a request to backend and preserves JSON body and status code.
 */
export async function proxyToBackend(
    path: string,
    init: RequestInit,
): Promise<NextResponse> {
    try {
        const backendUrl = `${getBackendApiUrl()}${path}`;
        const response = await fetch(backendUrl, {
            ...init,
            cache: "no-store",
        });

        const rawBody = await response.text();
        const headers = new Headers();
        headers.set(
            "Content-Type",
            response.headers.get("Content-Type") ?? "application/json",
        );

        return new NextResponse(rawBody, {
            status: response.status,
            headers,
        });
    } catch (error: unknown) {
        const message =
            error instanceof Error
                ? error.message
                : "Unable to reach backend service.";

        return NextResponse.json({ message }, { status: 502 });
    }
}
