import type { NextConfig } from "next";

const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // ✅ 프론트는 /proxy 로만 백엔드 호출
      { source: "/proxy/:path*", destination: `${backend}/:path*` },
    ];
  },
};

export default nextConfig;
