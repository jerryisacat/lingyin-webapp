import { getUser, jsonError, jsonOk } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import type { Tone } from "@/types";
import { NextRequest } from "next/server";

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

  let body: { tone?: Tone };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  if (!body.tone) {
    return jsonError("Tone is required");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { tone: body.tone },
  });

  return jsonOk({ tone: body.tone });
}