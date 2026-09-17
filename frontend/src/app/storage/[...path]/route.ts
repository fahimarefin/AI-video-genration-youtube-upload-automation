import { NextRequest, NextResponse } from "next/server";

function getBackendUrl(): string {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }
  if (process.env.NODE_ENV === "production") {
    return "http://backend:8000";
  }
  return "http://127.0.0.1:8000";
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path ? params.path.join("/") : "";
  const backendBase = getBackendUrl();
  const targetUrl = `${backendBase}/storage/${path}`;

  try {
    const res = await fetch(targetUrl, {
      headers: req.headers,
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      if (!["content-encoding", "transfer-encoding"].includes(key.toLowerCase())) {
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
    return NextResponse.json(
      { error: "Storage proxy error", message: error.message },
      { status: 502 }
    );
  }
}
