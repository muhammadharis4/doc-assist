/**
 * Proxies streaming query execution to the backend `POST /queries/stream` (SSE).
 */
import { NextRequest } from "next/server";
import { proxyRequest } from "@/services/server/backend";

/**
 * Starts a streaming RAG query (SSE) on the backend and returns the same byte stream.
 * @param request - JSON body with the question, forwarded to the stream endpoint.
 * @returns Proxied streaming `Response` (typically `text/event-stream`).
 */
export async function POST(request: NextRequest): Promise<Response> {
    const body = await request.text();
    return proxyRequest("/queries/stream", {
        method: "POST",
        body,
        headers: {
            "Content-Type": "application/json",
        },
    });
}
