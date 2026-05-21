"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocalApiKey } from "@/hooks/useLocalApiKey";
import type { ApiProvider } from "@/types";
import {
  Key,
  Eye,
  EyeOff,
  Zap,
  Loader2,
  CheckCircle2,
  XCircle,
  Shield,
} from "lucide-react";

const PROVIDERS: { value: ApiProvider; label: string; description: string }[] =
  [
    {
      value: "openai",
      label: "OpenAI",
      description: "GPT-4o-mini，速度快效果好",
    },
    {
      value: "deepseek",
      label: "DeepSeek",
      description: "国产大模型，性价比高",
    },
    {
      value: "gemini",
      label: "Google Gemini",
      description: "Gemini 2.0 Flash，多模态强",
    },
  ];

export default function SettingsPage() {
  const { provider, apiKey, setProvider, setApiKey, clearApiKey, isConfigured } =
    useLocalApiKey();

  const [draftApiKey, setDraftApiKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [testError, setTestError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleProviderChange = (p: ApiProvider) => {
    setProvider(p);
    setTestStatus("idle");
  };

  const handleSave = () => {
    setApiKey(draftApiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    if (!draftApiKey) return;
    setTestStatus("testing");
    setTestError("");

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ provider, apiKey: draftApiKey }),
      });

      const json = await res.json();
      if (json.data?.connected) {
        setTestStatus("success");
      } else {
        setTestStatus("error");
        setTestError(json.data?.error ?? "未知错误");
      }
    } catch {
      setTestStatus("error");
      setTestError("网络错误，请检查连接");
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">设置</h1>
        <p className="mt-1 text-sm text-ink-light">
          配置你的 AI 服务，铃英需要它来帮你写日记
        </p>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-sakura" strokeWidth={1.5} />
          <h2 className="text-lg font-medium text-ink">API 密钥</h2>
        </div>

        <p className="text-sm text-ink-light leading-relaxed">
          选择一个 AI 服务商，并填入你的 API Key。密钥只保存在你的浏览器本地，不会上传到我们的服务器。
        </p>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-ink">AI 服务商</legend>
          <div className="space-y-2">
            {PROVIDERS.map((p) => {
              const checked = provider === p.value;
              return (
                <label
                  key={p.value}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                    checked
                      ? "border-sakura bg-sakura/5"
                      : "border-surface-border hover:border-surface-border/80"
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                      checked
                        ? "border-sakura bg-sakura"
                        : "border-surface-border"
                    }`}
                  >
                    {checked && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink">
                      {p.label}
                    </div>
                    <div className="text-xs text-ink-light">
                      {p.description}
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="provider"
                    value={p.value}
                    checked={checked}
                    onChange={() => handleProviderChange(p.value)}
                    className="sr-only"
                  />
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="space-y-2">
          <label htmlFor="api-key" className="text-sm font-medium text-ink">
            API Key
          </label>
          <div className="relative">
            <input
              id="api-key"
              type={showKey ? "text" : "password"}
              value={draftApiKey}
              onChange={(e) => {
                setDraftApiKey(e.target.value);
                setTestStatus("idle");
                setSaved(false);
              }}
              placeholder={provider === "openai" ? "sk-..." : "输入你的 API Key"}
              className="input-field pr-10 font-mono text-sm"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink transition-colors"
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={!draftApiKey || testStatus === "testing"}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            {testStatus === "testing" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                测试中...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                测试连接
              </>
            )}
          </button>

          {testStatus === "success" && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              连接成功
            </span>
          )}
          {testStatus === "error" && (
            <span className="flex items-center gap-1 text-sm text-red-500">
              <XCircle className="h-4 w-4" />
              {testError}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!draftApiKey}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {saved ? "已保存 ✓" : "保存设置"}
        </button>
      </div>

      {isConfigured && (
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-dusty-blue" strokeWidth={1.5} />
            <h2 className="text-lg font-medium text-ink">
              当前配置
            </h2>
          </div>
          <p className="text-sm text-ink-light">
            已配置{" "}
            <span className="font-medium text-ink">
              {PROVIDERS.find((p) => p.value === provider)?.label}
            </span>{" "}
            的 API Key。你的密钥是安全的，不会泄漏。
          </p>
          <button
            type="button"
            onClick={clearApiKey}
            className="btn-ghost text-sm text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            清除 API Key
          </button>
        </div>
      )}

      <div className="card space-y-3">
        <h2 className="text-lg font-medium text-ink">关于</h2>
        <p className="text-sm text-ink-light leading-relaxed">
          铃英日记是一个 AI 驱动的日记 PWA。你的日记内容和图片存储在云端，
          API Key 只保存在浏览器本地。我们不会存储或记录你的密钥。
        </p>
        <p className="text-xs text-ink-light">Version 0.1.0 — Phase 1 MVP</p>
      </div>
    </div>
  );
}
