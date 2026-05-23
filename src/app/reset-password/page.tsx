"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { BookOpen, Loader2, CheckCircle } from "lucide-react"
import PasswordInput from "@/components/auth/PasswordInput"

interface FormState {
  ok: boolean
  error: string
}

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useState<FormState | null>(null)

  if (!token) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6">
        <h1 className="text-xl font-bold text-ink">无效的重置链接</h1>
        <p className="text-center text-sm text-ink-light">
          缺少重置令牌。请从邮件中的链接访问此页面。
        </p>
        <Link href="/forgot-password" className="btn-primary inline-flex items-center gap-2">
          重新申请
        </Link>
      </div>
    )
  }

  function handleSubmit(formData: FormData) {
    const body = {
      token,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
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
        <h1 className="text-xl font-bold text-ink">密码已重置</h1>
        <p className="text-center text-sm text-ink-light">
          现在可以使用新密码登录了。
        </p>
        <Link href="/login" className="btn-primary inline-flex items-center gap-2">
          前往登录
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
          设置新密码
        </h1>
      </div>

      <form action={handleSubmit} className="w-full max-w-sm space-y-4">
        <PasswordInput
          id="password"
          name="password"
          label="新密码"
          placeholder="至少 12 个字符"
          required
          minLength={12}
          autoFocus
        />

        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="确认密码"
          placeholder="再次输入密码"
          required
        />

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
              重置中...
            </>
          ) : (
            "重置密码"
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
