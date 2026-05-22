import { auth } from "@/lib/auth";
import {
  BookOpen,
  PenLine,
  Clock,
  ArrowRight,
  Sparkles,
  Image,
  Lock,
  Smartphone,
  Wand2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI 智能生成",
    desc: "说几句话，拍张照片，AI 自动写成一篇优美的日记。就像有一个贴心的写作助手。",
  },
  {
    icon: Image,
    title: "照片入文",
    desc: "上传照片，AI 会分析场景和氛围，自然地融入日记。每一篇都有配图。",
  },
  {
    icon: Lock,
    title: "隐私优先",
    desc: "你的 API Key 只存在本地浏览器。内容加密存储在云端，只有你能访问。",
  },
  {
    icon: Smartphone,
    title: "随处可用",
    desc: "PWA 应用，可安装到手机桌面。离线也能读日记，随时随地记录生活。",
  },
];

const STEPS = [
  {
    num: "01",
    title: "记录灵感",
    desc: "随便说几句话，或上传一张今天的照片。不需要完美措辞。",
  },
  {
    num: "02",
    title: "AI 润色",
    desc: "铃英会自动分析你提供的素材，生成一篇自然优美的日记。",
  },
  {
    num: "03",
    title: "保存回味",
    desc: "日记保存在时间线上，支持 Markdown 排版。翻看过去的日子，感受时光。",
  },
];

export default async function Home() {
  const session = await auth();
  const user = session?.user;

  // ─── 已登录：仪表盘 ─────────────────────────────
  if (user) {
    const displayName = user.email ? user.email.split("@")[0] : "朋友";

    return (
      <div className="flex min-h-[80vh] flex-col items-center gap-10 text-center pt-12">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sakura/10">
            <BookOpen className="h-10 w-10 text-sakura" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            玲音日记
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

  // ─── 未登录：Landing Page ─────────────────────────
  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-6 text-center overflow-hidden">
        {/* 装饰性背景元素 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-sakura/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-sakura/5 blur-3xl" />
        </div>

        <div className="relative z-10 flex max-w-2xl flex-col items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-sakura/10 ring-4 ring-sakura/20">
            <BookOpen className="h-12 w-12 text-sakura" strokeWidth={1.5} />
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            玲音日记
          </h1>
          <p className="text-xl text-ink-light sm:text-2xl">
            你的 AI 日记助手
          </p>

          <p className="max-w-md text-base text-ink-light/80 leading-relaxed">
            拍张照片，说几句话。AI 自动写成一篇优美的日记。
            <br />
            让记录生活变得无比简单。
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row mt-4">
            <Link
              href="/login"
              className="btn-primary flex items-center gap-2 text-lg px-8 py-3.5"
            >
              开始使用
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="btn-secondary flex items-center gap-2 px-8 py-3.5"
            >
              了解更多
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* 向下箭头指示 */}
        <div className="absolute bottom-8 animate-bounce text-ink-light/30">
          <ChevronRight className="h-6 w-6 rotate-90" strokeWidth={1.5} />
        </div>
      </section>

      {/* ── 特性 Features ── */}
      <section className="bg-surface/50 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">
              为什么选择玲音日记？
            </h2>
            <p className="mt-3 text-ink-light">
              让 AI 帮你记录每一天的美好
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="card flex flex-col items-start gap-4 p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sakura/10">
                  <feature.icon
                    className="h-6 w-6 text-sakura"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="text-lg font-medium text-ink">
                  {feature.title}
                </h3>
                <p className="text-sm text-ink-light leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 使用步骤 How It Works ── */}
      <section className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="mb-14 text-center">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">
              三步开始
            </h2>
            <p className="mt-3 text-ink-light">
              简单三步，开始你的 AI 日记之旅
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.num} className="flex flex-col items-center gap-4 text-center">
                <span className="text-4xl font-bold text-sakura/40">
                  {step.num}
                </span>
                <h3 className="text-lg font-medium text-ink">{step.title}</h3>
                <p className="text-sm text-ink-light leading-relaxed max-w-xs">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* 步骤连线装饰（桌面端显示） */}
          <div className="relative mt-8 hidden sm:block">
            <div className="mx-auto flex max-w-md justify-between px-6">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-px w-20 bg-sakura/20"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-sakura/5 px-6 py-20 sm:py-28">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <Wand2 className="h-10 w-10 text-sakura" strokeWidth={1.5} />
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">
            开始记录你的生活
          </h2>
          <p className="text-ink-light text-base leading-relaxed max-w-md">
            不需要文笔，不需要构思。只要一张照片、几句话，
            <br />
            玲音会帮你写出属于你的日记。
          </p>
          <Link
            href="/login"
            className="btn-primary flex items-center gap-2 text-lg px-10 py-3.5 mt-2"
          >
            免费开始使用
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-surface-border px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 text-center sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-ink-light">
            <BookOpen className="h-4 w-4 text-sakura" strokeWidth={1.5} />
            <span>玲音日记</span>
          </div>
          <p className="text-xs text-ink-light/60">
            &copy; {new Date().getFullYear()} 玲音日记. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
