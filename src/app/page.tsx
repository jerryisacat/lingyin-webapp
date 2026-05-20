import { createClient } from "@/lib/supabase/server";
import { BookOpen } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sakura/10">
            <BookOpen className="h-10 w-10 text-sakura" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            玲音日记
          </h1>
          <p className="text-lg text-ink-light">你的 AI 日记助手</p>
        </div>

        <div className="flex max-w-md flex-col gap-3 text-sm text-ink-light">
          <p>✨ 拍张照片，说几句话</p>
          <p>AI 自动写成优美的日记</p>
        </div>

        <Link href="/login" className="btn-primary text-lg">
          开始使用
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sakura/10">
          <BookOpen className="h-10 w-10 text-sakura" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          玲音日记
        </h1>
        <p className="text-lg text-ink-light">
          欢迎回来{user.email ? `，${user.email.split("@")[0]}` : ""}
        </p>
        <p className="text-sm text-ink-light">今天想记录些什么呢？</p>
      </div>

      <Link href="/diary" className="btn-primary text-lg">
        开始写日记
      </Link>

      <Link
        href="/timeline"
        className="text-sm text-dusty-blue hover:text-ink-light transition-colors"
      >
        浏览我的日记
      </Link>
    </div>
  );
}
