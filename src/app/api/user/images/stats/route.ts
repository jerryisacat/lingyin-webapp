import { getSessionUserId as getUser, jsonError, jsonOk } from "@/lib/auth-helpers";
import { listUserImages } from "@/lib/storage";
import { NextRequest } from "next/server";
import { getClientIP, checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const ip = getClientIP(request);
  const { success, reset } = await checkRateLimit(rateLimiters.imageManage, ip);
  if (!success) return rateLimitError(reset);

  const allImages = await listUserImages(user.id);
  const totalCount = allImages.length;
  const totalSize = allImages.reduce((sum, img) => sum + img.size, 0);

  return jsonOk({ totalCount, totalSize });
}
