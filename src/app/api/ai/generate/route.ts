import { getSessionUserId as getUser, jsonError } from "@/lib/auth-helpers";
import { getEffectiveApiKey } from "@/lib/api-key-guard";
import { generateDiary } from "@/lib/diary";
import { NextRequest } from "next/server";
import { checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit";
import { formatZodError, aiGenerateSchema } from "@/lib/validations";
import {
  getUserTier,
  isModelAllowed,
  checkTokenBudget,
  recordTokenUsage,
  estimateTokensFromChars,
} from "@/lib/quota-service";

const BASE_MODEL = "deepseek/deepseek-v4-flash";
const VISION_MODEL = "qwen/qwen3.6-plus";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { success, reset } = await checkRateLimit(rateLimiters.aiGenerate, user.id);
  if (!success) return rateLimitError(reset);

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parseResult = aiGenerateSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return jsonError(formatZodError(parseResult.error), 400);
  }

  const {
    text,
    images,
    tone,
    date: inputDate,
    provider,
  } = parseResult.data;
  const date = inputDate ?? new Date().toISOString().slice(0, 10);

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

  const generator = generateDiary({
    text,
    images: images.map((img) => ({
      url: img.url,
      path: img.path,
      type: img.type as "image",
      mime: img.mime,
      size: img.size,
    })),
    tone,
    date,
    apiKey,
    provider,
  });

  const encoder = new TextEncoder();
  const hasImages = images.length > 0;

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
            encoder.encode(`data: ${JSON.stringify({ error: "生成超时，请稍后重试" })}\n\n`)
          );
          controller.close();
        }
      }, 120_000);

      try {
        for await (const chunk of generator) {
          if (aborted) break;
          fullContent += chunk;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
          );
        }
        if (!aborted) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        }

        // Record estimated token usage after stream completes
        if (fullContent.length > 0) {
          const outputTokens = estimateTokensFromChars(fullContent);
          const inputTokens = estimateTokensFromChars(text) + (hasImages ? images.length * 500 : 0);
          try {
            await recordTokenUsage({
              userId: user.id,
              model: BASE_MODEL,
              inputTokens,
              outputTokens,
            });
            if (hasImages) {
              await recordTokenUsage({
                userId: user.id,
                model: VISION_MODEL,
                inputTokens: images.length * 100,
                outputTokens: images.length * 85,
              });
            }
          } catch {
            console.error("[AI Generate] Failed to record token usage");
          }
        }
      } catch (error) {
        console.error("[AI Generate] stream error:", error instanceof Error ? error.message : error);
        if (!aborted) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "生成失败，请稍后再试" })}\n\n`)
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
