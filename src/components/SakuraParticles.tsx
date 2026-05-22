"use client";

import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 18;

export default function SakuraParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const particle = document.createElement("div");
      particle.className = "sakura-particle";

      const size = Math.random() * 10 + 6;
      const left = Math.random() * 100;
      const delay = Math.random() * 8;
      const duration = Math.random() * 6 + 8;
      const opacity = Math.random() * 0.4 + 0.3;

      particle.style.cssText = `
        width: ${size}px;
        height: ${size * 1.2}px;
        left: ${left}%;
        opacity: ${opacity};
        animation: sakura-fall ${duration}s ${delay}s linear infinite;
        --sway: ${Math.random() * 60 - 30}px;
      `;

      container.appendChild(particle);
      particles.push(particle);
    }

    return () => {
      particles.forEach((p) => p.remove());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden z-10"
      aria-hidden="true"
    />
  );
}
