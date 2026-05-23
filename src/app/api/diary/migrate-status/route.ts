import { getSessionUserId, jsonOk, jsonError } from "@/lib/auth-helpers"
import { prisma } from "@/lib/db"

export async function GET() {
  const user = await getSessionUserId()
  if (!user) return jsonError("Unauthorized", 401)

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
