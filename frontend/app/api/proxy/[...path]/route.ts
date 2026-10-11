import { NextRequest, NextResponse } from "next/server";

// 런타임에 읽음 (docker: http://backend:8000, 로컬 개발: 기본값)
const BACKEND = (process.env.BACKEND_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) { return forward(req, ctx); }
export async function POST(req: NextRequest, ctx: Ctx) { return forward(req, ctx); }
export async function PUT(req: NextRequest, ctx: Ctx) { return forward(req, ctx); }
export async function PATCH(req: NextRequest, ctx: Ctx) { return forward(req, ctx); }
export async function DELETE(req: NextRequest, ctx: Ctx) { return forward(req, ctx); }

// 요청 → 백엔드로 그대로 전달할 헤더 / 응답 → 브라우저로 돌려줄 헤더
const REQUEST_HEADERS = ["content-type", "accept", "cookie", "authorization"];
const RESPONSE_HEADERS = ["content-type", "cache-control", "pragma", "expires", "content-disposition", "retry-after"];

// 백엔드 호출 제한(IP 당)용 클라이언트 IP. 앞단 프록시(Caddy)가 X-Forwarded-For 를 새로 쓰므로
// 가장 오른쪽 값(가장 가까운 프록시가 본 주소)을 쓴다. 없으면 x-real-ip, 그것도 없으면 "direct".
function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  const last = xff?.split(",").map((s) => s.trim()).filter(Boolean).pop();
  return (last || req.headers.get("x-real-ip") || "direct").slice(0, 64);
}

async function forward(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  const url = new URL(req.url);
  // FastAPI 라우트는 "/sense/" 처럼 끝 슬래시를 구분하므로 원래 요청의 슬래시를 유지
  const trailing = url.pathname.endsWith("/") ? "/" : "";
  const targetUrl = `${BACKEND}/${path.map(encodeURIComponent).join("/")}${trailing}${url.search}`;

  const headers = new Headers();
  for (const k of REQUEST_HEADERS) {
    const v = req.headers.get(k);
    if (v) headers.set(k, v);
  }
  headers.set("x-sool-client-ip", clientIp(req));

  const method = req.method.toUpperCase();
  const init: RequestInit = { method, headers, cache: "no-store" };
  if (method !== "GET" && method !== "HEAD") {
    const body = await req.arrayBuffer();
    if (body.byteLength) init.body = body;
  }

  let res: Response;
  try {
    res = await fetch(targetUrl, init);
  } catch (e: any) {
    return NextResponse.json(
      { detail: `Backend unreachable: ${e?.message ?? String(e)}` },
      { status: 502 }
    );
  }

  const out = new NextResponse(res.body, { status: res.status });
  for (const k of RESPONSE_HEADERS) {
    const v = res.headers.get(k);
    if (v) out.headers.set(k, v);
  }
  // 로그인/로그아웃 쿠키 전달
  for (const c of res.headers.getSetCookie()) out.headers.append("set-cookie", c);

  return out;
}
