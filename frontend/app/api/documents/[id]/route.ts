import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/server/backendProxy";

interface RouteContext {
    params: Promise<{
        id: string;
    }>;
}

/**
 * Proxies document deletion requests to Backend by document id.
 */
export async function DELETE(
    _request: NextRequest,
    context: RouteContext,
): Promise<NextResponse> {
    const { id } = await context.params;
    return proxyToBackend(`/documents/${id}`, { method: "DELETE" });
}
