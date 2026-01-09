import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const rawBackend = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
const backend = rawBackend.replace(/\/+$/, "");

async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = (params.path || []).join("/");
  const url = `${backend}/${path}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");

  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : await req.arrayBuffer();

  const upstreamRes = await fetch(url, {
    method: req.method,
    headers,
    body: body && body.byteLength ? body : undefined,
  });

  const resHeaders = new Headers(upstreamRes.headers);
  resHeaders.delete("content-encoding"); // 가끔 dev에서 꼬이는 것 방지용

  return new NextResponse(upstreamRes.body, {
    status: upstreamRes.status,
    headers: resHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
