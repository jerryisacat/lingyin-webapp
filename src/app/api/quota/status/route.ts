import { getSessionUserId as getUser, jsonError, jsonOk } from "@/lib/auth-helpers";
import { getQuotaStatus } from "@/lib/quota-service";

export async function GET() {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const status = await getQuotaStatus(user.id);
  return jsonOk(status);
}
