import { getSessionUserId as getUser, jsonError } from "@/lib/auth-helpers";
import { getEffectiveApiKey } from "@/lib/api-key-guard";
import { generateStream } from "@/lib/ai/client";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import type { WritingStyle } from "@/types";
import { DEFAULT_WRITING_STYLE } from "@/config/personas";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit";
import { formatZodError, aiRewriteSchema } from "@/lib/validations";
import {
  getUserTier,
  isModelAllowed,
  checkTokenBudget,
  recordTokenUsage,
  estimateTokensFromChars,
} from "@/lib/quota-service";

const BASE_MODEL = "deepseek/deepseek-v4-flash";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { success, reset } = await checkRateLimit(rateLimiters.aiRewrite, user.id);
  if (!success) return rateLimitError(reset);

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parseResult = aiRewriteSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return jsonError(formatZodError(parseResult.error), 400);
  }

  const {
    content,
    instruction: inputInstruction,
    provider,
  } = parseResult.data;
  const instruction = inputInstruction ?? "请润色这篇日记，让语言更优美流畅";

  const tier = await getUserTier(user.id);
  if (!isModelAllowed(tier, BASE_MODEL)) {
    return jsonError(
      `免费版仅支持 ${Array.isArray(tier.allowedModels) ? (tier.allowedModels as string[]).join(", ") : "所有"} 模型，升级套餐以使用更多模型`,
      403
    );
  }

  const tokenBudget = await checkTokenBudget(user.id);
  if (!tokenBudget.allowed) {
    return jsonError("本月 Token 预算已用完，请升级套餐或等待下月重置", 403);
  }

  const apiKey = await getEffectiveApiKey(user.id, provider);
  if (!apiKey) {
    return jsonError("API Key not configured — configure it in Settings", 400);
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { writingStyle: true },
  });
  const writingStyle: WritingStyle = (dbUser?.writingStyle as WritingStyle | null) ?? DEFAULT_WRITING_STYLE;
  const systemPrompt = buildSystemPrompt(writingStyle);
  const userPrompt = `原始日记如下：

${content}

用户想：${instruction}

请根据用户的要求重新输出润色后的日记，保持 Markdown 格式。`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let aborted = false;
      let fullContent = "";

      request.signal?.addEventListener("abort", () => {
        aborted = true;
        controller.close();
      });

      const timeout = setTimeout(() => {
        if (!aborted) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "改写超时，请稍后重试" })}\n\n`)
          );
          controller.close();
        }
      }, 120_000);

      try {
        for await (const chunk of generateStream({
          apiKey,
          provider,
          systemPrompt,
          userPrompt,
        })) {
          if (aborted) break;
          fullContent += chunk;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
          );
        }
        if (!aborted) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        }

        // Record estimated token usage
        if (fullContent.length > 0) {
          const inputTokens = estimateTokensFromChars(systemPrompt + userPrompt);
          const outputTokens = estimateTokensFromChars(fullContent);
          try {
            await recordTokenUsage({
              userId: user.id,
              model: BASE_MODEL,
              inputTokens,
              outputTokens,
            });
          } catch {
            console.error("[AI Rewrite] Failed to record token usage");
          }
        }
      } catch (error) {
        console.error("[AI Rewrite] stream error:", error instanceof Error ? error.message : error);
        if (!aborted) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "改写失败，请稍后再试" })}\n\n`)
          );
        }
      } finally {
        clearTimeout(timeout);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
