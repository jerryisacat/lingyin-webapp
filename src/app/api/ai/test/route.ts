import { getUser, jsonError, jsonOk } from "@/lib/api-helpers";
import { getUserDecryptedApiKey } from "@/lib/api-key-guard";
import type { ApiProvider } from "@/types";
import { NextRequest } from "next/server";

const CHAT_MODELS: Record<ApiProvider, string> = {
  openai: "gpt-4o-mini",
  deepseek: "deepseek-chat",
  gemini: "gemini-2.0-flash",
};

const BASE_URLS: Record<ApiProvider, string> = {
  openai: "https://api.openai.com/v1",
  deepseek: "https://api.deepseek.com",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
};

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  let body: { provider?: ApiProvider; apiKey?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const { provider = "openai", apiKey: bodyApiKey } = body;

  const validProviders: ApiProvider[] = ["openai", "deepseek", "gemini"];
  if (!validProviders.includes(provider)) {
    return jsonError(`Unknown provider: ${provider}`, 400);
  }

  const apiKey = bodyApiKey || (await getUserDecryptedApiKey(user.id, provider));
  if (!apiKey) {
    return jsonError("API Key is required to test connection", 400);
  }

  const baseURL = BASE_URLS[provider];
  const model = CHAT_MODELS[provider];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 5,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API returned status ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch {
        // use raw status
      }
      return jsonOk({ connected: false, error: errorMessage });
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
