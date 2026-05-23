import { getSessionUserId, jsonOk, jsonError } from "@/lib/auth-helpers"
import { encryptApiKey } from "@/lib/crypto"
import { prisma } from "@/lib/db"
import type { ApiProvider } from "@/types"
import { NextRequest } from "next/server"
import { formatZodError, saveApiKeySchema } from "@/lib/validations"

const VALID_PROVIDERS: ApiProvider[] = ["openrouter"]

export async function GET() {
  const user = await getSessionUserId()
  if (!user) return jsonError("Unauthorized", 401)

  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: user.id, isActive: true },
    select: { id: true, provider: true, label: true, createdAt: true },
  })

  return jsonOk(apiKeys)
}

export async function POST(request: NextRequest) {
  const user = await getSessionUserId()
  if (!user) return jsonError("Unauthorized", 401)

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const parseResult = saveApiKeySchema.safeParse(rawBody)
  if (!parseResult.success) {
    return jsonError(formatZodError(parseResult.error), 400)
  }

  const { provider, apiKey, label } = parseResult.data

  const encryptedKey = encryptApiKey(apiKey)

  const key = await prisma.apiKey.upsert({
    where: { userId_provider: { userId: user.id, provider } },
    create: {
      userId: user.id,
      provider,
      encryptedKey,
      label: label ?? null,
    },
    update: {
      encryptedKey,
      label: label ?? null,
      isActive: true,
    },
  })

  return jsonOk({ provider: key.provider, label: key.label })
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUserId()
  if (!user) return jsonError("Unauthorized", 401)

  const provider = request.nextUrl.searchParams.get("provider")

  if (!provider || !VALID_PROVIDERS.includes(provider as ApiProvider)) {
    return jsonError("Provider is required")
  }

  await prisma.apiKey.updateMany({
    where: { userId: user.id, provider },
    data: { isActive: false },
  })

  return jsonOk(null)
}
