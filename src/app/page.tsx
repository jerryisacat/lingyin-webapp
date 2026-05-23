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
  PenTool,
  Palette,
  Heart,
} from "lucide-react";
import Link from "next/link";
import SakuraParticles from "@/components/SakuraParticles";
import DashboardStats from "@/components/DashboardStats";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI 智能生成",
    desc: "说几句话，拍张照片，AI 自动写成一篇优美的日记。就像有一个贴心的写作助手。",
  },
  {
    icon: Image,
    title: "照片入文",
    desc: "上传照片，AI 会分析场景和氛围，自然地融入日记。",
  },
  {
    icon: Lock,
    title: "隐私优先",
    desc: "你的 API 密钥在服务端通过 AES-256-GCM 加密存储，仅在需要时解密使用，确保安全。",
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
    title: "日常倾诉",
    desc: "日常随笔、照片、断断续续的心思，都能毫无压力地写下。",
    icon: PenTool,
  },
  {
    num: "02",
    title: "温暖润色",
    desc: "AI 理解故事背后细密的情绪，将碎片加工成优雅的信签。",
    icon: Palette,
  },
  {
    num: "03",
    title: "珍藏回味",
    desc: "日记按时间线保存，支持 Markdown。翻看过去，感受时光。",
    icon: Heart,
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

        <div className="w-full max-w-2xl">
          <DashboardStats />
        </div>

        <div className="flex max-w-sm flex-col gap-3 rounded-xl bg-sakura/5 border border-sakura/20 px-6 py-4 text-left">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sakura" strokeWidth={1.5} />
            <span className="text-sm font-medium text-ink">玲音小贴士</span>
          </div>
          <p className="text-sm text-ink-light leading-relaxed">
            试试上传一张今天的照片，玲音可以帮你分析照片中的场景和氛围，写出一篇温暖的日记。
          </p>
        </div>
      </div>
    );
  }

  // ─── 未登录：Landing Page ─────────────────────────
  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 text-center overflow-hidden">
        {/* 樱花飘落粒子 */}
        <SakuraParticles />

        {/* 装饰性渐变光斑 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 right-[10%] h-72 w-72 rounded-full bg-sakura/10 blur-3xl" />
          <div className="absolute top-1/3 -left-20 h-64 w-64 rounded-full bg-sakura/8 blur-3xl" />
          <div className="absolute -bottom-20 right-[5%] h-56 w-56 rounded-full bg-sakura/6 blur-3xl" />
          <div className="absolute bottom-1/3 -right-20 h-48 w-48 rounded-full bg-sakura/10 blur-3xl" />
        </div>

        {/* Hero 内容 */}
        <div className="relative z-20 flex max-w-2xl flex-col items-center gap-6">
          {/* Logo 徽章 */}
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-sakura/15 to-sakura/5 ring-4 ring-sakura/15 backdrop-blur-sm">
            <BookOpen className="h-12 w-12 text-sakura" strokeWidth={1.5} />
          </div>

          {/* 标题 */}
          <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl">
            玲音日记
          </h1>

          {/* 副标题——渐变色 */}
          <p className="bg-gradient-to-r from-sakura-dark via-sakura to-sakura-light bg-clip-text text-xl font-medium text-transparent sm:text-2xl">
            记下此时此刻，温暖治愈的 AI 日记伴侣
          </p>

          {/* 开源信息 */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-ink-light/70 mt-2">
            <span>
              由 <a href="https://hi.jerryiscat.one/" target="_blank" className="font-semibold text-ink-light hover:text-sakura transition-colors">Jerryiscat</a> 使用 <a href="https://vibe-coding.x-dev.club/" target="_blank" className="font-semibold text-ink-light hover:text-sakura transition-colors">Vibe Coding</a> 构建
            </span>
            <span className="hidden sm:inline">·</span>
            <span>
              Powered by <a href="https://www.deepseek.com/" target="_blank" className="font-semibold text-ink-light hover:text-sakura transition-colors">DeepSeek</a>
            </span>
            <span className="hidden sm:inline">·</span>
            <a href="https://github.com/jerryisacat/lingyin-webapp" target="_blank" className="flex items-center gap-1 font-semibold text-ink-light hover:text-sakura transition-colors">
              开源
            </a>
          </div>

          {/* 描述 */}
          <p className="max-w-md text-base text-ink-light/80 leading-relaxed sm:text-lg">
            拍张照片，说几句话。AI 自动写成一篇优美的日记。
            <br />
            让记录生活变得无比简单。
          </p>

          {/* CTA 按钮 */}
          <div className="flex flex-col items-center gap-3 sm:flex-row mt-4">
            <Link
              href="/login"
              className="btn-primary flex items-center gap-2 text-lg px-8 py-3.5 shadow-soft hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              开启书写之旅
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="btn-secondary flex items-center gap-2 px-8 py-3.5"
            >
              了解更多
              <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        {/* 向下滚动指示 */}
        <div className="absolute bottom-8 z-20 flex flex-col items-center gap-2 text-ink-light/25">
          <span className="text-xs">向下探索</span>
          <ChevronRight className="h-5 w-5 rotate-90 animate-bounce" strokeWidth={1.5} />
        </div>
      </section>

      {/* ── 用例场景 ── */}
      <section className="bg-surface/30 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">
              用玲音记录你的生活
            </h2>
            <p className="mt-3 text-ink-light">
              每个值得珍藏的瞬间，都有一篇温暖的日记
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="use-case-card">
              <h3 className="use-case-title">追演出</h3>
              <p className="use-case-desc">记录每一次现场</p>
            </div>
            <div className="use-case-card">
              <h3 className="use-case-title">旅行</h3>
              <p className="use-case-desc">旅途中的随身笔</p>
            </div>
            <div className="use-case-card">
              <h3 className="use-case-title">日常</h3>
              <p className="use-case-desc">随手记下小日子</p>
            </div>
            <div className="use-case-card">
              <h3 className="use-case-title">生活</h3>
              <p className="use-case-desc">热爱有迹可循</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 特性 Features ── */}
      <section id="features" className="bg-surface/50 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">
              一个懂你的日记本
            </h2>
            <p className="mt-3 text-ink-light">
              重拾书写的快乐，感受温暖的陪伴
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="feature-card group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sakura/10 transition-transform duration-300 group-hover:scale-110">
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
      <section id="how-it-works" className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="mb-14 text-center">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">
              你的专属写作流程
            </h2>
            <p className="mt-3 text-ink-light">
              从随手记录到珍藏回忆
            </p>
          </div>

          {/* 步骤卡片 */}
          <div className="relative grid gap-6 sm:grid-cols-3">
            {/* SVG 贝塞尔连线（桌面端） */}
            <div className="step-connector absolute inset-x-10 top-[72px] hidden sm:block pointer-events-none">
              <svg className="w-full h-8" fill="none" preserveAspectRatio="none">
                <path
                  d="M 0,10 C 100,30 160,-10 260,10 S 420,30 520,10"
                  stroke="#f0a8b0"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                  opacity="0.35"
                />
              </svg>
            </div>

            {STEPS.map((step, idx) => (
              <div key={step.num} className="relative flex flex-col items-center text-center">
                {/* 序号徽章 */}
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-sakura text-white text-sm font-bold shadow-soft mb-5">
                  {step.num}
                </div>

                {/* 卡片 */}
                <div className="group w-full rounded-xl border border-surface-border bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sakura/10 mx-auto mb-4 transition-transform duration-300 group-hover:scale-110">
                    <step.icon className="h-5 w-5 text-sakura" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-bold text-lg text-ink mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-ink-light leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {/* 移动端竖线连接 */}
                {idx < STEPS.length - 1 && (
                  <div className="my-2 sm:hidden flex justify-center">
                    <div className="w-px h-8 bg-sakura/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sakura/5 to-sakura/10 px-6 py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-sakura/10 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
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
            className="btn-primary flex items-center gap-2 text-lg px-10 py-3.5 mt-2 shadow-soft hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
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
