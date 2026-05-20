import OpenAI from "openai";
import type { ApiProvider } from "@/types";

interface ProviderConfig {
  baseURL?: string;
}

const PROVIDER_CONFIGS: Record<ApiProvider, ProviderConfig> = {
  openai: {},
  deepseek: { baseURL: "https://api.deepseek.com" },
  gemini: { baseURL: "https://generativelanguage.googleapis.com/v1beta/openai" },
};

const CHAT_MODELS: Record<ApiProvider, string> = {
  openai: "gpt-4o-mini",
  deepseek: "deepseek-chat",
  gemini: "gemini-2.0-flash",
};

const VISION_MODELS: Record<ApiProvider, string> = {
  openai: "gpt-4o-mini",
  deepseek: "deepseek-chat",
  gemini: "gemini-2.0-flash",
};

function createOpenAIClient(apiKey: string, provider: ApiProvider): OpenAI {
  const config = PROVIDER_CONFIGS[provider];
  return new OpenAI({
    apiKey,
    baseURL: config.baseURL,
  });
}

export async function* generateStream(params: {
  apiKey: string;
  provider: ApiProvider;
  systemPrompt: string;
  userPrompt: string;
}): AsyncGenerator<string> {
  const { apiKey, provider, systemPrompt, userPrompt } = params;
  const client = createOpenAIClient(apiKey, provider);
  const model = CHAT_MODELS[provider];

  const stream = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) yield content;
  }
}

export async function describeImage(params: {
  apiKey: string;
  provider: ApiProvider;
  imageUrl: string;
  prompt: string;
}): Promise<string> {
  const { apiKey, provider, imageUrl, prompt } = params;
  const client = createOpenAIClient(apiKey, provider);
  const model = VISION_MODELS[provider];

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 200,
    });

    return response.choices[0]?.message?.content ?? "";
  } catch {
    return "[图片]";
  }
}

export async function describeImages(params: {
  apiKey: string;
  provider: ApiProvider;
  imageUrls: string[];
  prompt: string;
}): Promise<string[]> {
  const { apiKey, provider, imageUrls, prompt } = params;

  const results = await Promise.allSettled(
    imageUrls.map((url) =>
      describeImage({ apiKey, provider, imageUrl: url, prompt })
    )
  );

  return results.map((r) =>
    r.status === "fulfilled" ? r.value : "[图片]"
  );
}