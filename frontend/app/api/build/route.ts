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
  try {
    const sha = safeExec("git rev-parse --short HEAD");
    const branch = safeExec("git branch --show-current") || "detached";

    return NextResponse.json(
      { branch, sha },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { branch: "unknown-branch", sha: "unknown-sha" },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
