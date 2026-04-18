import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/server/backend";

export async function GET(request: NextRequest): Promise<Response> {
    const limit = request.nextUrl.searchParams.get("limit") ?? "20";
    return proxyRequest(`/queries/history?limit=${encodeURIComponent(limit)}`);
}
