import { NextRequest, NextResponse } from "next/server";

function getBackendUrl(): string {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }
  // If running in Docker production
  if (process.env.NODE_ENV === "production") {
    return "http://backend:8000";
  }
  return "http://127.0.0.1:8000";
}

async function proxyRequest(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path ? params.path.join("/") : "";
  const search = req.nextUrl.search;
  const backendBase = getBackendUrl();
  const targetUrl = `${backendBase}/api/v1/${path}${search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    // Exclude host header to prevent host mismatches
    if (key.toLowerCase() !== "host") {
      headers.set(key, value);
    }
  });

  let body: any = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.blob();
  }

  try {
    const res = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      // Exclude encoding headers that can corrupt streaming
      if (!["content-encoding", "content-length", "transfer-encoding"].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    const data = await res.arrayBuffer();
    return new NextResponse(data, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`[API Proxy Error] ${req.method} ${targetUrl}:`, error);
    return NextResponse.json(
      { 
        error: "Backend proxy error", 
        message: error.message,
        targetUrl 
      },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
