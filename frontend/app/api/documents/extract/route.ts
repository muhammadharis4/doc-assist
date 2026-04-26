/**
 * Proxies PDF/text extraction: `POST /documents/extract` (multipart) to the backend.
 */
import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/server/backend";

/**
 * Runs backend PDF/text extraction on the uploaded file and returns extracted text.
 * @param request - Multipart `FormData` with the file the user uploaded.
 * @returns Proxied `Response` (JSON with an extracted `text` field when successful).
 */
export async function POST(request: NextRequest): Promise<Response> {
    const formData = await request.formData();
    return proxyRequest("/documents/extract", {
        method: "POST",
        body: formData,
    });
}
