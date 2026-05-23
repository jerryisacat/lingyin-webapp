import { NextRequest } from "next/server"
import { verifyEmail } from "@/lib/auth-service"
import { getClientIP, checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit"
import { jsonOk, jsonError } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  const ip = getClientIP(request)
  const { success, reset } = await checkRateLimit(rateLimiters.verifyEmail, ip)
  if (!success) return rateLimitError(reset)

  const token = request.nextUrl.searchParams.get("token")

  if (!token) {
    return jsonError("缺少验证令牌", 400)
  }

  const result = await verifyEmail(token)

  if (result.ok) {
    return jsonOk(result.data)
  }

  return jsonError(result.error, 400)
}
