import { NextRequest, NextResponse } from "next/server";

const BACKEND = (process.env.BACKEND_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
type Ctx = { params: Promise<{ path?: string[] }> | { path?: string[] } };

export async function GET(req: NextRequest, ctx: Ctx) { return forward(req, ctx); }
export async function POST(req: NextRequest, ctx: Ctx) { return forward(req, ctx); }
export async function PUT(req: NextRequest, ctx: Ctx) { return forward(req, ctx); }
export async function PATCH(req: NextRequest, ctx: Ctx) { return forward(req, ctx); }
export async function DELETE(req: NextRequest, ctx: Ctx) { return forward(req, ctx); }

async function forward(req: NextRequest, ctx: Ctx) {
  const resolved = await Promise.resolve(ctx.params);
  const parts = Array.isArray(resolved?.path) ? resolved.path : [];
  const targetPath = parts.join("/");

  const url = new URL(req.url);
  const targetUrl = `${BACKEND}/${targetPath}${url.search}`;

  const headers = new Headers();

  // content-type
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  // ✅ 브라우저 쿠키를 백엔드로 전달
  const cookie = req.headers.get("cookie");
  if (cookie) {
    headers.set("cookie", cookie);

    // ✅ cookie 문자열에서 access_token 파싱 → Authorization 헤더로도 전달
    const m = cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
    if (m?.[1]) {
      headers.set("authorization", `Bearer ${m[1]}`);
    }
  }

  const method = req.method.toUpperCase();
  const init: RequestInit = { method, headers, cache: "no-store" };

  if (method !== "GET" && method !== "HEAD") {
    const bodyText = await req.text();
    if (bodyText) init.body = bodyText;
  }

  let res: Response;
  try {
    res = await fetch(targetUrl, init);
  } catch (e: any) {
    return NextResponse.json(
      { detail: `Proxy fetch failed: ${e?.message ?? String(e)}`, targetUrl },
      { status: 502 }
    );
  }

  const body = await res.arrayBuffer();
  const out = new NextResponse(body, { status: res.status });

  // ✅ 주요 헤더 전달
  const passThrough = ["content-type", "cache-control", "pragma", "expires"];
  for (const k of passThrough) {
    const v = res.headers.get(k);
    if (v) out.headers.set(k, v);
  }

  // ✅ Set-Cookie 전달 (Next 런타임별 호환)
  const anyHeaders: any = res.headers as any;
  let forwarded = 0;

  if (typeof anyHeaders.getSetCookie === "function") {
    const cookies = anyHeaders.getSetCookie();
    forwarded = cookies?.length ?? 0;
    for (const c of cookies) out.headers.append("set-cookie", c);
  } else {
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      forwarded = 1;
      out.headers.append("set-cookie", setCookie);
    }
  }

  // ✅ 디버그 헤더
  out.headers.set("x-proxy-target", targetUrl);
  out.headers.set("x-proxy-set-cookie-count", String(forwarded));

  return out;
}
