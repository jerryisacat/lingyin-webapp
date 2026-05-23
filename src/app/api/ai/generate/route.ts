import { getUser, jsonError } from "@/lib/api-helpers";
import { getUserDecryptedApiKey } from "@/lib/api-key-guard";
import { generateDiary } from "@/lib/diary";
import type { ApiProvider, Tone } from "@/types";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  let body: {
    text?: string;
    images?: { url: string; path: string; type: string; mime: string; size: number }[];
    tone?: Tone;
    date?: string;
    provider?: ApiProvider;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const {
    text = "",
    images = [],
    tone = "warm",
    date = new Date().toISOString().slice(0, 10),
    provider = "openrouter",
  } = body;

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
      try {
        for await (const chunk of generator) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
          );
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (error) {
        console.error("[AI Generate] stream error:", error instanceof Error ? error.message : error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "生成失败，请稍后再试" })}\n\n`)
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