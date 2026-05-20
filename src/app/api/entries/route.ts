import { getUser, jsonError, jsonOk } from "@/lib/api-helpers";
import { getEntries, saveDiary } from "@/lib/diary";
import type { Tone } from "@/types";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);

  const entries = await getEntries(user.id, cursor, limit);

  const nextCursor =
    entries.length >= limit ? entries[entries.length - 1]?.id ?? null : null;

  return jsonOk({ entries, nextCursor });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  let body: {
    date?: string;
    markdown?: string;
    tone?: Tone;
    imagePaths?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const { date = new Date().toISOString().slice(0, 10), markdown = "", tone = "warm", imagePaths = [] } = body;

  if (!markdown.trim()) {
    return jsonError("Markdown content is required");
  }

  const entry = await saveDiary({
    userId: user.id,
    date,
    markdown,
    tone,
    imagePaths,
  });

  return jsonOk(entry, 201);
}