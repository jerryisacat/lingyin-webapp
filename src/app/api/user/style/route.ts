import { getSessionUserId as getUser, jsonError, jsonOk } from "@/lib/auth-helpers"
import { prisma } from "@/lib/db"
import type { WritingStyle } from "@/types"
import { DEFAULT_WRITING_STYLE } from "@/config/personas"
import { NextRequest } from "next/server"
import { formatZodError, writingStyleSchema } from "@/lib/validations"
import { checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit"

export async function GET() {
  const user = await getUser()
  if (!user) return jsonError("Unauthorized", 401)

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { writingStyle: true },
  })

  const style: WritingStyle = (dbUser?.writingStyle as WritingStyle | null) ?? DEFAULT_WRITING_STYLE

  return jsonOk({ writingStyle: style })
}

export async function PUT(request: NextRequest) {
  const user = await getUser()
  if (!user) return jsonError("Unauthorized", 401)

  const { success, reset } = await checkRateLimit(rateLimiters.userConfig, user.id)
  if (!success) return rateLimitError(reset)

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const parseResult = writingStyleSchema.safeParse(rawBody)
  if (!parseResult.success) {
    return jsonError(formatZodError(parseResult.error), 400)
  }

  const writingStyle = parseResult.data

  await prisma.user.update({
    where: { id: user.id },
    data: { writingStyle },
  })

  return jsonOk({ writingStyle })
}
