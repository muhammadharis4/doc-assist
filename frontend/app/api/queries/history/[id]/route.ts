import { proxyRequest } from "@/lib/server/backend";

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function DELETE(
    _: Request,
    context: RouteContext,
): Promise<Response> {
    const { id } = await context.params;
    return proxyRequest(`/queries/history/${id}`, {
        method: "DELETE",
    });
}
