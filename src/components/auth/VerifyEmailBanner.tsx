"use client"

import { useState, useTransition } from "react"
import { Loader2, CheckCircle, Mail } from "lucide-react"

interface VerifyEmailBannerProps {
  email?: string
}

export default function VerifyEmailBanner({ email: initialEmail = "" }: VerifyEmailBannerProps) {
  const [email, setEmail] = useState(initialEmail)
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const handleResend = () => {
    const trimmed = email.trim()
    if (!trimmed) {
      setErrorMsg("请输入邮箱地址")
      return
    }

    setErrorMsg("")
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/resend-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed }),
        })
        const data = await res.json()

        if (data.ok) {
          setStatus("sent")
        } else {
          setStatus("error")
          setErrorMsg(data.error || "发送失败，请稍后再试")
        }
      } catch {
        setStatus("error")
        setErrorMsg("网络错误，请稍后再试")
      }
    })
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg bg-green-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-700">
            验证邮件已发送，请查收邮箱并完成验证
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-amber-50 px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <Mail className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <span className="text-sm font-medium text-amber-800">
          邮箱未验证
        </span>
      </div>
      <p className="mb-3 text-xs text-amber-700">
        注册后需要验证邮箱才能登录。请输入邮箱地址重新发送验证邮件。
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="hello@example.com"
          className="input-field flex-1 text-sm"
        />
        <button
          type="button"
          onClick={handleResend}
          disabled={isPending}
          className="btn-primary inline-flex items-center gap-1.5 whitespace-nowrap text-sm"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              发送中
            </>
          ) : (
            "重发验证"
          )}
        </button>
      </div>
      {status === "error" && errorMsg && (
        <p className="mt-2 text-xs text-red-600">{errorMsg}</p>
      )}
    </div>
  )
}
