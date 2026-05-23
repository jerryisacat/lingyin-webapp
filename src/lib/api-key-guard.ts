import type { ApiProvider } from "@/types";

export function getSystemApiKey(provider: ApiProvider): string | null {
  if (provider === "openrouter") {
    return process.env.OPENROUTER_API_KEY ?? null;
  }
  return null;
}

export function isSystemApiKeyAvailable(provider: ApiProvider): boolean {
  return getSystemApiKey(provider) !== null;
}
