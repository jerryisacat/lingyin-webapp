"use client";

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
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
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

const USE_CASES = [
  {
    label: "追演出",
    text: "今天看了草东没有派对的现场。拍两张照片，说两句感受，AI 帮你写成一篇有温度的演出日记。回来翻看，每个细节都还在。",
  },
  {
    label: "旅行",
    text: "每到一个城市，拍张照、说段话。不用修图排版，AI 会生成属于那一天的旅行日记。一年后翻看，像又走了一遍。",
  },
  {
    label: "日常",
    text: "猫又干了什么傻事？随手一拍，加句话，AI 扩写成一篇日常记录。生活里的小事，也能成为值得回味的文字。",
  },
  {
    label: "生活",
    text: "第一次做番茄牛腩。拍下成品、写下心得，AI 帮你整理成完整的烹饪日记。下次做的时候翻出来看。",
  },
];

const FADE_IN_UP_VARIANTS = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const SECTION_REVEAL = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as const,
      staggerChildren: 0.08,
    },
  },
};

const ITEM_REVEAL = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function Home() {
  const { data: session } = useSession();
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
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-6 text-center overflow-hidden">
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
        <motion.div
          className="relative z-20 flex max-w-2xl flex-col items-center gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {/* Logo 徽章 */}
          <motion.div
            className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-sakura/12 to-sakura/4 ring-1 ring-sakura/10 backdrop-blur-sm"
            variants={FADE_IN_UP_VARIANTS}
          >
            <BookOpen className="h-11 w-11 text-sakura/80" strokeWidth={1.5} />
          </motion.div>

          {/* Thin decorative rule */}
          <motion.div
            className="h-px w-12 bg-sakura/20"
            variants={FADE_IN_UP_VARIANTS}
          />

          {/* 标题 */}
          <motion.h1
            className="text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl"
            variants={FADE_IN_UP_VARIANTS}
          >
            玲音日记
          </motion.h1>

          {/* 副标题——渐变色 */}
          <motion.p
            className="bg-gradient-to-r from-sakura-dark via-sakura to-sakura-light bg-clip-text text-lg font-medium text-transparent sm:text-xl"
            variants={FADE_IN_UP_VARIANTS}
          >
            记下此时此刻，温暖治愈的 AI 日记伴侣
          </motion.p>

          {/* 开源信息 */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-ink-light/70 mt-2"
            variants={FADE_IN_UP_VARIANTS}
          >
            <span>
              由 <a href="https://hi.jerryiscat.one/" target="_blank" className="font-semibold text-ink-light hover:text-sakura transition-colors">Jerryiscat</a> 使用 Vibe Coding 构建
            </span>
            <span className="hidden sm:inline">·</span>
            <span>
              Powered by <a href="https://www.deepseek.com/" target="_blank" className="font-semibold text-ink-light hover:text-sakura transition-colors">DeepSeek</a>
            </span>
            <span className="hidden sm:inline">·</span>
            <a href="https://github.com/jerryisacat/lingyin-webapp" target="_blank" className="flex items-center gap-1 font-semibold text-ink-light hover:text-sakura transition-colors">
              开源
            </a>
          </motion.div>

          {/* 描述 */}
          <motion.p
            className="max-w-md text-base text-ink-light/80 leading-relaxed sm:text-lg"
            variants={FADE_IN_UP_VARIANTS}
          >
            拍张照片，说几句话。AI 自动写成一篇优美的日记。
            <br />
            让记录生活变得无比简单。
          </motion.p>

          {/* CTA 按钮 */}
          <motion.div
            className="flex flex-col items-center gap-3 sm:flex-row mt-4"
            variants={FADE_IN_UP_VARIANTS}
          >
            <Link
              href="/login"
              className="btn-primary flex items-center gap-2 px-8 py-3 text-sm font-medium shadow-none hover:shadow-soft hover:-translate-y-0.5 transition-all duration-300"
            >
              开启书写之旅
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="btn-ghost-editorial flex items-center gap-2 px-8 py-3 text-sm font-medium"
            >
              了解更多
              <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </motion.div>
        </motion.div>

        {/* 向下滚动指示 */}
        <div className="absolute bottom-8 z-20 flex flex-col items-center gap-2 text-ink-light/25">
          <span className="text-xs">向下探索</span>
          <ChevronRight className="h-5 w-5 rotate-90 animate-bounce" strokeWidth={1.5} />
        </div>
      </section>

      {/* ── 用例场景 ── */}
      <section className="px-6 py-24 sm:py-32">
        <motion.div
          className="mx-auto max-w-3xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={SECTION_REVEAL}
        >
          {/* Section label + thin rule */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-sakura/40">
              使用场景
            </span>
            <div className="h-px flex-1 bg-sakura/12" />
          </div>

          <h2 className="mt-6 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            用玲音记录你的生活
          </h2>
          <p className="mt-4 max-w-lg text-base text-ink-light/60 sm:text-lg">
            每个值得珍藏的瞬间，都有一篇温暖的日记
          </p>

          {/* Use cases — editorial list */}
          <div className="mt-16">
            {USE_CASES.map((item, i) => (
              <motion.div
                key={item.label}
                className="group flex flex-col gap-3 border-t border-sakura/10 py-6 transition-colors duration-500 hover:border-sakura/20 sm:flex-row sm:gap-10 sm:py-8"
                variants={ITEM_REVEAL}
              >
                <div className="flex items-center gap-3 sm:w-36 shrink-0">
                  <span className="text-2xs font-bold tabular-nums text-sakura/25">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-bold tracking-wide text-ink/75">
                    {item.label}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-ink-light/65 sm:text-base">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── 特性 Features ── */}
      <section id="features" className="px-6 py-24 sm:py-32">
        <motion.div
          className="mx-auto max-w-5xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={SECTION_REVEAL}
        >
          {/* Section label + thin rule */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-sakura/40">
              产品特性
            </span>
            <div className="h-px flex-1 bg-sakura/12" />
          </div>

          <h2 className="mt-6 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            一个懂你的日记本
          </h2>
          <p className="mt-4 max-w-lg text-base text-ink-light/60 sm:text-lg">
            重拾书写的快乐，感受温暖的陪伴
          </p>

          <div className="mt-16 grid gap-px sm:grid-cols-2 sm:gap-0">
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                className="feature-card-editorial group"
                variants={ITEM_REVEAL}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sakura/8 transition-colors duration-300 group-hover:bg-sakura/12">
                  <feature.icon
                    className="h-5 w-5 text-sakura/70"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-ink/85">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-light/60">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── 使用步骤 How It Works ── */}
      <section id="how-it-works" className="px-6 py-24 sm:py-32">
        <motion.div
          className="mx-auto max-w-4xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={SECTION_REVEAL}
        >
          {/* Section label + thin rule */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-sakura/40">
              使用流程
            </span>
            <div className="h-px flex-1 bg-sakura/12" />
          </div>

          <h2 className="mt-6 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            你的专属写作流程
          </h2>
          <p className="mt-4 max-w-lg text-base text-ink-light/60 sm:text-lg">
            从随手记录到珍藏回忆
          </p>

          {/* Steps */}
          <div className="relative mt-16 grid gap-8 sm:grid-cols-3">
            {/* SVG connector */}
            <div className="step-connector absolute inset-x-8 top-[36px] hidden sm:block pointer-events-none">
              <svg className="w-full h-6" fill="none" preserveAspectRatio="none">
                <path
                  d="M 0,6 C 100,20 160,-8 260,6 S 420,20 520,6"
                  stroke="#f0a8b0"
                  strokeWidth="1.5"
                  strokeDasharray="4,6"
                  opacity="0.25"
                />
              </svg>
            </div>

            {STEPS.map((step, idx) => (
              <motion.div
                key={step.num}
                className="relative flex flex-col items-center text-center"
                variants={ITEM_REVEAL}
              >
                {/* Number */}
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-sakura/15 shadow-sm mb-6">
                  <span className="text-sm font-bold tabular-nums text-sakura/60">
                    {step.num}
                  </span>
                </div>

                {/* Content */}
                <div className="group w-full">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sakura/6 mx-auto mb-4 transition-colors duration-300 group-hover:bg-sakura/10">
                    <step.icon className="h-5 w-5 text-sakura/60" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base font-bold text-ink/85 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-light/60">
                    {step.desc}
                  </p>
                </div>

                {/* Mobile vertical connector */}
                {idx < STEPS.length - 1 && (
                  <div className="my-4 sm:hidden flex justify-center">
                    <div className="w-px h-10 bg-sakura/15" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-24 sm:py-32">
        <motion.div
          className="mx-auto flex max-w-2xl flex-col items-center gap-8 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={SECTION_REVEAL}
        >
          {/* Thin rule */}
          <div className="h-px w-12 bg-sakura/20" />

          <Wand2 className="h-8 w-8 text-sakura/50" strokeWidth={1.5} />
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            开始记录你的生活
          </h2>
          <p className="max-w-md text-base leading-relaxed text-ink-light/60 sm:text-lg">
            不需要文笔，不需要构思。只要一张照片、几句话，
            <br />
            玲音会帮你写出属于你的日记。
          </p>
          <Link
            href="/login"
            className="btn-primary flex items-center gap-2 px-10 py-3 text-sm font-medium shadow-none hover:shadow-soft hover:-translate-y-0.5 transition-all duration-300"
          >
            免费开始使用
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-sakura/8 px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 text-center sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-ink-light/50">
            <BookOpen className="h-4 w-4 text-sakura/40" strokeWidth={1.5} />
            <span>玲音日记</span>
          </div>
          <p className="text-xs text-ink-light/40">
            &copy; {new Date().getFullYear()} 玲音日记. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
