import { createClient } from "@/lib/supabase/server";
import { BookOpen, PenLine, Clock, ArrowRight, Sparkles } from "lucide-react";
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
            铃英日记
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

  const displayName = user.email
    ? user.email.split("@")[0]
    : "朋友";

  return (
    <div className="flex min-h-[80vh] flex-col items-center gap-10 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sakura/10">
          <BookOpen className="h-10 w-10 text-sakura" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          铃英日记
        </h1>
        <p className="text-lg text-ink-light">
          你好，{displayName}
        </p>
        <p className="text-sm text-ink-light">今天想记录些什么呢？</p>
      </div>

      <div className="grid w-full max-w-sm gap-4">
        <Link
          href="/diary"
          className="btn-primary flex items-center justify-center gap-2 text-lg py-4"
        >
          <PenLine className="h-5 w-5" strokeWidth={1.5} />
          开始写日记
          <ArrowRight className="h-5 w-5" />
        </Link>

        <Link
          href="/timeline"
          className="btn-secondary flex items-center justify-center gap-2 py-4"
        >
          <Clock className="h-5 w-5" strokeWidth={1.5} />
          浏览时间线
        </Link>
      </div>

      <div className="flex max-w-sm flex-col gap-3 rounded-xl bg-sakura/5 border border-sakura/20 px-6 py-4 text-left">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sakura" strokeWidth={1.5} />
          <span className="text-sm font-medium text-ink">铃英小贴士</span>
        </div>
        <p className="text-sm text-ink-light leading-relaxed">
          试试上传一张今天的照片，铃英可以帮你分析照片中的场景和氛围，写出一篇温暖的日记。
        </p>
      </div>
    </div>
  );
}
