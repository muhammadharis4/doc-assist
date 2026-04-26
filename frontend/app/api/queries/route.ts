/**
 * Proxies non-streaming query execution to the backend `POST /queries`.
 */
import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/server/backend";

/**
 * Runs a one-shot (non-streaming) RAG query on the backend and returns its answer.
 * @param request - Encodes the user’s question and options as JSON, passed through unchanged.
 * @returns Proxied `Response` from the Python API.
 */
export async function POST(request: NextRequest): Promise<Response> {
    const body = await request.text();
    return proxyRequest("/queries", {
        method: "POST",
        body,
        headers: {
            "Content-Type": "application/json",
        },
    });
}
