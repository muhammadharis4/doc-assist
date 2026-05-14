/**
 * Proxies document delete (`DELETE`) and tag updates (`PATCH`) on the backend.
 */
import { NextRequest } from "next/server";
import { proxyRequest } from "@/services/server/backend";

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * Tells the backend to delete one uploaded document (and any derived data) by id.
 * @param _ - Unused; DELETE has no body.
 * @param context - Next.js `params` with the document `id` to remove.
 * @returns Proxied `Response` from the backend.
 */
export async function DELETE(
    _: Request,
    context: RouteContext,
): Promise<Response> {
    const { id } = await context.params;
    return proxyRequest(`/documents/${id}`, {
        method: "DELETE",
    });
}

/**
 * Updates document fields on the backend (tags).
 * @param request - JSON body (e.g. `{ "tags": ["a"] }`).
 * @param context - Route params with document `id`.
 * @returns Proxied PATCH response.
 */
export async function PATCH(
    request: NextRequest,
    context: RouteContext,
): Promise<Response> {
    const { id } = await context.params;
    const body = await request.text();
    return proxyRequest(`/documents/${id}`, {
        method: "PATCH",
        body,
        headers: {
            "Content-Type": "application/json",
        },
    });
}
