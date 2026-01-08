// frontend/app/api/updates/route.ts
import { NextResponse } from "next/server";

const BACKEND_BASE =
  process.env.BACKEND_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
  "http://127.0.0.1:8000";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_BASE}/updates/`, { cache: "no-store" });

    // 백엔드가 404/500이어도 프론트는 죽지 않게 빈 배열 반환
    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    return NextResponse.json(data ?? []);
  } catch (e) {
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
    });

    if (!res.ok) return NextResponse.json({ ok: false }, { status: 200 });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
