import { getUser, jsonError, jsonOk } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import type { Tone } from "@/types";
import { NextRequest } from "next/server";
import { formatZodError, userConfigSchema } from "@/lib/validations";
import { checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit";

export async function GET() {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { tone: true },
  });

  return jsonOk({
    tone: (dbUser?.tone ?? "warm") as Tone,
  });
}

export async function PUT(request: NextRequest) {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { success, reset } = await checkRateLimit(rateLimiters.userConfig, user.id);
  if (!success) return rateLimitError(reset);

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parseResult = userConfigSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return jsonError(formatZodError(parseResult.error), 400);
  }

  const { tone } = parseResult.data;

  await prisma.user.update({
    where: { id: user.id },
    data: { tone },
  });

  return jsonOk({ tone });
}