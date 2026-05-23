"use client";

import { DiaryEditor } from "@/components/DiaryEditor";

export default function DiaryPage() {
  const today = new Date().toISOString().slice(0, 10);

  return <DiaryEditor date={today} provider="openrouter" />;
}
