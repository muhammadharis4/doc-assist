import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    rewrites: async () => {
        return {
            beforeFiles: [],
            afterFiles: [
                {
                    source: "/api/:path*",
                    destination: "http://localhost:3000/:path*",
                },
            ],
            fallback: [],
        };
    },
};

export default nextConfig;
