import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decryptApiKey } from "@/lib/crypto";
import type { ApiProvider } from "@/types";

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

export async function getUserDecryptedApiKey(
  userId: string,
  provider: ApiProvider
): Promise<string | null> {
  const key = await prisma.apiKey.findUnique({
    where: { userId_provider: { userId, provider } },
  });

  if (!key || !key.isActive) return null;

  try {
    return decryptApiKey(key.encryptedKey);
  } catch {
    console.error("Failed to decrypt API key for user", userId);
    return null;
  }
}