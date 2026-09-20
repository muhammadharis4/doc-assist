import type { NextConfig } from "next";

/**
 * Base URL of the Python API. Read at **build** time: Next bakes rewrite destinations
 * into the build, so Docker passes it as a build arg.
 */
const BACKEND_API_URL =
    process.env.BACKEND_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

const nextConfig: NextConfig = {
    /** Required for minimal production Docker (`next build` output mode). */
    output: "standalone",
    /**
     * Proxy limits, both too small by default for this app: request bodies are buffered up to
     * 10 MB (the backend accepts PDFs up to 25 MB) and proxied calls time out after 30 s
     * (a CPU answer or a scan extraction takes minutes).
     */
    experimental: {
        proxyClientMaxBodySize: "30mb",
        proxyTimeout: 10 * 60 * 1000,
    },
    /** The browser calls same-origin `/api/*`; Next forwards it to the backend. */
    async rewrites() {
        return [
            { source: "/api/documents/:path*", destination: `${BACKEND_API_URL}/documents/:path*` },
            { source: "/api/queries/:path*", destination: `${BACKEND_API_URL}/queries/:path*` },
        ];
    },
    turbopack: {
        root: process.cwd(),
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=()",
                    },
                ],
            },
        ];
    },
    async redirects() {
        return [
            {
                source: "/",
                destination: "/chat",
                permanent: false,
            },
            {
                source: "/queries",
                destination: "/chat",
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
