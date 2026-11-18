"use client";

import { useEffect, useRef } from "react";

export function HideOnScroll({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let last = window.scrollY;
    let raf = 0;
    const setHidden = (h: boolean) => {
      if (h) el.dataset.hidden = "";
      else delete el.dataset.hidden;
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const dy = y - last;
        if (y < 80) setHidden(false);
        else if (dy > 6) setHidden(true);
        else if (dy < -6) setHidden(false);
        if (Math.abs(dy) > 6 || y < 80) last = y;
      });
    };
    const reveal = () => setHidden(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("kb:reveal-header", reveal);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("kb:reveal-header", reveal);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`site-header sticky top-0 translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[hidden]:not-focus-within:-translate-y-full motion-reduce:transition-none ${className}`}
    >
      {children}
    </div>
  );
}
