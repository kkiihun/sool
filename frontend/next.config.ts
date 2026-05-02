import type { NextConfig } from "next";

const rawBackend = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
const backend = rawBackend.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  experimental: {
    webpackBuildWorker: false,
    webpackMemoryOptimizations: true,
    parallelServerCompiles: false,
    parallelServerBuildTraces: false,
  },
  async rewrites() {
    return [
      // ✅ /proxy/tasting 또는 /proxy/tasting/ 모두 백엔드의 /tasting/ 로 고정
      { source: "/proxy/tasting", destination: `${backend}/tasting/` },
      { source: "/proxy/tasting/", destination: `${backend}/tasting/` },

      // ✅ 나머지는 일반 프록시
      { source: "/proxy/:path*", destination: `${backend}/:path*` },

      { source: "/auth/:path*", destination: `${backend}/auth/:path*` },
      { source: "/users/:path*", destination: `${backend}/users/:path*` },

    ];
  },
};

export default nextConfig;
