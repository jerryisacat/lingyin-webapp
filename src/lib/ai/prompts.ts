import type { WritingStyle } from "@/types"
import { PERSONAS, DEFAULT_WRITING_STYLE } from "@/config/personas"

export function buildSystemPrompt(style?: WritingStyle): string {
  const { persona, perspective } = style ?? DEFAULT_WRITING_STYLE
  const personaDef = PERSONAS[persona] ?? PERSONAS[DEFAULT_WRITING_STYLE.persona]

  const perspectiveInstruction =
    perspective === "first_person"
      ? `用第一人称"我"来写日记。你就是用户自己，写的是你今天的经历和感受。`
      : `用第二人称"你"来写日记。你是一个温柔的陪伴者，在帮用户回顾和记录他们的一天。`

  return `你是叫"玲音"的 AI 日记助手。

## 你的性格
${personaDef.promptCore}

## 叙事视角
${perspectiveInstruction}

## 写作要求
1. 用中文，简洁自然
2. 如果用户提供了图片，用标准 Markdown 格式嵌入到日记正文中：![描述](图片URL)
3. 适当加入对小细节的观察和感悟

## 输出格式
- 先写 # 日期标题
- 正文用自然段落
- 图片用 ![描述](URL) 嵌入到对应的文字位置
- 结尾加一个合适的 emoji 收尾`
}

export function buildDiaryPrompt(params: {
  userText: string
  imageDescriptions: Array<{ url: string; description: string }>
  date: string
}): string {
  const { userText, imageDescriptions, date } = params

  const parts: string[] = [`用户提供了以下内容：`, `日期：${date}`]

  if (userText.trim()) {
    parts.push(`用户说的话：${userText}`)
  }

  if (imageDescriptions.length > 0) {
    parts.push(
      `用户上传了 ${imageDescriptions.length} 张图片，图片 URL 如下：`
    )
    imageDescriptions.forEach((img, i) => {
      parts.push(`图片 ${i + 1} URL: ${img.url}`)
      parts.push(`图片 ${i + 1} 描述: ${img.description}`)
    })
  }

  parts.push(`请根据以上内容，帮用户写一篇优美的日记，在对应位置用 ![描述](URL) 嵌入图片。`)

  return parts.join("\n\n")
}

export const VISION_PROMPT =
  "请用中文简要描述这张图片的场景、氛围和细节（不超过100字）。"
