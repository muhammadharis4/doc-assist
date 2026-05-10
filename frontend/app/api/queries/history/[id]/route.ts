/**
 * Proxies deletion of a single history entry: `DELETE /queries/history/:id` on the backend.
 */
import { proxyRequest } from "@/services/server/backend";

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * Tells the backend to remove one stored chat history row by its id.
 * @param _ - Unused; DELETE has no body.
 * @param context - Next.js route context; `id` is the history entry to delete.
 * @returns Proxied `Response` from the backend.
 */
export async function DELETE(
    _: Request,
    context: RouteContext,
): Promise<Response> {
    const { id } = await context.params;
    return proxyRequest(`/queries/history/${id}`, {
        method: "DELETE",
    });
}
