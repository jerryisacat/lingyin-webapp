"use client"

import { useState, useTransition } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BookOpen, Loader2 } from "lucide-react"
import PasswordInput from "@/components/auth/PasswordInput"
import VerifyEmailBanner from "@/components/auth/VerifyEmailBanner"

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [showVerifyBanner, setShowVerifyBanner] = useState(false)
  const [loginEmail, setLoginEmail] = useState("")

  function handleSubmit(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) return

    setLoginEmail(email)
    setError("")
    setShowVerifyBanner(false)

    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError("邮箱或密码错误，或邮箱未验证")
        } else if (result?.ok) {
          router.push("/")
          router.refresh()
        }
      } catch {
        setError("登录失败，请稍后再试")
      }
    })
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sakura/10">
          <BookOpen className="h-8 w-8 text-sakura" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          登录玲音日记
        </h1>
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

        <PasswordInput
          id="password"
          name="password"
          label="密码"
          placeholder="输入密码"
          required
        />

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {error && (
          <div className="text-center">
            {showVerifyBanner ? (
              <VerifyEmailBanner email={loginEmail} />
            ) : (
              <button
                type="button"
                onClick={() => setShowVerifyBanner(true)}
                className="text-xs text-sakura hover:text-sakura-dark transition-colors"
              >
                未收到验证邮件？点击重发
              </button>
            )}
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
              登录中...
            </>
          ) : (
            "登录"
          )}
        </button>

        <div className="flex items-center justify-between text-sm">
          <Link href="/register" className="text-sakura hover:text-sakura-dark transition-colors">
            注册账号
          </Link>
          <Link href="/forgot-password" className="text-ink-light hover:text-ink transition-colors">
            忘记密码？
          </Link>
        </div>
      </form>
    </div>
  )
}
