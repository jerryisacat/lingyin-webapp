import { getSessionUserId, jsonOk, jsonError } from "@/lib/auth-helpers"
import { prisma } from "@/lib/db"
import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { formatZodError, encryptionPasswordSchema, changeEncryptionPasswordSchema } from "@/lib/validations"
import { checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit"

const SALT_ROUNDS = 12
const SALT_BYTES = 32

function generateEncryptionSalt(): string {
  return crypto.randomBytes(SALT_BYTES).toString("base64")
}

export async function POST(request: NextRequest) {
  const user = await getSessionUserId()
  if (!user) return jsonError("Unauthorized", 401)

  const { success, reset } = await checkRateLimit(rateLimiters.encryptionPassword, user.id)
  if (!success) return rateLimitError(reset)

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const parseResult = encryptionPasswordSchema.safeParse(rawBody)
  if (!parseResult.success) {
    return jsonError(formatZodError(parseResult.error), 400)
  }

  const { password } = parseResult.data

  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { encryptionPasswordHash: true },
  })

  if (existing?.encryptionPasswordHash) {
    return jsonError("加密密码已设置，如需修改请使用 PUT 方法", 409)
  }

  const encryptionPasswordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const encryptionSalt = generateEncryptionSalt()

  await prisma.user.update({
    where: { id: user.id },
    data: { encryptionPasswordHash, encryptionSalt },
  })

  return jsonOk({
    salt: encryptionSalt,
    message: "加密密码已设置",
  }, 201)
}

export async function PUT(request: NextRequest) {
  const user = await getSessionUserId()
  if (!user) return jsonError("Unauthorized", 401)

  const { success, reset } = await checkRateLimit(rateLimiters.encryptionPassword, user.id)
  if (!success) return rateLimitError(reset)

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const parseResult = changeEncryptionPasswordSchema.safeParse(rawBody)
  if (!parseResult.success) {
    return jsonError(formatZodError(parseResult.error), 400)
  }

  const { oldPassword, newPassword } = parseResult.data

  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { encryptionPasswordHash: true },
  })

  if (!existing?.encryptionPasswordHash) {
    return jsonError("尚未设置加密密码，请使用 POST 创建", 400)
  }

  const valid = await bcrypt.compare(oldPassword, existing.encryptionPasswordHash)
  if (!valid) {
    return jsonError("旧密码不正确", 401)
  }

  const encryptionPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
  const encryptionSalt = generateEncryptionSalt()

  await prisma.user.update({
    where: { id: user.id },
    data: { encryptionPasswordHash, encryptionSalt },
  })

  return jsonOk({
    salt: encryptionSalt,
    message: "加密密码已修改。注意：已有加密日记需使用旧密码解密后重新加密",
  })
}
