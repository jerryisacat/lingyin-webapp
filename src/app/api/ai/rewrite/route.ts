import { getUser, jsonError } from "@/lib/api-helpers";
import { getUserDecryptedApiKey } from "@/lib/api-key-guard";
import { generateStream } from "@/lib/ai/client";
import { WARM_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { NextRequest } from "next/server";
import { checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit";
import { formatZodError, aiRewriteSchema } from "@/lib/validations";

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

  const systemPrompt = WARM_SYSTEM_PROMPT;
  const userPrompt = `原始日记如下：

${content}

用户想：${instruction}

请根据用户的要求重新输出润色后的日记，保持 Markdown 格式。`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generateStream({
          apiKey,
          provider,
          systemPrompt,
          userPrompt,
        })) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
          );
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (error) {
        console.error("[AI Rewrite] stream error:", error instanceof Error ? error.message : error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "改写失败，请稍后再试" })}\n\n`)
        );
      } finally {
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