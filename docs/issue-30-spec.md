# 玲音日记 全站 UI/UX 设计升级（Epic #30）精细化技术需求规约

本规约旨在为 #30 号 Epic 任务提供一套高度可落地、逻辑闭环且规避 Next.js SSR 常见问题的完整开发细节与技术规范。

---

## 🎯 升级愿景（Core Concept）
- **核心调性**：温馨、轻量、丝滑、极简、治愈。
- **视觉符号**：樱花粉（#f0a8b0）、暖白底（#faf3e8）、轻微手绘感、玻璃拟态（Glassmorphism）、微渐变与柔和投影。
- **体验承诺**：不仅是界面的重构，更是打字心流与 AI 伴随感的彻底重塑。在任何移动 PWA 设备上达到 LCP < 2s、CLS < 0.1 且手势物理触感顺畅。

---

## 📋 模块精细化改造指南（Detailed Requirements Specification）

### 1. 🌸 设计系统（Design Tokens）
将目前的硬编码配色体系彻底升级为**由 CSS 变量驱动、Tailwind 继承**的双主题 Token 方案。

#### 1.1 语义化 Token 与 CSS 变量映射
在 `src/app/globals.css` 的 `:root` 与 `.dark` 中统一定义以下 CSS 变量（采用 RGB 格式以便于 Tailwind 的 opacity 修饰符）：

```css
:root {
  /* 基础与表面 */
  --color-bg: 250 243 232;          /* #faf3e8 (Warm White) */
  --color-surface: 243 235 225;     /* #f3ebe1 (Warm Beige) */
  --color-surface-border: 226 222 219; /* #e2dedb */
  --color-card-bg: 255 255 255;     /* #ffffff (Pure White) */
  
  /* 品牌与主色 */
  --color-primary-50: 254 242 243;
  --color-primary-100: 253 224 227;
  --color-primary-300: 249 167 178;  /* #f9a7b2 */
  --color-primary: 240 168 176;      /* #f0a8b0 (Sakura Default) */
  --color-primary-700: 217 138 147;  /* #d98a93 (Sakura Dark) */
  --color-primary-900: 159 86 95;
  
  /* 文本 */
  --color-text: 44 44 44;            /* #2c2c2c (Ink Ink) */
  --color-text-muted: 107 107 107;   /* #6b6b6b */
  --color-text-light: 156 174 193;   /* #9caec1 (Dusty Blue) */

  /* 反馈色 */
  --color-success: 139 195 74;       /* 柔和绿 */
  --color-warning: 255 183 77;       /* 柔和黄 */
  --color-error: 229 115 115;        /* 柔和红 */

  /* 投影与圆角 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 20px;
  --shadow-soft: 0 4px 20px -2px rgba(44, 44, 44, 0.05), 0 2px 8px -1px rgba(44, 44, 44, 0.02);
}

.dark {
  /* 基础与表面（暗色调：温润深蓝紫黑，避免死黑） */
  --color-bg: 26 26 46;             /* #1a1a2e */
  --color-surface: 22 33 62;        /* #16213e */
  --color-surface-border: 41 53 84;  /* 柔和暗蓝边框 */
  --color-card-bg: 22 33 62;
  
  /* 品牌与主色（暗色下略微降低饱和度，提高亮度以增强对比度） */
  --color-primary: 232 138 149;     /* #e88a95 */
  --color-primary-700: 240 168 176;
  
  /* 文本 */
  --color-text: 224 220 208;         /* #e0dcd0 (奶白纸张感) */
  --color-text-muted: 150 155 170;   /* 柔灰蓝 */
  --color-text-light: 90 105 130;
  
  --shadow-soft: 0 4px 24px 0 rgba(0, 0, 0, 0.3);
}
```

#### 1.2 动画曲线与时间
- **入场过渡**：`transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1)`（超平滑缓出，Out-Quint）
- **微交互反馈**：`transition-all duration-150 cubic-bezier(0.4, 0, 0.2, 1)`

---

### 2. 🏠 Landing Page（未登录首屏设计）
需要摆脱传统 SaaS Landing Page 的冷冰冰感，注入「玲音」专属的手绘风与日记故事氛围。

```
+--------------------------------------------------------+
|  [🌸 Logo]  玲音日记                                   |
|                                                        |
|      樱花静静飘落背景 (Canvas/Pure CSS Layer)          |
|                                                        |
|         ✨ 记下此时此刻，温暖治愈的 AI 日记伴侣 ✨    |
|                                                        |
|                     [ 开启书写之旅 ]                   |
|                      "了解更多 ▽"                      |
+--------------------------------------------------------+
|                      (可视连线)                        |
|                         ↓                              |
|  [ 步骤 1: 随手记 ] ----→ [ 步骤 2: AI 润色 ]           |
|                                                        |
|  [ 卡片 1 (Hover上浮)]   [ 卡片 2 (Hover上浮)]          |
+--------------------------------------------------------+
```

#### 2.1 樱花飘落背景（Sakura Snowfall）
- **技术实现**：避免重型 Canvas 粒子库。推荐使用 **CSS Animation 伪元素** 或极简的轻量 JS-Canvas 脚本。
- **性能规范**：樱花粒子数量控制在 15-20 个以内，采用 `will-change: transform` 或 `translate3d` 强制硬件加速。
- **降低运动响应**：绑定 `prefers-reduced-motion` 媒体查询，当用户开启减弱动画时，自动 `display: none` 飘落动画，替换为一张静态樱花艺术背景。

#### 2.2 视觉引导与步骤连线
- **"了解更多"平滑滚动**：按钮点击触发 `document.getElementById('features').scrollIntoView({ behavior: 'smooth' })`。
- **可视连线（SVG Connections）**：
  - 步骤卡片之间使用 SVG 虚线贝塞尔曲线（`stroke-dasharray="4,4"`）连接。
  - **响应式处理**：在 `@media (max-width: 768px)` 时，布局转为垂直流，SVG 连线通过 Tailwind 的 `hidden md:block` 隐藏，并在移动端切换为垂直的 SVG 下箭头连线。
- **社会认同（Social Proof）**：
  - 在 CTA 下方增加一行微缩气泡头像组合 + 带有「已有 1,200+ 位记录者在此停留」字样的温暖手绘边框标签。

---

### 3. 🌙 夜间模式（Dark Mode / #9）
需要解决 SSR 架构中极度高发的“白屏闪烁”和系统主题同步体验。

#### 3.1 闪烁抑制（Avoid Flash of Unstyled Content）
- **解决方案**：在 `src/app/layout.tsx` 的 `<head>` 中，必须硬编码注入一段同步执行的 Blocking JS 脚本。由于此时 React 尚未接管 DOM，该脚本可在解析 HTML 的瞬间为 `<html>` 节点追加 `.dark` 类，彻底解决白屏闪烁。

```html
<script
  dangerouslySetInnerHTML={{
    __html: `
      (function() {
        try {
          var theme = localStorage.getItem('theme') || 'system';
          var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        } catch (e) {}
      })();
    `,
  }}
/>
```

#### 3.2 动态 PWA Theme Color
- 在 `layout.tsx` 中配置支持媒体查询的动态 theme-color，保证手机状态栏在不同主题下色彩统一：
  ```html
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="#faf3e8" />
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1a1a2e" />
  ```

---

### 4. 🧭 导航与转场体验
- **Desktop 导航栏**：
  - 升级为“悬浮毛玻璃卡片”风格（`backdrop-blur-md bg-white/70 dark:bg-surface/70 border border-surface-border sticky top-4 mx-auto max-w-7xl z-50 rounded-xl`）。
  - 右侧用户头像菜单增加展开/收起过渡动画，采用 Spring 弹簧效果（`scale-95` 到 `scale-100`）。
- **Mobile 底部 TabBar**：
  - 遵循 iOS/Android PWA 原生应用标准。
  - Tab 激活状态：图标拥有微小的缩放弹跳反馈（Bounce），下方配有一条樱花粉的柔和渐变指示条（Slide indicator）。
  - **刘海屏与安全区域**：必须加上 `pb-[env(safe-area-inset-bottom)]` 或在 PWA 容器中合理处理 `safe-area-bottom`，防止 Tab 按钮被 Home Indicator 遮挡。

---

### 5. 📝 日记编辑器（Distraction-Free Editor）
日记编辑器是本产品的核心。需要从“表单输入”升华为“沉浸式写作空间”。

```
+--------------------------------------------------------+
|  [ 退出 ]                 2026年5月22日      [ 保存并生成 ] |
|                                                        |
|   标题：今天的天气很温柔...                             |
|   --------------------------------------------------   |
|   内容：                                               |
|   早上出门的时候，迎面吹来的风已经有了夏天的味道。       |
|   一路上都在听那首熟悉的歌...                           |
|                                                        |
|   +-------------------+  +-------------------+         |
|   | 🏞️ 图片预览 (Hover) |  | ➕ 上传图片         |         |
|   | [x] 悬浮删除       |  |                   |         |
|   +-------------------+  +-------------------+         |
|                                                        |
|   ⏱️ 草稿已于 20:02 自动保存                            |
+--------------------------------------------------------+
```

#### 5.1 沉浸式写作环境
- **极简边框**：去除所有不必要的输入框外框。标题与正文采用无边框设计（`border-none focus:ring-0 resize-none bg-transparent`），底部分隔线采用极其微弱的虚线过渡。
- **字重与字间距**：正文使用 `tracking-wide leading-relaxed text-lg`，并限制最大阅读宽度（`max-w-2xl`），保护写作视线不发散。

#### 5.2 AI 生成态动效升级（AI Co-pilot State）
- **打字机光标（Typewriter Cursor）**：在 `TypewriterText.tsx` 已有的 `requestAnimationFrame` 逻辑上，当 `isStreaming` 为 true 时，打字光标应升级为具有脉动动画的樱花粉光标，其周围包裹一层微弱的粉色光晕（`shadow-glow`）。
- **氛围渲染（Ambient Glow）**：在 AI 生成日记的容器外围，增加一个轻量级的 CSS 渐变光晕背景动画（Conic/Radial Gradient），模拟“AI 正在用心为您润色纸张”的温润呼吸感：
  ```css
  @keyframes ai-breathing {
    0%, 100% { filter: drop-shadow(0 0 10px rgba(240,168,176,0.15)); }
    50% { filter: drop-shadow(0 0 25px rgba(240,168,176,0.35)); }
  }
  ```

#### 5.3 智能图片 Lightbox
- 点击编辑器内的图片预览，无缝展开一个全屏 Lightbox 遮罩层（`backdrop-blur-lg bg-black/80`）。
- 缩放过渡：图片通过 FLIP 动效或简单的 scale/opacity 过渡放大，支持点击空白处或向下滑动（Swipe Down）手势物理释放退出。

---

### 6. 📅 时间线 & 详情页（Timeline & Feed）
- **时间线轴（Timeline Path）**：
  - 传统的时间线是一条死板的直线。本次升级为由 Sakura Pink 与 Dusty Blue 渐变交织的曲线。
  - 每个节点的圆圈升级为：如果是今天，则呈现樱花花瓣微弱旋转的加载态/微呼吸态圆圈；如果是过去，则是温润的磨砂圆点。
- **骨架屏（Skeleton Shimmer）**：
  - 加载日记列表时，绝不使用死板的转圈 Loading。
  - 使用与日记卡片完全同等布局的骨架屏（包含日期占位、图片占位、双行文本占位），并注入优雅的、斜向流动的 Shimmer 闪烁动画（`animate-pulse` 改为通过 `linear-gradient` 实现的向右流动高亮条）。
- **空状态（Empty States）**：
  - 当无日记记录时，设计一个由温暖插图（如“一纸信封与飘落的樱花”）组成的空状态卡片，辅以文案：“今天还是一张白纸呢，来留下你的玲音吧。”

---

### 7. 🔐 登录 & 设置
- **登录界面手绘感**：
  - 账号密码登录与 Magic Link 验证输入框使用温润的卡片背景，四角采用较大的圆角（`rounded-2xl`）。
  - 背景加入柔和的手绘 SVG 框架或星光微弱闪烁动效。
- **邮件发送流程体验**：
  - 当触发 Magic Link 发送后，登录框平滑收缩，取而代之的是一个流畅的“小纸飞机飞入信箱”的 SVG 微动效，随后伴随文字“一封温暖的验证信已飞往您的邮箱，请点击查收”。
- **设置页分组逻辑**：
  - 设置项分类为：【🔑 账号安全】、【🌙 外观与主题】、【⚙️ AI 引擎设置】。
  - 每一组放入一个独立的 `card` 中，条目之间由淡雅的细线分隔。
  - **API Key 状态提示**：未保存 Key 时显示带有呼吸红点的“待配置”徽章；已保存 Key 时显示带安全勾选的“已加密保护”绿色微缩盾牌徽章。

---

### 8. 🎬 微交互 & 动效体系
- **全局 Toast 反馈**：
  - 自研轻量级弹窗组件（或使用并深度定制化样式库）。
  - Toast 从屏幕上方或底部以 Elastic Spring（弹性弹簧）轨迹弹出，在 3 秒后优雅向上滑动渐隐。
- **路由转场（Page Transitions）**：
  - 页面切换时，整体容器进行 `opacity` (0 -> 1) 与 `translateY` (10px -> 0) 的联动过渡，用时 250ms，给用户一种自然翻页的感觉。

---

### 9. 🧩 新手引导 Onboarding
- **玲音贴士（Helper Tooltips）**：
  - 当新用户首次注册成功进入 timeline 页面时，在页面底部触发一个半透明遮罩层，高亮指向【+ 新建日记】按钮。
  - 提示小卡片上方有一个萌萌的樱花花瓣指示箭头，并配有极简的文字：“点击这里，开始写下你和玲音的第一天吧～”。

---

## 🛡️ 核心技术约束与避坑指南（Edge Cases & Anti-patterns）

1. **Hydration Mismatch（水合不一致警告）**：
   - **坑点**：由于暗色模式读取 `localStorage` 是在客户端进行的，如果在 React 组件内部直接执行 `typeof window !== 'undefined' ? localStorage.getItem(...)` 并决定渲染不同的 DOM，会产生严重的 SSR 报错。
   - **解法**：主题检测脚本必须在 `layout.tsx` 的 HTML Head 层面，通过 Blocking Script 直接修改 `document.documentElement`。React 组件内部如需根据当前主题展示不同素材，一律使用 `useEffect` 挂载后的 `mounted` 状态作为渲染门禁：
     ```typescript
     const [mounted, setMounted] = useState(false);
     useEffect(() => setMounted(true), []);
     if (!mounted) return <div className="invisible" />; // 占位，避免服务器渲染与客户端不符
     ```

2. **PWA 性能卡顿**：
   - 绝不引入如 `lottie-web` 或 `framer-motion` 等动辄增加几十 KB 甚至上百 KB 的第三方动画库。
   - 所有的过渡和微动效一律使用 **Tailwind JIT 编译的 CSS Transition / Animation** 以及 React 自带的状态管理。
   - 涉及滚动的动效优先使用 CSS `scroll-behavior: smooth`。

3. **无障碍降级 (A11y)**：
   - 所有的文本对比度（特别是暗色模式下的次要灰色文本 `--color-text-muted`）必须满足 WCAG AA 级标准（对比度至少 4.5:1）。
   - 所有的动画都必须包裹在具有 `@media (prefers-reduced-motion: reduce)` 的 CSS 媒体查询中进行降级或直接停用。

---

## 📌 完备子任务清单与 DoD (Definition of Done)

- [ ] **Task 1: 设计系统基建 (Design Tokens & Theme Switcher)**
  - 在 `globals.css` 建立双主题 CSS 变量。
  - 在 `tailwind.config.ts` 中配置变量绑定。
  - 编写 blocking HTML `<script>` 并在 `layout.tsx` 中引入。
- [ ] **Task 2: 导航与布局重构**
  - 实现 Glassmorphic 顶部 Sticky 导航栏。
  - 重构 Mobile Bottom TabBar 并兼容 iOS Home Indicator。
- [ ] **Task 3: Landing Page 精细化升级 (#28)**
  - 部署轻量级、响应式樱花飘落动画。
  - 编写步骤连线 SVG 组件并适配移动端垂直流。
  - 优化 Hero 区域的视觉层级。
- [ ] **Task 4: 沉浸式编辑器与生成态微交互**
  - 实现无框、大字距沉浸式输入排版。
  - 为 `TypewriterText.tsx` 添加 AI 生成态呼吸光晕及光标样式。
  - 实现图片预览的遮罩 Lightbox，支持拖拽释放。
- [ ] **Task 5: 优雅时间线与详情页 UI 重塑**
  - 绘制渐变平滑的时间线轴曲线。
  - 编写带有骨架流动（Shimmer）动画的占位骨架屏。
  - 设计温润的“一纸白纸”空状态提示。
- [ ] **Task 6: 登录、设置与反馈微交互**
  - 为设置项进行功能卡片分组，优化 API Key 加密状态的徽章标识。
  - 增加“纸飞机飞入信箱”的 Magic Link 验证过渡。
  - 编写自研的弹性滑入 Toast 提示组件。

### 验收标准（DoD）
1. 运行 `npx tsc --noEmit`，TypeScript 编译零报错、零警告。
2. 页面在 LCP（最大内容渲染时间）性能测试中保持在 2s 以内。
3. 从 Light 主题切换至 Dark 主题时，页面无任何白色瞬间闪烁或 DOM Hydration Mismatch 报警。
4. 在 Mobile 响应式测试下，步骤箭头完美对齐，无横向滚动条溢出。
5. 所有修改内容已同步更新并在 `CHANGELOG.md` 中进行留痕。
