// A real-looking 3D book in CSS (no WebGL): cover, back, spine, page block and
// page edges, with a slow float. Shared by the home hero carousel and the book page.
// Moved out of BookHero.tsx on 2026-11-03.

import Image from "next/image";
import { memo } from "react";

export type Book3DData = { src: string; title: string; ratio: number; spine: string };

// Real cover proportions (width / height) read from the image files.
export const BOOKS: Book3DData[] = [
  { src: "/covers/the-dot.jpg", title: "The Dot", ratio: 0.995, spine: "#e8553a" },
  { src: "/covers/lost-and-found.jpg", title: "Lost and Found", ratio: 0.983, spine: "#2f9e8f" },
  { src: "/covers/the-magical-yet.jpg", title: "The Magical Yet", ratio: 1, spine: "#5b4a8b" },
  { src: "/covers/jabari-jumps.jpg", title: "Jabari Jumps", ratio: 0.861, spine: "#3e9fb8" },
  { src: "/covers/the-color-monster.jpg", title: "The Color Monster", ratio: 1.004, spine: "#f1a903" },
  { src: "/covers/after-the-fall.jpg", title: "After the Fall", ratio: 0.778, spine: "#3b6e8f" },
  { src: "/covers/i-am-human.jpg", title: "I Am Human", ratio: 1, spine: "#c2237f" },
  { src: "/covers/the-rabbit-listened.jpg", title: "The Rabbit Listened", ratio: 1, spine: "#7fc3cf" },
  { src: "/covers/the-heart-and-the-bottle.jpg", title: "The Heart and the Bottle", ratio: 0.959, spine: "#e9c21a" },
  { src: "/covers/the-invisible-boy.jpg", title: "The Invisible Boy", ratio: 0.809, spine: "#8aa6b8" },
  { src: "/covers/the-wonderful-things-you-will-be.jpg", title: "The Wonderful Things You Will Be", ratio: 0.952, spine: "#2f7f86" },
  { src: "/covers/when-sadness-is-at-your-door.jpg", title: "When Sadness Is at Your Door", ratio: 0.908, spine: "#4fa98a" },
  { src: "/covers/you-choose.jpg", title: "You Choose", ratio: 0.869, spine: "#d6312b" },
  { src: "/covers/the-bad-seed.jpg", title: "The Bad Seed", ratio: 1, spine: "#7a5a3a" },
  { src: "/covers/the-most-magnificent-thing.jpg", title: "The Most Magnificent Thing", ratio: 1, spine: "#e0782c" },
];

const BY_COVER = new Map(BOOKS.map((b) => [b.src, b]));

/** 3D data for a cover; unknown covers get a square book with the given spine colour. */
export function book3DFor(cover: string, title: string, fallbackSpine: string): Book3DData {
  return BY_COVER.get(cover) ?? { src: cover, title, ratio: 1, spine: fallbackSpine };
}

export type Tilt = { rx: number; ry: number; rz: number };

// Resting tilt cycles so neighbours don't all face the same way.
export const TILTS: Tilt[] = [
  { rx: 10, ry: 22, rz: 6 },
  { rx: 6, ry: -16, rz: -3 },
  { rx: 12, ry: 14, rz: 4 },
  { rx: 4, ry: -24, rz: -5 },
];

// memo: clicking one book in the hero re-renders the carousel; unchanged books skip it.
export const Book3D = memo(function Book3D({
  b,
  i,
  height = 440,
  depth = 38,
  tilt,
  focused = false,
  eager = false,
  sizes = "(min-width: 1536px) 460px, 300px",
}: {
  b: Book3DData;
  /** Position in a list: picks the resting tilt and staggers the float. */
  i: number;
  /** Book height in px (width follows the cover ratio). */
  height?: number;
  /** Thickness in px. */
  depth?: number;
  /** Resting tilt; defaults to the cycle in TILTS. */
  tilt?: Tilt;
  /** Shows the keyboard focus ring. */
  focused?: boolean;
  /** Load the cover straight away (above the fold). */
  eager?: boolean;
  sizes?: string;
}) {
  const h = height;
  const w = Math.round(h * b.ratio);
  const d = depth;
  const t = tilt ?? TILTS[i % TILTS.length];
  const face = "absolute left-1/2 top-1/2 [backface-visibility:hidden]";
  return (
    <div
      data-book3d // BookHero pauses this float while the book is off screen
      className="relative [transform-style:preserve-3d] motion-safe:animate-[book-float_var(--dur)_ease-in-out_infinite]"
      style={
        {
          width: w,
          height: h,
          "--dur": `${9 + (i % 4) * 1.3}s`,
          "--rx0": `${t.rx}deg`,
          "--ry0": `${t.ry}deg`,
          "--rz0": `${t.rz}deg`,
          animationDelay: `-${(i % 5) * 1.7}s`,
          transform: `rotateX(${t.rx}deg) rotateY(${t.ry}deg) rotateZ(${t.rz}deg)`,
        } as React.CSSProperties
      }
    >
      {/* front cover */}
      <div className={`${face} overflow-hidden rounded-r-[8px] rounded-l-[3px]`} style={{ width: w, height: h, transform: `translate(-50%,-50%) translateZ(${d / 2}px)` }}>
        <Image src={b.src} alt="" fill sizes={sizes} className="object-cover" {...(eager ? { loading: "eager", fetchPriority: "high" } : {})} />
        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgb(255_255_255/0.28)_0%,transparent_38%,transparent_70%,rgb(0_0_0/0.14)_100%)]" />
        <span className="pointer-events-none absolute inset-y-0 left-0 w-[6%] bg-gradient-to-r from-black/25 to-transparent" />
      </div>
      {/* keyboard focus ring (sits just in front of the cover) */}
      <span
        aria-hidden
        className={`${face} pointer-events-none rounded-r-[14px] rounded-l-[9px] shadow-[0_0_0_8px_#fffdf8,0_0_0_16px_#1d2838] transition-opacity duration-200 ${focused ? "opacity-100" : "opacity-0"}`}
        style={{ width: w, height: h, transform: `translate(-50%,-50%) translateZ(${d / 2 + 1}px)` }}
      />
      {/* back cover */}
      <div className={`${face} rounded-l-[8px] rounded-r-[3px]`} style={{ width: w, height: h, background: b.spine, transform: `translate(-50%,-50%) rotateY(180deg) translateZ(${d / 2}px)`, filter: "brightness(0.8)" }} />
      {/* spine */}
      <div className={`${face} grid place-items-center overflow-hidden`} style={{ width: d, height: h, background: `linear-gradient(90deg, ${b.spine}, color-mix(in srgb, ${b.spine} 70%, #000))`, transform: `translate(-50%,-50%) rotateY(-90deg) translateZ(${w / 2}px)` }}>
        <span className="rotate-180 whitespace-nowrap text-[12px] font-semibold uppercase tracking-[0.12em] text-white/85 [writing-mode:vertical-rl]">{b.title}</span>
      </div>
      {/* page block */}
      <div className={face} style={{ width: d, height: h - 6, background: "repeating-linear-gradient(90deg,#fffaf0 0 2px,#e9e1d1 2px 3px)", transform: `translate(-50%,-50%) rotateY(90deg) translateZ(${w / 2 - 2}px)` }} />
      {/* top + bottom page edges */}
      <div className={face} style={{ width: w - 4, height: d, background: "repeating-linear-gradient(0deg,#fffaf0 0 2px,#ece4d4 2px 3px)", transform: `translate(-50%,-50%) rotateX(90deg) translateZ(${h / 2 - 2}px)` }} />
      <div className={face} style={{ width: w - 4, height: d, background: "#d9cfbd", transform: `translate(-50%,-50%) rotateX(-90deg) translateZ(${h / 2 - 2}px)` }} />
    </div>
  );
});
