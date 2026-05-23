"use client"

import type { WritingStyle } from "@/types"
import { PERSONAS } from "@/config/personas"

interface DiaryEditorToolbarProps {
  date: string
  writingStyle: WritingStyle
}

function formatDate(dateStr: string): string {
  const days = ["日", "一", "二", "三", "四", "五", "六"]
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekday = days[d.getDay()]
  return `${year}年${month}月${day}日 星期${weekday}`
}

export function DiaryEditorToolbar({ date, writingStyle }: DiaryEditorToolbarProps) {
  const persona = PERSONAS[writingStyle.persona]
  const perspectiveLabel = writingStyle.perspective === "first_person" ? "第一人称" : "第二人称"

  return (
    <div className="flex items-center gap-3 flex-wrap text-sm">
      <span className="text-ink-light">{formatDate(date)}</span>
      <span className="inline-flex items-center gap-1 rounded-full bg-sakura/10 px-2.5 py-1 text-xs font-medium text-sakura-dark">
        {persona.emoji} {persona.name}
      </span>
      <span className="text-xs text-ink-light/60">{perspectiveLabel}</span>
    </div>
  )
}
