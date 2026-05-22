import { getUser, jsonError } from "@/lib/api-helpers";
import { getUserDecryptedApiKey } from "@/lib/api-key-guard";
import { generateStream } from "@/lib/ai/client";
import { WARM_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import type { ApiProvider } from "@/types";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  let body: { content?: string; instruction?: string; provider?: ApiProvider };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const {
    content = "",
    instruction = "请润色这篇日记，让语言更优美流畅",
    provider = "openrouter",
  } = body;

  if (!content.trim()) {
    return jsonError("Content is required");
  }

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
        const message =
          error instanceof Error ? error.message : "Rewrite failed";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
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