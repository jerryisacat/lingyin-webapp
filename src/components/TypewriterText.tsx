"use client";

import { useEffect, useRef, useState } from "react";

interface TypewriterTextProps {
  text: string;
  isStreaming: boolean;
}

export default function TypewriterText({ text, isStreaming }: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState("");
  const fullRef = useRef(text);

  useEffect(() => {
    fullRef.current = text;
  }, [text]);

  useEffect(() => {
    if (!isStreaming && text) {
      setDisplayed(text);
      return;
    }

    let frameId: number;
    let index = 0;

    const tick = () => {
      const current = fullRef.current;
      if (index < current.length) {
        const chunkSize = Math.max(1, Math.floor((current.length - index) / 10));
        const end = Math.min(index + chunkSize, current.length);
        setDisplayed(current.slice(0, end));
        index = end;
        frameId = requestAnimationFrame(tick);
      } else {
        setDisplayed(current);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isStreaming, text]);

  return (
    <div className="whitespace-pre-wrap font-normal leading-relaxed text-ink">
      {displayed}
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-sakura ml-0.5 align-text-bottom animate-pulse" />
      )}
    </div>
  );
}
