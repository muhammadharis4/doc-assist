import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/server/backend";

export async function GET(): Promise<Response> {
    return proxyRequest("/documents");
}

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
