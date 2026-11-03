"use client";

import { useEffect, useState } from "react";

// Intro preloader (2026-11-02). Motion modelled on Aardvark Book Club's load
// sequence (layered waves, then books tumbling in) with KutuBooku's own
// palette and code-drawn books — no third-party artwork.
// Plays once per browser session; any click/key skips; reduced motion skips.

const SEEN_KEY = "kb:intro-seen";
const TOTAL_MS = 3000; // total time visible, including the exit transition
const EXIT_MS = 550;
const EXIT_START_MS = TOTAL_MS - EXIT_MS;

type Book = { cover: string; spine: string; emblem: string; w: number; h: number; style: React.CSSProperties; mobile?: string };

const BOOKS: Book[] = [
  // left, tumbling clockwise
  { cover: "#9fcbf2", spine: "#5b8fc4", emblem: "#f26b4f", w: 150, h: 210, style: { left: "6%", top: "18%", "--r0": "-60deg", "--r1": "-14deg", animationDelay: "380ms" } as React.CSSProperties, mobile: "max-sm:!top-[9%] max-sm:!left-[4%]" },
  // right, big
  { cover: "#1d2838", spine: "#f26b4f", emblem: "#f6c453", w: 190, h: 260, style: { right: "7%", top: "26%", "--r0": "55deg", "--r1": "12deg", animationDelay: "520ms" } as React.CSSProperties, mobile: "max-sm:!top-[58%] max-sm:!right-[2%]" },
  // bottom middle
  { cover: "#a9dfc0", spine: "#4f9c78", emblem: "#c9b7f1", w: 140, h: 196, style: { left: "38%", bottom: "-4%", "--r0": "-40deg", "--r1": "-6deg", animationDelay: "660ms" } as React.CSSProperties },
];

export function Preloader() {
  // Rendered on the server too, so the intro covers the page from the first paint.
  const [phase, setPhase] = useState<"play" | "exit" | "gone">("play");

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* storage blocked — just play */
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduced) {
      setPhase("gone"); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    const skip = () => setPhase((p) => (p === "play" ? "exit" : p));
    const t1 = setTimeout(skip, EXIT_START_MS);
    window.addEventListener("keydown", skip, { once: true });
    return () => {
      clearTimeout(t1);
      window.removeEventListener("keydown", skip);
    };
  }, []);

  useEffect(() => {
    if (phase !== "exit") return;
    const t = setTimeout(() => setPhase("gone"), EXIT_MS);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden
      onClick={() => setPhase("exit")}
      className={`fixed inset-0 z-[100] overflow-hidden bg-[#FDDAA6] transition-[translate,opacity] duration-[550ms] ease-[cubic-bezier(0.7,0,0.3,1)] ${
        phase === "exit" ? "-translate-y-full opacity-0" : ""
      }`}
    >
      {/* layered waves rising from the bottom */}
      {[
        { fill: "#f6c453", d: "M0 180 C 220 60 420 260 720 140 S 1220 40 1440 160 V 600 H 0 Z", delay: 0, top: "32%" },
        { fill: "#f7ab95", d: "M0 220 C 260 120 480 300 760 200 S 1180 90 1440 230 V 600 H 0 Z", delay: 110, top: "48%" },
        { fill: "#f26b4f", d: "M0 260 C 300 170 520 330 820 250 S 1220 160 1440 280 V 600 H 0 Z", delay: 220, top: "64%" },
      ].map((w, i) => (
        <svg
          key={i}
          viewBox="0 0 1440 600"
          preserveAspectRatio="none"
          className="absolute inset-x-0 h-[80%] w-full animate-[pre-wave_700ms_cubic-bezier(0.22,1,0.36,1)_backwards]"
          style={{ top: w.top, animationDelay: `${w.delay}ms` }}
        >
          <path d={w.d} fill={w.fill} />
        </svg>
      ))}

      {/* books tumbling in */}
      {BOOKS.map((b, i) => (
        <div
          key={i}
          className={`absolute animate-[pre-book_900ms_cubic-bezier(0.34,1.4,0.64,1)_both] [perspective:900px] ${b.mobile ?? ""}`}
          style={b.style}
        >
          <div
            className="relative scale-[0.62] sm:scale-100 [transform-style:preserve-3d]"
            style={{ width: b.w, height: b.h, transform: "rotateY(-18deg) rotateX(6deg)" }}
          >
            {/* page block (right edge) */}
            <span className="absolute inset-y-[3%] -right-[10px] w-[12px] rounded-r-[3px] bg-[repeating-linear-gradient(90deg,#fffdf8_0_2px,#e8e1d4_2px_3px)]" />
            {/* cover */}
            <span
              className="absolute inset-0 rounded-[6px] shadow-[0_30px_50px_-20px_rgba(29,40,56,0.55)]"
              style={{ background: `linear-gradient(135deg, ${b.cover}, ${b.cover} 60%, color-mix(in srgb, ${b.cover} 80%, #000))` }}
            />
            {/* spine */}
            <span className="absolute inset-y-0 left-0 w-[16%] rounded-l-[6px]" style={{ background: b.spine }} />
            {/* emblem */}
            <span className="absolute right-[14%] top-[10%] size-[22%] rounded-full" style={{ background: b.emblem }} />
            <span className="absolute bottom-[12%] left-[26%] h-[5%] w-[50%] rounded-full bg-white/40" />
            <span className="absolute bottom-[20%] left-[26%] h-[5%] w-[34%] rounded-full bg-white/25" />
          </div>
        </div>
      ))}

      {/* wordmark tile */}
      <div className="absolute inset-0 grid place-items-center">
        <span className="animate-[pre-mark_600ms_cubic-bezier(0.34,1.56,0.64,1)_250ms_backwards] rounded-[22px] bg-[#1d2838] px-7 py-4 text-3xl font-medium tracking-[-0.03em] text-white shadow-[0_20px_40px_-18px_rgba(29,40,56,0.7)] sm:text-4xl">
          kutubooku
        </span>
      </div>
    </div>
  );
}
