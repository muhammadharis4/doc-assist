/**
 * Proxies document deletion: `DELETE /documents/:id` on the backend.
 */
import { proxyRequest } from "@/lib/server/backend";

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
