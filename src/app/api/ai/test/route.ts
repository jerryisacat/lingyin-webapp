import OpenAI from "openai";
import { getUser, jsonError, jsonOk } from "@/lib/api-helpers";
import { getUserDecryptedApiKey } from "@/lib/api-key-guard";
import { createOpenAIClient, PROVIDER_CONFIGS } from "@/lib/ai/client";
import { NextRequest } from "next/server";
import { checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit";
import { formatZodError, aiTestSchema } from "@/lib/validations";

/** Log detailed error diagnostics for Vercel debugging */
function logConnectionError(error: unknown, context: Record<string, unknown> = {}) {
  const err = error instanceof Error ? error : new Error(String(error));
  const cause = (err as Error & { cause?: unknown }).cause;

  console.error("[API Test] Connection failed:", {
    message: err.message,
    name: err.name,
    isAPIConnectionError: error instanceof OpenAI.APIConnectionError,
    causeName: cause instanceof Error ? cause.name : typeof cause,
    causeMessage: cause instanceof Error ? cause.message : String(cause ?? "N/A"),
    causeCode: (cause as NodeJS.ErrnoException)?.code ?? "N/A",
    stack: err.stack?.slice(0, 500),
    ...context,
  });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { success, reset } = await checkRateLimit(rateLimiters.aiTest, user.id);
  if (!success) return rateLimitError(reset);

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parseResult = aiTestSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return jsonError(formatZodError(parseResult.error), 400);
  }

  const { provider, apiKey: bodyApiKey } = parseResult.data;

  const apiKey = bodyApiKey || (await getUserDecryptedApiKey(user.id, provider));
  if (!apiKey) {
    return jsonError("API Key is required to test connection", 400);
  }

  const config = PROVIDER_CONFIGS[provider];
  const model = config.defaultModel;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const client = createOpenAIClient(apiKey, provider);

    const response = await client.chat.completions.create(
      {
        model,
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 5,
      },
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    if (!response.choices || response.choices.length === 0) {
      return jsonOk({ connected: false, error: "No response from API" });
    }

    return jsonOk({ connected: true });
  } catch (error) {
    logConnectionError(error, {
      provider,
      model,
      baseURL: config.baseURL,
    });

    if (error instanceof DOMException && error.name === "AbortError") {
      return jsonOk({
        connected: false,
        error: "Connection timed out after 15 seconds",
        detail: "The API request timed out — please verify your API key and try again.",
      });
    }

    const message = error instanceof Error ? error.message : "Connection failed";

    const detail =
      error instanceof OpenAI.AuthenticationError
        ? "API Key is invalid or expired — please check your OpenRouter key."
        : error instanceof OpenAI.RateLimitError
          ? "Rate limited — your OpenRouter account may have run out of credits."
          : `API call failed: ${message}`;

    return jsonOk({ connected: false, error: message, detail });
  }
}
