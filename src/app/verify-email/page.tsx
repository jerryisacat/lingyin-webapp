import { verifyEmailAction } from "@/lib/auth-actions"
import Link from "next/link"
import { CheckCircle, XCircle } from "lucide-react"

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return <VerifyResult success={false} message="缺少验证令牌" />
  }

  const result = await verifyEmailAction(token)

  if (result.ok) {
    return (
      <VerifyResult
        success
        message="邮箱验证成功！现在可以登录了。"
        link="/login"
        linkText="前往登录"
      />
    )
  }

  return <VerifyResult success={false} message={result.error} />
}

function VerifyResult({
  success,
  message,
  link,
  linkText,
}: {
  success: boolean
  message: string
  link?: string
  linkText?: string
}) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full ${
          success ? "bg-green-100" : "bg-red-100"
        }`}
      >
        {success ? (
          <CheckCircle className="h-8 w-8 text-green-600" strokeWidth={1.5} />
        ) : (
          <XCircle className="h-8 w-8 text-red-500" strokeWidth={1.5} />
        )}
      </div>
      <h1 className="text-xl font-bold text-ink">
        {success ? "验证成功" : "验证失败"}
      </h1>
      <p className="text-center text-sm text-ink-light">{message}</p>
      {link && linkText && (
        <Link href={link} className="btn-primary inline-flex items-center gap-2">
          {linkText}
        </Link>
      )}
    </div>
  )
}
