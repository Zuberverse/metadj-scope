/**
 * Scope API Proxy Route
 * Proxies requests to the RunPod Scope API to avoid CORS issues
 */

import { NextRequest, NextResponse } from "next/server";

const SCOPE_API_URL = (process.env.NEXT_PUBLIC_SCOPE_API_URL || "http://localhost:8000").replace(
  /\/$/,
  ""
);

const HEADER_ALLOWLIST = ["content-type", "accept", "authorization"];

// Timeout configuration (in milliseconds)
const DEFAULT_TIMEOUT = 30000;
const PIPELINE_LOAD_TIMEOUT = 60000;

function getTimeoutForPath(path: string): number {
  // Pipeline loading can take longer on cold starts
  if (path.includes("pipeline/load")) {
    return PIPELINE_LOAD_TIMEOUT;
  }
  return DEFAULT_TIMEOUT;
}

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const targetPath = path.join("/");
  const targetUrl = `${SCOPE_API_URL}/${targetPath}${request.nextUrl.search}`;

  const headers = new Headers();
  for (const headerName of HEADER_ALLOWLIST) {
    const value = request.headers.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  let body: BodyInit | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = JSON.stringify(await request.json());
    } else {
      body = await request.arrayBuffer();
    }
  }

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutMs = getTimeoutForPath(targetPath);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      signal: controller.signal,
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const responseHeaders = new Headers();
    const responseContentType = response.headers.get("content-type");
    if (responseContentType) {
      responseHeaders.set("Content-Type", responseContentType);
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort/timeout errors
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`[Scope Proxy] ${request.method} timeout after ${timeoutMs}ms:`, targetPath);
      return NextResponse.json(
        { error: "Request to Scope API timed out" },
        { status: 504 }
      );
    }

    console.error(`[Scope Proxy] ${request.method} error:`, error);
    return NextResponse.json(
      { error: "Failed to proxy request to Scope API" },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context);
}
