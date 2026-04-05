import fs from "fs";
import path from "path";
import { execSync } from "child_process";

function run(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] })
    .toString()
    .trim();
}

// frontend 폴더에서 실행된다고 가정 (npm run dev를 frontend에서 실행)
const envPath = path.join(process.cwd(), ".env.local");

let branch = "unknown-branch";
let sha = "unknown-sha";
try {
  branch = run("git rev-parse --abbrev-ref HEAD");
  sha = run("git rev-parse --short HEAD");
} catch (_) {
  // git 없는 환경이면 그냥 unknown 유지
}

const buildTime = new Date().toISOString();

const updates = {
  NEXT_PUBLIC_GIT_BRANCH: branch,
  NEXT_PUBLIC_GIT_SHA: sha,
  NEXT_PUBLIC_BUILD_TIME: buildTime,
  // 운영 배포에서 숨기고 싶으면 0 유지, 필요 시 1로 바꿔서 보여주기
  // NEXT_PUBLIC_SHOW_BUILD_BADGE: "1",
};

let lines = [];
if (fs.existsSync(envPath)) {
  lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
}

const keys = Object.keys(updates);
const map = new Map();

// 기존 라인 파싱(그대로 보존)
for (const line of lines) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) map.set(m[1], m[2]);
}

// 키만 업데이트/추가 (기존 다른 설정 예: NEXT_PUBLIC_API_BASE_URL 유지됨)
for (const k of keys) {
  map.set(k, String(updates[k]));
}

// 다시 쓰기(정렬해서 깔끔)
const out = [];
for (const [k, v] of [...map.entries()].sort((a, b) =>
  a[0].localeCompare(b[0])
)) {
  out.push(`${k}=${v}`);
}
out.push(""); // 마지막 줄 개행

fs.writeFileSync(envPath, out.join("\n"), "utf8");

console.log(`[git-env] ${branch} @ ${sha}`);
