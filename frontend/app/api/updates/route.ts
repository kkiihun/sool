import { NextResponse } from "next/server";

// ✅ 서버에서 백엔드 직접 호출용 base URL 결정
// 우선순위: BACKEND_URL > BACKEND_BASE_URL > NEXT_PUBLIC_API_BASE_URL(절대URL일 때만) > 기본값
function getBackendBase() {
  const candidates = [
    process.env.BACKEND_URL,
    process.env.BACKEND_BASE_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL, // 있을 수도 있음 (단, /proxy면 안 됨)
    "http://localhost:8000",
  ].filter(Boolean) as string[];

  let base = candidates[0];

  // NEXT_PUBLIC_API_BASE_URL이 "/proxy" 같은 상대경로면 서버에서 백엔드에 직접 못 감 → 기본값/서버 env로
  if (base.startsWith("/")) {
    base = process.env.BACKEND_URL || process.env.BACKEND_BASE_URL || "http://localhost:8000";
  }

  return base.replace(/\/$/, ""); // trailing slash 제거
}

const BACKEND_BASE = getBackendBase();

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_BASE}/updates/`, { cache: "no-store" });

    // 백엔드가 404/500이어도 프론트는 죽지 않게 빈 배열 반환
    if (!res.ok) return NextResponse.json([]);

    const data = await res.json().catch(() => []);
    return NextResponse.json(Array.isArray(data) ? data : data ?? []);
  } catch {
    // 백엔드 꺼져있으면 여기로 옴
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(`${BACKEND_BASE}/updates/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    
    // 수정중..(260105)
    //if (!res.ok) return NextResponse.json({ ok: false }, { status: 200 });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json({ ok: false, status: res.status, detail: text }, { status: res.status });
    }


    const data = await res.json().catch(() => ({ ok: true }));
    return NextResponse.json(data);
  //} catch {
    //return NextResponse.json({ ok: false }, { status: 200 });
  //}
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
