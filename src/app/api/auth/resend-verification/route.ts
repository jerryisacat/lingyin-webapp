import { NextResponse } from "next/server"
import { resendVerification } from "@/lib/auth-service"
import { getClientIP, checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit"
import { jsonError } from "@/lib/auth-helpers"
import { formatZodError, resendVerificationSchema } from "@/lib/validations"

export async function POST(request: Request) {
  const ip = getClientIP(request)
  const { success, reset } = await checkRateLimit(rateLimiters.resendVerification, ip)
  if (!success) return rateLimitError(reset)

  try {
    const body = await request.json()
    const parseResult = resendVerificationSchema.safeParse(body)
    if (!parseResult.success) {
      return jsonError(formatZodError(parseResult.error), 400)
    }
    const { email } = parseResult.data
    const result = await resendVerification(email)

    if (result.ok) {
      return NextResponse.json(result)
    }

    return NextResponse.json(result, { status: 400 })
  } catch {
    return NextResponse.json(
      { ok: false, error: "发送失败，请稍后再试" },
      { status: 500 }
    )
  }
}
