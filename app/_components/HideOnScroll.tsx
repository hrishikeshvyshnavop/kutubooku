"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sticky bar that slides up out of view while scrolling down and comes back on
 * any scroll up. Always shown near the top of the page, and while something
 * inside has keyboard focus (focus-within).
 */
export function HideOnScroll({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    last.current = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const dy = y - last.current;
        if (y < 80) setHidden(false); // near the top: always visible
        else if (dy > 6) setHidden(true); // scrolling down
        else if (dy < -6) setHidden(false); // scrolling up
        if (Math.abs(dy) > 6 || y < 80) last.current = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      className={`sticky top-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-within:translate-y-0 motion-reduce:transition-none ${
        hidden ? "-translate-y-full" : "translate-y-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
