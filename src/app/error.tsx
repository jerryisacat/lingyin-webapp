"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold text-ink">出错了</h1>
      <p className="text-sm text-ink/60">
        {process.env.NODE_ENV === "development"
          ? error.message
          : "页面遇到了意外错误，请稍后重试"}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-sakura px-6 py-2 text-sm text-white transition hover:opacity-90"
        >
          重试
        </button>
        <a
          href="/"
          className="rounded-lg border border-sakura/30 px-6 py-2 text-sm text-ink-light transition hover:bg-sakura/5"
        >
          返回首页
        </a>
      </div>
    </div>
  )
}
