"use client";

import { useEffect, useRef, useState } from "react";

interface TypewriterTextProps {
  text: string;
  isStreaming: boolean;
}

export default function TypewriterText({ text, isStreaming }: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState("");
  const fullRef = useRef(text);
  const displayedIndexRef = useRef(0);

  useEffect(() => {
    fullRef.current = text;
  }, [text]);

  useEffect(() => {
    if (isStreaming) return;
    setDisplayed(text);
  }, [text, isStreaming]);

  useEffect(() => {
    if (!isStreaming) return;

    displayedIndexRef.current = 0;
    let frameId: number;

    const tick = () => {
      const current = fullRef.current;
      const idx = displayedIndexRef.current;
      if (idx < current.length) {
        const remaining = current.length - idx;
        const chunkSize = Math.max(1, Math.floor(remaining / 10));
        const end = Math.min(idx + chunkSize, current.length);
        setDisplayed(current.slice(0, end));
        displayedIndexRef.current = end;
        frameId = requestAnimationFrame(tick);
      } else {
        setDisplayed(current);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isStreaming]);

  return (
    <div className="whitespace-pre-wrap font-normal leading-relaxed text-ink">
      {displayed}
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-sakura ml-0.5 align-text-bottom animate-pulse" />
      )}
    </div>
  );
}
