import { getSessionUserId as getUser, jsonOk, jsonError } from "@/lib/auth-helpers";
import { getPresignedUrl } from "@/lib/storage";
import { NextRequest, NextResponse } from "next/server";
import { getClientIP, checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit";

function extractUserIdFromKey(key: string): string | null {
  const match = key.match(/^users\/([^/]+)\//);
  return match ? match[1] : null;
}

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const ip = getClientIP(request);
  const { success, reset } = await checkRateLimit(rateLimiters.imageProxy, ip);
  if (!success) return rateLimitError(reset);

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const redirect = searchParams.get("redirect");

  if (!key) {
    return jsonError("Missing 'key' parameter", 400);
  }

  const ownerId = extractUserIdFromKey(key);
  if (!ownerId || ownerId !== user.id) {
    return jsonError("Not found", 404);
  }

  try {
    const signedUrl = await getPresignedUrl(key);

    if (redirect === "true") {
      return NextResponse.redirect(signedUrl);
    }

    return jsonOk({ url: signedUrl });
  } catch {
    return jsonError("Not found", 404);
  }
}
