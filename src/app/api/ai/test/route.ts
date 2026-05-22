import OpenAI from "openai";
import { getUser, jsonError, jsonOk } from "@/lib/api-helpers";
import { getUserDecryptedApiKey } from "@/lib/api-key-guard";
import { createOpenAIClient, PROVIDER_CONFIGS } from "@/lib/ai/client";
import type { ApiProvider } from "@/types";
import { NextRequest } from "next/server";

/** Log detailed error diagnostics for Vercel debugging */
function logConnectionError(error: unknown, context: Record<string, unknown> = {}) {
  const err = error instanceof Error ? error : new Error(String(error));
  const cause = (err as Error & { cause?: unknown }).cause;

  console.error("[API Test] Connection failed:", {
    message: err.message,
    name: err.name,
    isAPIConnectionError: err instanceof OpenAI.APIConnectionError,
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

  let body: { provider?: ApiProvider; apiKey?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const { provider = "openrouter", apiKey: bodyApiKey } = body;

  const validProviders: ApiProvider[] = ["openrouter"];
  if (!validProviders.includes(provider)) {
    return jsonError(`Unknown provider: ${provider}`, 400);
  }

  const apiKey = bodyApiKey || (await getUserDecryptedApiKey(user.id, provider));
  if (!apiKey) {
    return jsonError("API Key is required to test connection", 400);
  }

  const config = PROVIDER_CONFIGS[provider];
  const model = config.defaultModel;

  // Preflight: test basic connectivity to OpenRouter
  let networkReachable = false;
  let networkError = "";
  try {
    const preflight = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    networkReachable = preflight.ok || preflight.status === 401; // 401 means reachable but unauthenticated
    if (!networkReachable) {
      networkError = `OpenRouter returned HTTP ${preflight.status}`;
    }
  } catch (e) {
    networkError = e instanceof Error ? e.message : String(e);
  }

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
      networkReachable,
      networkError,
    });

    if (error instanceof DOMException && error.name === "AbortError") {
      return jsonOk({
        connected: false,
        error: "Connection timed out after 15 seconds",
        detail: networkReachable
          ? "OpenRouter is reachable but the API request timed out"
          : `Cannot reach OpenRouter at all: ${networkError}`,
      });
    }

    const message = error instanceof Error ? error.message : "Connection failed";

    // Provide actionable diagnostics
    const detail = !networkReachable
      ? `Network unreachable — Vercel serverless function cannot connect to OpenRouter (${networkError}). Please check if the Vercel region (hkg1) allows outbound connections to openrouter.ai.`
      : error instanceof OpenAI.AuthenticationError
        ? "API Key is invalid or expired — please check your OpenRouter key."
        : error instanceof OpenAI.RateLimitError
          ? "Rate limited — your OpenRouter account may have run out of credits."
          : `API call failed: ${message}`;

    return jsonOk({ connected: false, error: message, detail });
  }
}
