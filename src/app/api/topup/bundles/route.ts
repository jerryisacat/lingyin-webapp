import { getTopUpBundles } from "@/lib/quota-service";
import { jsonOk } from "@/lib/auth-helpers";

export async function GET() {
  const bundles = getTopUpBundles();
  return jsonOk({ bundles });
}
