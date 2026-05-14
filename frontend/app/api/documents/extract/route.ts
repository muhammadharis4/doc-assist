/**
 * Proxies PDF/text extraction: `POST /documents/extract` (multipart) to the backend.
 */
import { NextRequest } from "next/server";
import { proxyRequest } from "@/services/server/backend";

/**
 * Runs backend PDF/text extraction on the uploaded file and returns extracted text.
 * @param request - Multipart `FormData` with the file the user uploaded.
 * @returns Proxied `Response` (JSON with an extracted `text` field when successful).
 */
export async function POST(request: NextRequest): Promise<Response> {
    const contentType = request.headers.get("content-type");
    if (!contentType?.toLowerCase().includes("multipart/form-data")) {
        return new Response(
            JSON.stringify({ message: "Expected multipart/form-data." }),
            { status: 400, headers: { "Content-Type": "application/json" } },
        );
    }

    // Forward the raw body so the multipart boundary matches `Content-Type`.
    // Re-parsing `formData()` and passing `FormData` to `fetch` often breaks in Node.
    const body = await request.arrayBuffer();
    return proxyRequest("/documents/extract", {
        method: "POST",
        headers: { "Content-Type": contentType },
        body,
    });
}
