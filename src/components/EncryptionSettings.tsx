"use client"

import { useState, useEffect, useCallback } from "react"
import { Shield, CheckCircle, Loader2, RefreshCw, Lock } from "lucide-react"
import { useEncryption } from "@/hooks/useEncryptionPassword"

interface MigrationStatus {
  totalEntries: number
  encryptedEntries: number
  plainEntries: number
  needsMigration: boolean
}

interface EncryptionSettingsProps {
  onSetPassword: () => void
  onChangePassword: () => void
  onResetPassword: () => void
}

export function EncryptionSettings({
  onSetPassword,
  onChangePassword,
  onResetPassword,
}: EncryptionSettingsProps) {
  const { isUnlocked, session, lock } = useEncryption()

  const [status, setStatus] = useState<{
    hasEncryptionPassword: boolean
    salt: string | null
  } | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [migrateStatus, setMigrateStatus] = useState<MigrationStatus | null>(null)
  const [migrating, setMigrating] = useState(false)
  const [migrateProgress, setMigrateProgress] = useState({ current: 0, total: 0 })
  const [migrateError, setMigrateError] = useState("")

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/user/encryption-password/status")
      const json = await res.json()
      if (json.ok) setStatus(json.data)
    } catch {
      // ignore
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  const fetchMigrateStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/diary/migrate-status")
      const json = await res.json()
      if (json.ok) setMigrateStatus(json.data)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    fetchMigrateStatus()
  }, [fetchStatus, fetchMigrateStatus])

  const handleMigrate = async () => {
    if (!isUnlocked || !session.salt || !session.password) return
    setMigrating(true)
    setMigrateError("")

    try {
      const res = await fetch("/api/diary/migrate-encrypt")
      const json = await res.json()
      if (!json.ok) {
        setMigrateError(json.error ?? "获取待迁移日记失败")
        setMigrating(false)
        return
      }

      const entries: { entryId: string; date: string }[] = json.data.entries
      if (entries.length === 0) {
        setMigrating(false)
        await fetchMigrateStatus()
        return
      }

      setMigrateProgress({ current: 0, total: entries.length })

      const { encryptMarkdown } = await import("@/lib/client-crypto")

      for (let i = 0; i < entries.length; i++) {
        const { entryId, date } = entries[i]

        const entryRes = await fetch(`/api/entries/${entryId}`)
        const entryJson = await entryRes.json()
        if (!entryJson.ok || !entryJson.data?.markdown) {
          setMigrateError(`读取日记失败: ${entryId}`)
          continue
        }

        const encrypted = await encryptMarkdown(
          entryJson.data.markdown,
          session.password,
          session.salt
        )

        const uploadRes = await fetch("/api/diary/migrate-encrypt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId, encryptedMarkdown: encrypted, date }),
        })

        if (!uploadRes.ok) {
          const errJson = await uploadRes.json()
          setMigrateError(errJson.error ?? `迁移失败: ${entryId}`)
          continue
        }

        setMigrateProgress((prev) => ({ ...prev, current: i + 1 }))
      }

      await fetchMigrateStatus()
    } catch (e) {
      setMigrateError(e instanceof Error ? e.message : "迁移失败")
    } finally {
      setMigrating(false)
    }
  }

  if (loadingStatus) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-ink-light" />
        </div>
      </div>
    )
  }

  const hasPassword = status?.hasEncryptionPassword ?? false

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-sakura" strokeWidth={1.5} />
        <h2 className="text-lg font-medium text-ink">日记端到端加密</h2>
      </div>

      {hasPassword ? (
        <>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">已激活</span>
          </div>
          <p className="text-sm text-ink-light">
            你的日记内容以密文存储，即使服务器管理员也无法读取。
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onChangePassword}
              className="btn-secondary text-sm"
            >
              修改加密密码
            </button>
            <button
              type="button"
              onClick={onResetPassword}
              className="btn-ghost text-sm text-red-500 hover:bg-red-50"
            >
              取消加密
            </button>
          </div>

          {migrateStatus?.needsMigration && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-3">
              <p className="text-sm text-amber-800">
                你有 {migrateStatus.plainEntries} 篇明文日记尚未加密。建议进行迁移以保护隐私。
              </p>
              {migrating ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-ink-light">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    迁移中... {migrateProgress.current}/{migrateProgress.total}
                  </div>
                  <div className="h-2 rounded-full bg-surface-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sakura transition-all duration-300"
                      style={{
                        width: `${
                          migrateProgress.total > 0
                            ? (migrateProgress.current / migrateProgress.total) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleMigrate}
                  className="btn-secondary flex items-center gap-2 text-sm"
                  disabled={!isUnlocked}
                >
                  <RefreshCw className="h-4 w-4" />
                  开始迁移
                </button>
              )}
              {migrateError && (
                <p className="text-sm text-red-500">{migrateError}</p>
              )}
            </div>
          )}

          {migrateStatus && !migrateStatus.needsMigration && (
            <p className="text-xs text-ink-light">所有日记已加密。</p>
          )}

          {isUnlocked && (
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600">加密密码已解锁，当前会话有效</span>
              <button
                type="button"
                onClick={lock}
                className="btn-ghost text-xs text-dusty-blue underline"
              >
                立即锁定
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-ink-light leading-relaxed">
            设置加密密码后，你的日记内容将以密文存储，即使服务器管理员也无法读取。
          </p>
          <button
            type="button"
            onClick={onSetPassword}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Shield className="h-4 w-4" />
            设置加密密码
          </button>
        </>
      )}
    </div>
  )
}
