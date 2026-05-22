import OpenAI from "openai";
import type { ApiProvider } from "@/types";

export interface ProviderConfig {
  baseURL: string;
  defaultModel: string;
  defaultVisionModel: string;
  defaultHeaders?: Record<string, string>;
}

export const PROVIDER_CONFIGS: Record<ApiProvider, ProviderConfig> = {
  openrouter: {
    baseURL: "https://openrouter.ai/api/v1",
    defaultModel: "deepseek/deepseek-v4-flash",
    defaultVisionModel: "qwen/qwen3.6-plus",
    defaultHeaders: {
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        "http://localhost:3000",
      "X-Title": "LingYin Diary",
    },
  },
};

export function createOpenAIClient(apiKey: string, provider: ApiProvider): OpenAI {
  const config = PROVIDER_CONFIGS[provider];
  const headers: Record<string, string> = { ...config.defaultHeaders };
  return new OpenAI({
    apiKey,
    baseURL: config.baseURL,
    defaultHeaders: headers,
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
  const model = PROVIDER_CONFIGS[provider].defaultModel;

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
  const model = PROVIDER_CONFIGS[provider].defaultVisionModel;

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
