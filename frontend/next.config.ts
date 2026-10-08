import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 운영 이미지용: .next/standalone 에 server.js + 필요한 node_modules 만 포함
  output: "standalone",
  // 상위 폴더의 다른 lockfile 때문에 루트를 잘못 잡지 않도록 frontend 폴더로 고정
  outputFileTracingRoot: __dirname,
  turbopack: { root: __dirname },
  // /api/proxy/sense/ 처럼 끝 슬래시를 그대로 백엔드에 전달 (FastAPI 307 리다이렉트 방지)
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
