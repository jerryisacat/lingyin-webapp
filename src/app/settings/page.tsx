"use client"

import { useState, useEffect } from "react"
import { useApiKeys } from "@/hooks/useApiKeys"
import type { ApiProvider } from "@/types"
import {
  Key,
  Eye,
  EyeOff,
  Zap,
  Loader2,
  CheckCircle2,
  XCircle,
  Shield,
} from "lucide-react"

const STORAGE_KEY = "lingyin-api-config"

const PROVIDERS: { value: ApiProvider; label: string; description: string }[] = [
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
]

export default function SettingsPage() {
  const { keys, loading, saveKey, deleteKey, hasKey } = useApiKeys()

  const [provider, setProvider] = useState<ApiProvider>("openai")
  const [draftApiKey, setDraftApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle")
  const [testError, setTestError] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState("")

  useEffect(() => {
    if (keys.length > 0) {
      const configured = PROVIDERS.find((p) => hasKey(p.value))
      if (configured) {
        setProvider(configured.value)
      }
    }
  }, [keys, hasKey])

  const handleProviderChange = (p: ApiProvider) => {
    setProvider(p)
    setDraftApiKey("")
    setTestStatus("idle")
    setTestError("")
    setSaved(false)
    setSaveError("")
  }

  const handleSave = async () => {
    if (!draftApiKey) return
    setSaving(true)
    setSaveError("")
    setSaved(false)

    try {
      await saveKey(provider, draftApiKey)
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ provider, apiKey: draftApiKey })
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteKey(provider)
      localStorage.removeItem(STORAGE_KEY)
      setDraftApiKey("")
      setTestStatus("idle")
      setTestError("")
      setSaved(false)
      setSaveError("")
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "删除失败")
    }
  }

  const handleTest = async () => {
    if (!draftApiKey) return
    setTestStatus("testing")
    setTestError("")

    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider, apiKey: draftApiKey }),
      })

      const json = await res.json()
      if (json.data?.connected) {
        setTestStatus("success")
      } else {
        setTestStatus("error")
        setTestError(json.data?.error ?? "未知错误")
      }
    } catch {
      setTestStatus("error")
      setTestError("网络错误，请检查连接")
    }
  }

  const isConfigured = hasKey(provider)

  if (loading) {
    return (
      <div className="max-w-lg mx-auto pt-20 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-sakura border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

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
          选择一个 AI 服务商，并填入你的 API Key。密钥已加密存储在服务器端，你可以随时更改或删除。
        </p>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-ink">AI 服务商</legend>
          <div className="space-y-2">
            {PROVIDERS.map((p) => {
              const checked = provider === p.value
              const hasExistingKey = hasKey(p.value)
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink">
                        {p.label}
                      </span>
                      {hasExistingKey && (
                        <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                          已配置
                        </span>
                      )}
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
              )
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
                setDraftApiKey(e.target.value)
                setTestStatus("idle")
                setSaved(false)
                setSaveError("")
              }}
              placeholder={
                provider === "openai" ? "sk-..." : "输入你的 API Key"
              }
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

        {saveError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {saveError}
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={!draftApiKey || saving}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : saved ? (
            "已保存"
          ) : (
            "保存设置"
          )}
        </button>
      </div>

      {isConfigured && (
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-dusty-blue" strokeWidth={1.5} />
            <h2 className="text-lg font-medium text-ink">当前配置</h2>
          </div>
          <p className="text-sm text-ink-light">
            已配置{" "}
            <span className="font-medium text-ink">
              {PROVIDERS.find((p) => p.value === provider)?.label}
            </span>{" "}
            的 API Key。密钥已加密存储在你的账户中。
          </p>
          <button
            type="button"
            onClick={handleDelete}
            className="btn-ghost text-sm text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            删除 API Key
          </button>
        </div>
      )}

      <div className="card space-y-3">
        <h2 className="text-lg font-medium text-ink">关于</h2>
        <p className="text-sm text-ink-light leading-relaxed">
          铃英日记是一个 AI 驱动的日记 PWA。你的日记内容和图片存储在云端，
          API Key 使用 AES-256-GCM 加密存储在服务器端。
        </p>
        <p className="text-xs text-ink-light">Version 0.1.0 — Phase 1 MVP</p>
      </div>
    </div>
  )
}
