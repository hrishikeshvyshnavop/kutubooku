"use client";

// Book page cover as the home hero's 3D book: same faces, spine and slow float,
// one larger book. It also turns a little toward the mouse (like the hero's parallax).
// Reduced motion: no float, no tilt.

import { useEffect, useRef, ViewTransition } from "react";
import { Book3D, book3DFor } from "../../_components/Book3D";
import type { MockBook } from "../../_data/curation-mock";

const H = 600; // book height at full size (the design's cover slot is 624px wide)

export function BookCover3D({ book }: { book: MockBook }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const b = book3DFor(book.cover, book.title, book.tone);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // -1…1 from the book's centre, measured against the viewport so it reacts page-wide
        const r = scene.getBoundingClientRect();
        const mx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
        const my = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
        scene.style.setProperty("--mx", mx.toFixed(3));
        scene.style.setProperty("--my", my.toFixed(3));
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div
      ref={sceneRef}
      role="img"
      aria-label={`Cover of ${book.title}`}
      className="relative h-[360px] w-full [perspective:1700px] [perspective-origin:50%_45%] sm:h-[500px] lg:h-[680px]"
      style={{ "--mx": 0, "--my": 0 } as React.CSSProperties}
    >
      {/* soft shadow on the ground */}
      <div aria-hidden className="absolute bottom-[4%] left-1/2 h-[7%] w-[46%] max-w-[420px] -translate-x-1/2 rounded-[50%] bg-[#1d2838]/25 blur-2xl" />
      {/* Book drawn at full size and scaled per breakpoint (3D maths stays in px). */}
      {/* Same view-transition name as the book clicked in the home hero: it morphs into this one. */}
      <ViewTransition name={`book-${book.id}`} share="book-morph" default="none">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.5] [transform-style:preserve-3d] sm:scale-[0.7] lg:scale-100">
        <div
          className="[transform-style:preserve-3d] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ transform: "rotateY(calc(var(--mx) * 16deg)) rotateX(calc(var(--my) * -10deg))" }}
        >
          <Book3D b={b} i={0} height={H} depth={44} tilt={{ rx: 8, ry: 18, rz: 3 }} eager sizes="(min-width: 1024px) 600px, 420px" />
        </div>
      </div>
      </ViewTransition>
    </div>
  );
}
