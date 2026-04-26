/**
 * Proxies chat history listing to the backend `GET /queries/history`.
 */
import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/server/backend";

/**
 * Fetches a page of past chat Q&A entries from the backend, honoring `?limit=`.
 * @param request - Incoming URL; the `limit` search param is forwarded (default `20` if absent).
 * @returns Proxied `Response` with a JSON array of history items.
 */
export async function GET(request: NextRequest): Promise<Response> {
    const limit = request.nextUrl.searchParams.get("limit") ?? "20";
    return proxyRequest(`/queries/history?limit=${encodeURIComponent(limit)}`);
}
