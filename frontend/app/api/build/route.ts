import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 배포 시 deploy.sh 가 GIT_BRANCH / GIT_SHA 를 넣어줌 (컨테이너 안에는 git 이 없음)
export async function GET() {
  return NextResponse.json(
    {
      branch: process.env.GIT_BRANCH || "unknown-branch",
      sha: process.env.GIT_SHA || "unknown-sha",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
