"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BookOpen, Loader2, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setError("")
    setLoading(true)

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
    } finally {
      setLoading(false)
    }
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

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">
            邮箱地址
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              required
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

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="btn-primary flex w-full items-center justify-center gap-2"
        >
          {loading ? (
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
