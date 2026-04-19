import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/server/backend";

export async function POST(request: NextRequest): Promise<Response> {
    const formData = await request.formData();
    return proxyRequest("/documents/extract", {
        method: "POST",
        body: formData,
    });
}
