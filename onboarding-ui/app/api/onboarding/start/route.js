// app/api/onboarding/start/route.js
import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8001";

export async function POST(req) {
  try {
    const body = await req.json();

    const url = `${API_BASE}/onboarding/start`;
    console.log("[API/start] proxy ->", url, "body:", body);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const raw = await res.text();

    if (!res.ok) {
      console.error("[API/start] backend error", res.status, raw);
      return NextResponse.json(
        { detail: "Backend error", status: res.status, raw },
        { status: res.status },
      );
    }

    const json = JSON.parse(raw);
    return NextResponse.json(json);
  } catch (err) {
    console.error("[API/start] proxy error", err);
    return NextResponse.json(
      {
        detail: "Frontend proxy error",
        error: String(err),
      },
      { status: 500 },
    );
  }
}
