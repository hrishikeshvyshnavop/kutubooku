"use client";

import { useEffect, useRef } from "react";
import { stableVh } from "../../_lib/viewport";

const PEEK = 20;

export function CollectionsDeck({ count, children }: { count: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stack = ref.current;
    if (!stack || !count) return;
    const cards = [...stack.querySelectorAll<HTMLElement>(":scope > section")];
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pin: number[] = [];

    const update = () => {
      if (still) return;
      const vh = window.innerHeight;
      cards.forEach((el, i) => {
        const next = cards[i + 1];
        if (!next) return;
        const span = Math.max(1, vh - pin[i + 1]);
        const p = Math.min(1, Math.max(0, (vh - next.getBoundingClientRect().top) / span));
        el.style.transform = p ? `scale(${1 - 0.05 * p})` : "";
        const dim = el.querySelector<HTMLElement>(":scope > [data-dim]");
        if (dim) dim.style.opacity = String(0.3 * p);
      });
    };

    const layout = () => {
      cards.forEach((el, i) => {
        pin[i] = Math.min(i * PEEK, stableVh() - el.offsetHeight);
        el.style.top = `${pin[i]}px`;
      });
      update();
    };

    let raf = 0;
    let near = false;
    const onScroll = () => {
      if (!near) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    const io = new IntersectionObserver(([e]) => (near = e.isIntersecting), { rootMargin: "50% 0px" });
    const ro = new ResizeObserver(layout);
    io.observe(stack);
    cards.forEach((el) => ro.observe(el));
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", layout);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", layout);
    };
  }, [count]);

  return (
    <div ref={ref} className="relative z-10 -mt-8 bg-[#fffdf8] sm:-mt-12">
      {children}
    </div>
  );
}
