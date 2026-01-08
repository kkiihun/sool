import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // ✅ sool v1 endpoints (Home에서 사용)
      { source: "/sool/:path*", destination: "http://127.0.0.1:8000/sool/:path*" },

      // 기존 유지
      { source: "/v2/:path*", destination: "http://127.0.0.1:8000/v2/:path*" },
      { source: "/api/:path*", destination: "http://127.0.0.1:8000/api/:path*" },
      { source: "/updates/:path*", destination: "http://127.0.0.1:8000/updates/:path*" },
    ];
  },
};

export default nextConfig;
