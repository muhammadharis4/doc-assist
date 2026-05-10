import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /** Required for minimal production Docker (`next build` output mode). */
    output: "standalone",
    turbopack: {
        root: process.cwd(),
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
