import { NextResponse } from "next/server";
import { execSync } from "node:child_process";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// repo root 강제: frontend/app/api/build/route.ts 기준으로
// => frontend 폴더의 상위가 repo root
const REPO_ROOT = path.resolve(process.cwd(), "..");

function safeExec(cmd: string) {
  return execSync(cmd, {
    cwd: REPO_ROOT,                 // ✅ 여기 핵심
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

export async function GET() {
  let sha = "unknown";
  let branch = "unknown";

  try {
    sha = safeExec("git rev-parse --short HEAD");
    branch = safeExec("git branch --show-current") || "detached";
  } catch (err) {
    // git이 없거나 에러가 나면 조용히 넘어감
  }

  return NextResponse.json(
    { branch, sha },
    { headers: { "Cache-Control": "no-store" } }
  );
}
