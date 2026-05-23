import { getSessionUserId, jsonOk, jsonError } from "@/lib/auth-helpers"
import { prisma } from "@/lib/db"
import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { formatZodError, verifyEncryptionPasswordSchema } from "@/lib/validations"

export async function POST(request: NextRequest) {
  const user = await getSessionUserId()
  if (!user) return jsonError("Unauthorized", 401)

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const parseResult = verifyEncryptionPasswordSchema.safeParse(rawBody)
  if (!parseResult.success) {
    return jsonError(formatZodError(parseResult.error), 400)
  }

  const { password } = parseResult.data

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { encryptionPasswordHash: true },
  })

  if (!dbUser?.encryptionPasswordHash) {
    return jsonError("尚未设置加密密码", 400)
  }

  const valid = await bcrypt.compare(password, dbUser.encryptionPasswordHash)

  return jsonOk({ valid })
}
