import { NextRequest } from "next/server";
import { getSessionUserId, jsonOk, jsonError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export async function GET(_request: NextRequest) {
  const user = await getSessionUserId();
  if (!user) return jsonError("请先登录", 401);

  const invoices = await prisma.invoice.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      paidAt: true,
      createdAt: true,
    },
  });

  return jsonOk(invoices);
}
