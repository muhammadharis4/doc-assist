/**
 * Proxies document list (`GET /documents`) and create (`POST /documents`) to the backend.
 */
import { NextRequest } from "next/server";
import { proxyRequest } from "@/services/server/backend";

/**
 * Forwards a list request to the Python backend and returns the same response.
 * @returns Proxied `GET /documents` JSON list.
 */
export async function GET(): Promise<Response> {
    return proxyRequest("/documents");
}

/**
 * Creates a document on the Python backend with the same JSON body the client sent.
 * @param request - New document metadata and content as JSON in the request body.
 * @returns Proxied `Response` with the created document JSON.
 */
export async function POST(request: NextRequest): Promise<Response> {
    const body = await request.text();
    return proxyRequest("/documents", {
        method: "POST",
        body,
        headers: {
            "Content-Type": "application/json",
        },
    });
}
