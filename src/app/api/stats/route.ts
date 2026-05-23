import { getUser, jsonError, jsonOk } from "@/lib/api-helpers";
import { getStats } from "@/lib/stats";

export async function GET() {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  try {
    const stats = await getStats(user.id);
    return jsonOk(stats);
  } catch (error) {
    console.error("Failed to get stats:", error);
    return jsonError("获取统计数据失败", 500);
  }
}
