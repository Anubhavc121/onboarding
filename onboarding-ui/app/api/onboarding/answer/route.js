// app/api/onboarding/answer/route.js
import { NextResponse } from "next/server";

const BASE = process.env.ONBOARDING_API_BASE;

async function proxyToBackend(path, req) {
  if (!BASE) {
    console.error("ONBOARDING_API_BASE is not set in environment");
    return NextResponse.json(
      {
        detail: "Frontend proxy error",
        error: "ONBOARDING_API_BASE not configured",
      },
      { status: 500 },
    );
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  try {
    const res = await fetch(`${BASE}/onboarding/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { raw };
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          detail: "Frontend proxy error",
          status: res.status,
          error: data,
        },
        { status: res.status },
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Proxy error /answer:", err);
    return NextResponse.json(
      {
        detail: "Frontend proxy error",
        error: String(err),
      },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  return proxyToBackend("answer", req);
}

export async function GET() {
  return NextResponse.json(
    { detail: "Use POST /api/onboarding/answer from the app" },
    { status: 405 },
  );
}
