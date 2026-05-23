import { getSessionUserId as getUser, jsonError, jsonOk } from "@/lib/auth-helpers";
import { getStats } from "@/lib/stats";
import { checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit";

export async function GET() {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { success, reset } = await checkRateLimit(rateLimiters.stats, user.id);
  if (!success) return rateLimitError(reset);

  try {
    const stats = await getStats(user.id);
    return jsonOk(stats);
  } catch (error) {
    console.error("Failed to get stats:", error);
    return jsonError("获取统计数据失败", 500);
  }
}
