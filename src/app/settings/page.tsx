"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { useEncryption } from "@/hooks/useEncryptionPassword"
import { EncryptionSettings } from "@/components/EncryptionSettings"
import { SetEncryptionPasswordModal } from "@/components/SetEncryptionPasswordModal"
import type { SubscriptionData } from "@/types"
import { WritingStyleConfig } from "@/components/WritingStyleConfig"
import {
  LogOut,
  Sparkles,
  Crown,
  TrendingUp,
  ArrowRight,
  Download,
} from "lucide-react"

export default function SettingsPage() {
  const { unlock } = useEncryption()
  const router = useRouter()

  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [subLoading, setSubLoading] = useState(true)

  const [showEncryptionModal, setShowEncryptionModal] = useState(false)
  const [encryptionModalMode, setEncryptionModalMode] = useState<"set" | "change">("set")

  const handleExport = async () => {
    try {
      const res = await fetch("/api/export")
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const disposition = res.headers.get("Content-Disposition") ?? ""
      const match = disposition.match(/filename="(.+)"/)
      a.href = url
      a.download = match?.[1] ?? "lingyin-export.json"
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    fetch("/api/subscription/status")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) setSubscription(json.data.subscription)
      })
      .catch(() => {})
      .finally(() => setSubLoading(false))
  }, [])

  const handleSignOut = async () => {
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    }
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">设置</h1>
        <p className="mt-1 text-sm text-ink-light">
          管理你的玲音日记设置
        </p>
      </div>

      <EncryptionSettings
        onSetPassword={() => {
          setEncryptionModalMode("set")
          setShowEncryptionModal(true)
        }}
        onChangePassword={() => {
          setEncryptionModalMode("change")
          setShowEncryptionModal(true)
        }}
        onResetPassword={() => {}}
      />

      <WritingStyleConfig embedded />

      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          {subscription?.plan === "advanced" ? (
            <Crown className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
          ) : subscription?.plan === "basic" ? (
            <TrendingUp className="h-5 w-5 text-sakura" strokeWidth={1.5} />
          ) : (
            <Sparkles className="h-5 w-5 text-sakura" strokeWidth={1.5} />
          )}
          <h2 className="text-lg font-medium text-ink">订阅方案</h2>
        </div>

        {subLoading ? (
          <div className="flex items-center justify-center py-3">
            <div className="w-5 h-5 border-2 border-sakura border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <p className="text-sm text-ink-light leading-relaxed">
              当前方案:{" "}
              <span className="font-medium text-ink">
                {subscription?.plan === "basic"
                  ? "🌸 基础版"
                  : subscription?.plan === "advanced"
                    ? "💎 高级版"
                    : "🆓 免费版"}
              </span>
              {subscription?.currentPeriodEnd && (
                <>
                  {" · "}
                  到期: {new Date(subscription.currentPeriodEnd).toLocaleDateString("zh-CN")}
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => router.push("/subscription")}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Sparkles className="h-4 w-4" />
              查看方案
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-dusty-blue" strokeWidth={1.5} />
          <h2 className="text-lg font-medium text-ink">数据导出</h2>
        </div>
        <p className="text-sm text-ink-light leading-relaxed">
          导出你所有的日记内容为 JSON 文件，方便备份或迁移到其他平台。
        </p>
        <button
          type="button"
          onClick={handleExport}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <Download className="h-4 w-4" />
          导出所有日记
        </button>
      </div>

      <div className="card space-y-3">
        <h2 className="text-lg font-medium text-ink">关于</h2>
        <p className="text-sm text-ink-light leading-relaxed">
          玲音日记是一个 AI 驱动的日记 PWA。你的日记内容和图片存储在云端，
          LLM 调用由服务器统一管理。
        </p>
        <p className="text-xs text-ink-light">Version 1.0.0</p>
      </div>

      <div className="card space-y-3 border-red-200/50 bg-red-50/30">
        <div className="flex items-center gap-2">
          <LogOut className="h-5 w-5 text-red-400" strokeWidth={1.5} />
          <h2 className="text-lg font-medium text-ink">退出登录</h2>
        </div>
        <p className="text-sm text-ink-light leading-relaxed">
          退出后需要重新登录才能访问你的日记。会话将被清除，但日记内容不受影响。
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-600 hover:shadow-md active:scale-[0.98]"
        >
          <LogOut className="h-4 w-4" />
          退出登录
        </button>
      </div>

      {showEncryptionModal && (
        <SetEncryptionPasswordModal
          mode={encryptionModalMode}
          onClose={() => setShowEncryptionModal(false)}
          onSuccess={(password, salt) => {
            unlock(password, salt)
            setShowEncryptionModal(false)
          }}
        />
      )}
    </div>
  )
}
