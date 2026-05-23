import { getUser, jsonError, jsonOk } from "@/lib/api-helpers";
import { getEntry, deleteDiary, saveDiary } from "@/lib/diary";
import { NextRequest } from "next/server";
import { formatZodError, updateEntrySchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const result = await getEntry(user.id, params.id);
  if (!result) return jsonError("Entry not found", 404);

  return jsonOk(result);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const existing = await getEntry(user.id, params.id);
  if (!existing) return jsonError("Entry not found", 404);

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parseResult = updateEntrySchema.safeParse(rawBody);
  if (!parseResult.success) {
    return jsonError(formatZodError(parseResult.error), 400);
  }

  const { markdown, tone, imagePaths, encrypted } = parseResult.data;

  const updated = await saveDiary({
    userId: user.id,
    date: existing.metadata.date,
    markdown,
    tone,
    imagePaths,
    encrypted,
  });

  return jsonOk(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  await deleteDiary(user.id, params.id);

  return jsonOk({ deleted: true });
}