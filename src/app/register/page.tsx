"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { BookOpen, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react"
import { registerAction } from "@/lib/auth-actions"

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  if (state?.ok) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            注册成功
          </h1>
          <p className="text-center text-sm text-ink-light">
            我们已向你的邮箱发送了验证链接，请查收邮件并完成验证。
          </p>
          <Link href="/login" className="btn-primary inline-flex items-center gap-2">
            前往登录
          </Link>
          <p className="text-xs text-ink-light/70">
            没收到邮件？检查垃圾箱或稍后重试。
          </p>
        </div>
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
          注册玲音日记
        </h1>
      </div>

      <form action={action} className="w-full max-w-sm space-y-4">
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

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-ink">
            密码
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="至少 8 个字符"
              required
              minLength={8}
              className="input-field pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-ink">
            确认密码
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="再次输入密码"
              required
              className="input-field pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {state?.error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn-primary flex w-full items-center justify-center gap-2"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              注册中...
            </>
          ) : (
            "注册"
          )}
        </button>

        <p className="text-center text-sm text-ink-light">
          已有账号？{" "}
          <Link href="/login" className="text-sakura hover:text-sakura-dark transition-colors">
            登录
          </Link>
        </p>
      </form>
    </div>
  )
}
