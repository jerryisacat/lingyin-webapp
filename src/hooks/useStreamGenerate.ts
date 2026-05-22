"use client";

import { useState, useRef, useCallback } from "react";
import type { ApiProvider, MediaFile } from "@/types";

interface UseStreamGenerateOptions {
  text: string;
  images: MediaFile[];
  date: string;
  provider: ApiProvider;
  tone: string;
}

interface UseStreamGenerateReturn {
  text: string;
  isStreaming: boolean;
  error: string | null;
  generate: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

export function useStreamGenerate(
  options: UseStreamGenerateOptions
): UseStreamGenerateReturn {
  const { text, images, date, provider, tone } = options;

  const [output, setOutput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setOutput("");
    setError(null);
  }, [stop]);

  const generate = useCallback(async () => {
    setError(null);
    setOutput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, images, date, tone, provider }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            setIsStreaming(false);
            abortRef.current = null;
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.content) {
              setOutput((prev) => prev + parsed.content);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      setIsStreaming(false);
      abortRef.current = null;
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setIsStreaming(false);
        abortRef.current = null;
        return;
      }
      const message =
        e instanceof Error ? e.message : "Generation failed";
      setError(message);
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [text, images, date, provider, tone]);

  return { text: output, isStreaming, error, generate, stop, reset };
}
