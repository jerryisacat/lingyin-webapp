import { getSessionUserId, jsonOk, jsonError } from "@/lib/auth-helpers"
import { prisma } from "@/lib/db"
import { checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit"

export async function GET() {
  const user = await getSessionUserId()
  if (!user) return jsonError("Unauthorized", 401)

  const { success, reset } = await checkRateLimit(rateLimiters.migrate, user.id)
  if (!success) return rateLimitError(reset)

  const entries = await prisma.entry.findMany({
    where: { userId: user.id },
    select: { markdownPath: true },
  })

  let encrypted = 0
  let plain = 0

  for (const entry of entries) {
    if (entry.markdownPath.endsWith(".enc.md")) {
      encrypted++
    } else {
      plain++
    }
  }

  return jsonOk({
    totalEntries: entries.length,
    encryptedEntries: encrypted,
    plainEntries: plain,
    needsMigration: plain > 0,
  })
}
