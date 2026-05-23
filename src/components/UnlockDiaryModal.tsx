"use client"

import { useState, useEffect, useRef } from "react"
import { Lock, X, Loader2 } from "lucide-react"

interface UnlockDiaryModalProps {
  onUnlock: (password: string) => Promise<boolean>
  onClose: () => void
}

const MAX_ATTEMPTS = 5
const LOCK_DURATION_MS = 5 * 60 * 1000

export function UnlockDiaryModal({ onUnlock, onClose }: UnlockDiaryModalProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    inputRef.current?.focus()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (lockedUntil) {
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, lockedUntil - Date.now())
        setTimeLeft(remaining)
        if (remaining <= 0) {
          setLockedUntil(null)
          setAttempts(0)
          if (timerRef.current) clearInterval(timerRef.current)
        }
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [lockedUntil])

  const isLocked = lockedUntil !== null && timeLeft > 0

  const handleUnlock = async () => {
    if (!password || loading || isLocked) return
    setLoading(true)
    setError("")

    try {
      const success = await onUnlock(password)
      if (!success) {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        if (newAttempts >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCK_DURATION_MS)
          setError(`密码错误次数过多，请 ${Math.ceil(LOCK_DURATION_MS / 60000)} 分钟后再试`)
        } else {
          setError(`密码错误，还剩 ${MAX_ATTEMPTS - newAttempts} 次尝试机会`)
        }
        setPassword("")
      }
    } catch {
      setError("验证失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-dusty-blue" strokeWidth={1.5} />
            <h2 className="text-lg font-medium text-ink">此日记已加密</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-ink-light hover:bg-surface hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 px-6 py-4">
          <p className="text-sm text-ink-light">
            请输入你的日记加密密码来查看内容：
          </p>

          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError("")
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUnlock()
            }}
            placeholder="加密密码"
            className="input-field"
            autoComplete="off"
            disabled={isLocked || loading}
          />

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">
              {error}
            </div>
          )}

          {isLocked && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              锁定中，剩余 {formatTime(timeLeft)}
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
              onClick={handleUnlock}
              disabled={!password || loading || isLocked}
              className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  验证中...
                </>
              ) : (
                "解锁"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
