"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { BookOpen, Loader2, CheckCircle } from "lucide-react"

interface FormState {
  ok: boolean
  error: string
}

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useState<FormState | null>(null)

  function handleSubmit(formData: FormData) {
    const email = formData.get("email") as string

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        })
        const data = await res.json()
        setState(data)
      } catch {
        setState({ ok: false, error: "网络错误，请稍后再试" })
      }
    })
  }

  if (state?.ok) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-bold text-ink">邮件已发送</h1>
        <p className="text-center text-sm text-ink-light">
          如果该邮箱已注册，我们已发送密码重置链接。请查收邮件并点击链接完成重置。
        </p>
        <Link href="/login" className="btn-primary inline-flex items-center gap-2">
          返回登录
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sakura/10">
          <BookOpen className="h-8 w-8 text-sakura" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          忘记密码
        </h1>
        <p className="text-center text-sm text-ink-light">
          输入注册时使用的邮箱，我们会发送密码重置链接
        </p>
      </div>

      <form action={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">
            邮箱地址
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="hello@example.com"
            required
            className="input-field"
            autoFocus
          />
        </div>

        {state?.error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="btn-primary flex w-full items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              发送中...
            </>
          ) : (
            "发送重置链接"
          )}
        </button>

        <p className="text-center text-sm text-ink-light">
          <Link href="/login" className="text-sakura hover:text-sakura-dark transition-colors">
            返回登录
          </Link>
        </p>
      </form>
    </div>
  )
}
