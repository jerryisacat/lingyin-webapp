import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-semibold text-sakura">404</h1>
      <p className="text-ink/60">页面不存在</p>
      <Link href="/" className="rounded-lg bg-sakura px-6 py-2 text-sm text-white transition hover:opacity-90">
        返回首页
      </Link>
    </div>
  )
}
