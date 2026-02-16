import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: '/.netlify/:path*',
          destination: '/.netlify/:path*',
        },
      ],
    };
  },
};

export default nextConfig;
