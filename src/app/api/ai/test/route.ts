import { getUser, jsonError, jsonOk } from "@/lib/api-helpers";
import { getUserDecryptedApiKey } from "@/lib/api-key-guard";
import { createOpenAIClient, PROVIDER_CONFIGS } from "@/lib/ai/client";
import type { ApiProvider } from "@/types";
import { NextRequest } from "next/server";

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
    if (error instanceof DOMException && error.name === "AbortError") {
      return jsonOk({ connected: false, error: "Connection timed out after 15 seconds" });
    }
    const message = error instanceof Error ? error.message : "Connection failed";
    return jsonOk({ connected: false, error: message });
  }
}
