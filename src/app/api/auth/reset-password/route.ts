import { resetPassword } from "@/lib/auth-service"
import { getClientIP, checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit"
import { jsonOk, jsonError } from "@/lib/auth-helpers"
import { formatZodError, resetPasswordSchema } from "@/lib/validations"

export async function POST(request: Request) {
  const ip = getClientIP(request)
  const { success, reset } = await checkRateLimit(rateLimiters.resetPassword, ip)
  if (!success) return rateLimitError(reset)

  try {
    const body = await request.json()
    const parseResult = resetPasswordSchema.safeParse(body)
    if (!parseResult.success) {
      return jsonError(formatZodError(parseResult.error), 400)
    }
    const result = await resetPassword(parseResult.data)

    if (result.ok) {
      return jsonOk(result.data)
    }

    return jsonError(result.error, 400)
  } catch {
    return jsonError("重置失败，请稍后再试", 500)
  }
}
