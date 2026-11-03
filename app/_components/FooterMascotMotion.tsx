"use client";

// Calm idle life for the footer mascot (FooterMascot), like a sleepy pet. Web Animations
// API (no global CSS). Everything is slow, continuous and eased; no hops or springs
// (the earlier idle "peek" hop read as sudden and was removed on 2026-11-03):
// - breathing: a soft stretch up from the bottom edge every ~4.5s (the flat cut stays on the line);
// - sway: a very slow lean of ±1.5° over ~8s, out of step with the breathing so the two
//   never line up into a twitch;
// - hover: it slowly perks up a little (rises 1.5%) and settles back when the pointer leaves.
// Runs only while visible; off with reduced motion.

import { useEffect, useRef } from "react";

const EASE = "cubic-bezier(0.45, 0, 0.55, 1)"; // ease-in-out sine: no snap at the turns

export function FooterMascotMotion({ children }: { children: React.ReactNode }) {
  const breatheRef = useRef<HTMLDivElement>(null); // outer: breathing
  const swayRef = useRef<HTMLDivElement>(null); // middle: sway
  const perkRef = useRef<HTMLDivElement>(null); // inner: hover perk-up (separate elements, so they stack)

  useEffect(() => {
    const breatheEl = breatheRef.current;
    const swayEl = swayRef.current;
    const perkEl = perkRef.current;
    if (!breatheEl || !swayEl || !perkEl || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const breathe = breatheEl.animate(
      [{ transform: "scale(1, 1)" }, { transform: "scale(1.008, 1.022)" }, { transform: "scale(1, 1)" }],
      { duration: 4500, iterations: Infinity, easing: EASE },
    );
    const sway = swayEl.animate(
      [{ transform: "rotate(-1.5deg)" }, { transform: "rotate(1.5deg)" }],
      { duration: 4000, iterations: Infinity, direction: "alternate", easing: EASE },
    );
    breathe.pause();
    sway.pause();

    const io = new IntersectionObserver(([e]) => {
      for (const a of [breathe, sway]) {
        if (e.isIntersecting) a.play();
        else a.pause();
      }
    });
    io.observe(breatheEl);

    // Hover: rise slowly, then settle back from wherever it got to.
    let perk: Animation | null = null;
    const current = () => getComputedStyle(perkEl).transform;
    const to = (transform: string, duration: number) => {
      const from = current();
      perk?.cancel();
      perk = perkEl.animate([{ transform: from === "none" ? "translateY(0)" : from }, { transform }], { duration, easing: EASE, fill: "forwards" });
    };
    const onEnter = () => to("translateY(-1.5%)", 800);
    const onLeave = () => to("translateY(0)", 1100);
    perkEl.addEventListener("pointerenter", onEnter);
    perkEl.addEventListener("pointerleave", onLeave);

    return () => {
      io.disconnect();
      breathe.cancel();
      sway.cancel();
      perk?.cancel();
      perkEl.removeEventListener("pointerenter", onEnter);
      perkEl.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={breatheRef} className="absolute inset-0 origin-bottom">
      <div ref={swayRef} className="absolute inset-0 origin-bottom">
        <div ref={perkRef} className="absolute inset-0 origin-bottom">
          {children}
        </div>
      </div>
    </div>
  );
}
