import { NextRequest, NextResponse } from "next/server";

export function extractApiKey(request: NextRequest): string | null {
  return request.headers.get("X-API-Key");
}

export function requireApiKey(): NextResponse<{ ok: false; error: string }> {
  return NextResponse.json(
    { ok: false, error: "API Key required — configure it in Settings" },
    { status: 401 }
  );
}

export function checkApiKey(
  request: NextRequest
): string | NextResponse<{ ok: false; error: string }> {
  const apiKey = extractApiKey(request);
  if (!apiKey) return requireApiKey();
  return apiKey;
}