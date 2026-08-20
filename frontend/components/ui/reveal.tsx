"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  /** Delay before animation kicks in (ms). */
  delay?: number;
  /** How far to translate the element on Y before reveal (px). */
  y?: number;
  className?: string;
  /** Animation easing curve length (ms). */
  duration?: number;
};

/**
 * Reveal: fades + slides children into view when they intersect the viewport.
 * Uses IntersectionObserver. Honors prefers-reduced-motion.
 */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  duration = 700,
  className,
}: RevealProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const id = window.setTimeout(() => setShown(true), 0);
      return () => window.clearTimeout(id);
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            obs.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transform: shown ? "translateY(0)" : `translateY(${y}px)`,
        opacity: shown ? 1 : 0,
        transitionProperty: "transform, opacity",
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        transitionDelay: `${delay}ms`,
        willChange: "transform, opacity",
      }}
      className={cn(className)}
    >
      {children}
    </div>
  );
}
