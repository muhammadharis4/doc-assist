import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/server/backendProxy";

/**
 * Proxies document list requests to Backend, including query filters.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    const search = request.nextUrl.search;
    return proxyToBackend(`/documents${search}`, { method: "GET" });
}

/**
 * Proxies document creation requests to Backend.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    const body = await request.json();

    return proxyToBackend("/documents", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
}
