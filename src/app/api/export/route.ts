import { NextRequest } from "next/server";
import { getSessionUserId, jsonError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { readMarkdownByPath } from "@/lib/storage";

export async function GET(_request: NextRequest) {
  const user = await getSessionUserId();
  if (!user) return jsonError("请先登录", 401);

  const entries = await prisma.entry.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 200,
    select: {
      date: true,
      tone: true,
      markdownPath: true,
      tags: true,
    },
  });

  const exports = await Promise.all(
    entries.map(async (entry) => {
      const content = await readMarkdownByPath(entry.markdownPath);
      return {
        date: entry.date.toISOString().slice(0, 10),
        tone: entry.tone,
        tags: entry.tags ? JSON.parse(entry.tags) : [],
        markdown: content,
      };
    })
  );

  const json = JSON.stringify({ exportedAt: new Date().toISOString(), entries: exports }, null, 2);

  return new Response(json, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="lingyin-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
