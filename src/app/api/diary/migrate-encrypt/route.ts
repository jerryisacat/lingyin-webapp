import { getSessionUserId, jsonOk, jsonError } from "@/lib/auth-helpers"
import { prisma } from "@/lib/db"
import {
  buildEncryptedMarkdownPath,
  buildMarkdownPath,
  saveMarkdown,
  deleteMarkdownByPath,
} from "@/lib/storage"
import { NextRequest } from "next/server"
import { z } from "zod"
import { formatZodError } from "@/lib/validations"
import { checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit"

const migrateEntrySchema = z.object({
  entryId: z.string(),
  encryptedMarkdown: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function GET(request: NextRequest) {
  const user = await getSessionUserId()
  if (!user) return jsonError("Unauthorized", 401)

  const { success, reset } = await checkRateLimit(rateLimiters.migrate, user.id)
  if (!success) return rateLimitError(reset)

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "true"

  const entries = await prisma.entry.findMany({
    where: {
      userId: user.id,
      NOT: { markdownPath: { endsWith: ".enc.md" } },
    },
    select: { id: true, date: true, markdownPath: true },
    orderBy: { date: "asc" },
  })

  if (dryRun) {
    return jsonOk({
      count: entries.length,
      entries: entries.map((e) => ({
        entryId: e.id,
        date: e.date.toISOString().slice(0, 10),
      })),
    })
  }

  return jsonOk({
    entries: entries.map((e) => ({
      entryId: e.id,
      date: e.date.toISOString().slice(0, 10),
    })),
  })
}

export async function POST(request: NextRequest) {
  const user = await getSessionUserId()
  if (!user) return jsonError("Unauthorized", 401)

  const { success, reset } = await checkRateLimit(rateLimiters.migrate, user.id)
  if (!success) return rateLimitError(reset)

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const parseResult = migrateEntrySchema.safeParse(rawBody)
  if (!parseResult.success) {
    return jsonError(formatZodError(parseResult.error), 400)
  }

  const { entryId, encryptedMarkdown, date } = parseResult.data

  const entry = await prisma.entry.findFirst({
    where: { id: entryId, userId: user.id },
  })

  if (!entry) {
    return jsonError("Entry not found", 404)
  }

  if (entry.markdownPath.endsWith(".enc.md")) {
    return jsonError("Entry is already encrypted", 409)
  }

  const oldPath = entry.markdownPath

  const saved = await saveMarkdown(user.id, date, encryptedMarkdown, true)

  await prisma.entry.update({
    where: { id: entryId },
    data: {
      markdownPath: saved.path,
      preview: null,
      wordCount: 0,
    },
  })

  try {
    await deleteMarkdownByPath(oldPath)
  } catch {
    // Non-critical — old file may already be gone
  }

  return jsonOk({ entryId, newPath: saved.path })
}
