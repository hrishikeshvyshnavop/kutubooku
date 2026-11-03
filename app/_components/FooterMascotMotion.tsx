"use client";

// Idle life for the footer mascot (FooterMascot). Wraps the mascot art and animates it
// with the Web Animations API (no global CSS):
// - breathing, always while on screen: a slow stretch up from the bottom edge, so the
//   flat cut stays on the line;
// - idle peek: once you stop scrolling (~1.2s), a little hop + head tilt, repeated
//   every few seconds while you stay idle;
// - hover: a quick happy wiggle.
// Pixels never leave the box's bottom edge: the art extends ~5% below the crop
// (FooterMascot), so a hop of a few % up never opens a gap.
// Runs only while visible; off with reduced motion.

import { useEffect, useRef } from "react";

const IDLE_AFTER = 1200; // ms without scrolling before the first peek
const PEEK_EVERY = 4200; // ms between peeks while idle

const PEEK: Keyframe[] = [
  { transform: "translateY(0) rotate(0deg)" },
  { transform: "translateY(-4%) rotate(-4deg)", offset: 0.25 },
  { transform: "translateY(-1%) rotate(3deg)", offset: 0.55 },
  { transform: "translateY(0) rotate(0deg)" },
];
const WIGGLE: Keyframe[] = [
  { transform: "rotate(0deg)" },
  { transform: "rotate(-5deg)" },
  { transform: "rotate(5deg)" },
  { transform: "rotate(-3deg)" },
  { transform: "rotate(0deg)" },
];

export function FooterMascotMotion({ children }: { children: React.ReactNode }) {
  const breatheRef = useRef<HTMLDivElement>(null); // outer: breathing
  const moveRef = useRef<HTMLDivElement>(null); // inner: peeks and wiggles (separate element, so they stack)

  useEffect(() => {
    const breatheEl = breatheRef.current;
    const moveEl = moveRef.current;
    if (!breatheEl || !moveEl || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const breathe = breatheEl.animate(
      [{ transform: "scale(1, 1)" }, { transform: "scale(1.012, 1.03)" }, { transform: "scale(1, 1)" }],
      { duration: 3200, iterations: Infinity, easing: "ease-in-out" },
    );
    breathe.pause();

    let visible = false;
    let idleTimer = 0;
    let peekTimer = 0;
    let move: Animation | null = null;

    const play = (frames: Keyframe[], duration: number) => {
      if (move && move.playState === "running") return; // let the current one finish
      move = moveEl.animate(frames, { duration, easing: "cubic-bezier(0.34,1.4,0.64,1)" });
    };
    const stopPeeking = () => {
      window.clearTimeout(idleTimer);
      window.clearInterval(peekTimer);
    };
    const startIdleCountdown = () => {
      stopPeeking();
      if (!visible) return;
      idleTimer = window.setTimeout(() => {
        play(PEEK, 900);
        peekTimer = window.setInterval(() => play(PEEK, 900), PEEK_EVERY);
      }, IDLE_AFTER);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) {
        breathe.play();
        startIdleCountdown();
      } else {
        breathe.pause();
        stopPeeking();
      }
    });
    io.observe(breatheEl);

    const onScroll = () => startIdleCountdown(); // any scroll resets "idle"
    const onEnter = () => play(WIGGLE, 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    moveEl.addEventListener("pointerenter", onEnter);

    return () => {
      io.disconnect();
      stopPeeking();
      breathe.cancel();
      move?.cancel();
      window.removeEventListener("scroll", onScroll);
      moveEl.removeEventListener("pointerenter", onEnter);
    };
  }, []);

  return (
    <div ref={breatheRef} className="absolute inset-0 origin-bottom">
      <div ref={moveRef} className="absolute inset-0 origin-bottom">
        {children}
      </div>
    </div>
  );
}
