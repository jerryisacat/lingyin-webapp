"use client"

import { useActionState, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BookOpen, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react"
import { resetPasswordAction } from "@/lib/auth-actions"

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const router = useRouter()
  const token = searchParams.token
  const [state, action, pending] = useActionState(resetPasswordAction, null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

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

      <form action={action} className="w-full max-w-sm space-y-4">
        <input type="hidden" name="token" value={token} />

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-ink">
            新密码
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
              autoFocus
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
