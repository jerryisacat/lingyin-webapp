"use client"

import { useState } from "react"
import { Shield, X, Loader2, AlertTriangle, Check } from "lucide-react"

interface SetEncryptionPasswordModalProps {
  onClose: () => void
  onSuccess: (password: string, salt: string) => void
  mode: "set" | "change"
}

export function SetEncryptionPasswordModal({
  onClose,
  onSuccess,
  mode,
}: SetEncryptionPasswordModalProps) {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const canSubmit =
    password.length >= 8 &&
    /[a-zA-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    password === confirm &&
    confirmed &&
    !loading

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/user/encryption-password", {
        method: mode === "set" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      const json = await res.json()

      if (!json.ok) {
        setError(json.error ?? "操作失败")
        return
      }

      onSuccess(password, json.data.salt)
    } catch {
      setError("网络错误，请重试")
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength =
    password.length >= 12 ? "强" : password.length >= 8 ? "中" : "弱"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-sakura" strokeWidth={1.5} />
            <h2 className="text-lg font-medium text-ink">
              {mode === "set" ? "设置日记加密密码" : "修改加密密码"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-ink-light hover:bg-surface hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              <div className="text-xs text-amber-800 space-y-1">
                <p className="font-medium">重要提醒</p>
                <p>此密码无法通过「忘记密码」找回</p>
                <p>丢失密码将永久失去所有日记内容</p>
                <p>请妥善保管，建议写在纸上备份</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">加密密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 8 位，含字母和数字"
              className="input-field"
              autoComplete="off"
            />
            {password && (
              <p
                className={`text-xs ${
                  passwordStrength === "强"
                    ? "text-green-600"
                    : passwordStrength === "中"
                      ? "text-amber-600"
                      : "text-red-500"
                }`}
              >
                密码强度：{passwordStrength}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">确认密码</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="再次输入密码"
              className="input-field"
              autoComplete="off"
            />
            {confirm && password !== confirm && (
              <p className="text-xs text-red-500">两次输入的密码不一致</p>
            )}
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-surface-border text-sakura focus:ring-sakura"
            />
            <span className="text-xs text-ink-light leading-relaxed">
              我已理解：丢失密码 = 数据永久不可恢复
            </span>
          </label>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 text-sm"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === "set" ? "设置中..." : "修改中..."}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {mode === "set" ? "确认设置" : "确认修改"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
