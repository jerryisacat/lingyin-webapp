import { getUser, jsonError } from "@/lib/api-helpers";
import { getUserDecryptedApiKey } from "@/lib/api-key-guard";
import { generateStream } from "@/lib/ai/client";
import {
  WARM_SYSTEM_PROMPT,
  GENKI_SYSTEM_PROMPT,
  MINIMAL_SYSTEM_PROMPT,
  LITERARY_SYSTEM_PROMPT,
} from "@/lib/ai/prompts";
import type { Tone } from "@/types";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit";
import { formatZodError, aiRewriteSchema } from "@/lib/validations";

const TONE_PROMPTS: Record<Tone, string> = {
  warm: WARM_SYSTEM_PROMPT,
  genki: GENKI_SYSTEM_PROMPT,
  minimal: MINIMAL_SYSTEM_PROMPT,
  literary: LITERARY_SYSTEM_PROMPT,
}

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

  const apiKey = await getUserDecryptedApiKey(user.id, provider);
  if (!apiKey) {
    return jsonError("API Key not configured for this provider — configure it in Settings", 400);
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { tone: true },
  })
  const tone = (dbUser?.tone ?? "warm") as Tone
  const systemPrompt = TONE_PROMPTS[tone]
  const userPrompt = `原始日记如下：

${content}

用户想：${instruction}

请根据用户的要求重新输出润色后的日记，保持 Markdown 格式。`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let aborted = false

      request.signal?.addEventListener("abort", () => {
        aborted = true
        controller.close()
      })

      const timeout = setTimeout(() => {
        if (!aborted) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "改写超时，请稍后重试" })}\n\n`)
          )
          controller.close()
        }
      }, 8_000)

      try {
        for await (const chunk of generateStream({
          apiKey,
          provider,
          systemPrompt,
          userPrompt,
        })) {
          if (aborted) break
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
          );
        }
        if (!aborted) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        }
      } catch (error) {
        console.error("[AI Rewrite] stream error:", error instanceof Error ? error.message : error);
        if (!aborted) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "改写失败，请稍后再试" })}\n\n`)
          );
        }
      } finally {
        clearTimeout(timeout)
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