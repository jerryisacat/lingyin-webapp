import { getSessionUserId, jsonOk, jsonError } from "@/lib/auth-helpers"
import { prisma } from "@/lib/db"

export async function GET() {
  const user = await getSessionUserId()
  if (!user) return jsonError("Unauthorized", 401)

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      encryptionPasswordHash: true,
      encryptionSalt: true,
    },
  })

  return jsonOk({
    hasEncryptionPassword: Boolean(dbUser?.encryptionPasswordHash),
    salt: dbUser?.encryptionSalt ?? null,
  })
}
