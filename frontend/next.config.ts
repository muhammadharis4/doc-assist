import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /** Required for minimal production Docker (`next build` output mode). */
    output: "standalone",
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
                source: "/queries",
                destination: "/chat",
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
