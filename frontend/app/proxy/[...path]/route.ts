import { NextRequest, NextResponse } from "next/server";

const BACKEND = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

type Ctx = {
  params: Promise<{ path?: string[] }> | { path?: string[] };
};

export async function GET(req: NextRequest, ctx: Ctx) {
  return forward(req, ctx);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return forward(req, ctx);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return forward(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return forward(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return forward(req, ctx);
}

async function forward(req: NextRequest, ctx: Ctx) {
  const resolved = await Promise.resolve(ctx.params);
  const parts = Array.isArray(resolved?.path) ? resolved.path : [];
  const targetPath = parts.join("/");

  const url = new URL(req.url);
  const targetUrl = `${BACKEND}/${targetPath}${url.search}`;

  const headers: Record<string, string> = {};
  const auth = req.headers.get("authorization");
  if (auth) headers["authorization"] = auth;

  const contentType = req.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;

  const method = req.method.toUpperCase();
  const init: RequestInit = { method, headers, cache: "no-store" };

  // ✅ GET/HEAD는 body 금지
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

  const resType = res.headers.get("content-type") || "";
  if (resType.includes("application/json")) {
    const data = await res.json().catch(() => null);
    return NextResponse.json(data, { status: res.status });
  }

  const text = await res.text().catch(() => "");
  return new NextResponse(text, { status: res.status });
}
