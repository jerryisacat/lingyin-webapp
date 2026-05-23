import { getUser, jsonError } from "@/lib/api-helpers";
import { getUserDecryptedApiKey } from "@/lib/api-key-guard";
import { generateDiary } from "@/lib/diary";
import { NextRequest } from "next/server";
import { checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit";
import { formatZodError, aiGenerateSchema } from "@/lib/validations";

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

  const apiKey = await getUserDecryptedApiKey(user.id, provider);
  if (!apiKey) {
    return jsonError("API Key not configured for this provider — configure it in Settings", 400);
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
            encoder.encode(`data: ${JSON.stringify({ error: "生成超时，请稍后重试" })}\n\n`)
          )
          controller.close()
        }
      }, 8_000)

      try {
        for await (const chunk of generator) {
          if (aborted) break
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
          );
        }
        if (!aborted) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        }
      } catch (error) {
        console.error("[AI Generate] stream error:", error instanceof Error ? error.message : error);
        if (!aborted) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "生成失败，请稍后再试" })}\n\n`)
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