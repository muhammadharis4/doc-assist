import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
