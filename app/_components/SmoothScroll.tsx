"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "lenis/dist/lenis.css";

let lenis: Lenis | null = null;
let heading: number | null = null;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const pageScroll = {
  target: () => (lenis ? lenis.targetScroll : (heading ?? window.scrollY)),
  to: (top: number, immediate = false) => {
    if (lenis) {
      lenis.scrollTo(top, { immediate, force: true });
      return;
    }
    const smooth = !immediate && !reducedMotion();
    heading = smooth ? top : null;
    window.scrollTo({ top, behavior: smooth ? "smooth" : "instant" });
  },
};

export function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const raf = (time: number) => lenis?.raf(time * 1000);
    if (!reducedMotion()) {
      lenis = new Lenis({
        autoRaf: false,
        lerp: 0.1,
        smoothWheel: true,
        syncTouch: false,
        allowNestedScroll: true,
        stopInertiaOnNavigate: true,
        prevent: (node) => !!node.closest("dialog, [data-lenis-prevent]"),
        virtualScroll: ({ event }) => !event.defaultPrevented,
      });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
    }

    const done = () => (heading = null);
    const userScroll = (e: Event) => {
      if (!e.defaultPrevented) heading = null;
    };
    window.addEventListener("scrollend", done);
    window.addEventListener("wheel", userScroll, { passive: true });
    window.addEventListener("touchstart", userScroll, { passive: true });

    const html = document.documentElement;
    const syncDialogs = () => {
      const modal = !!document.querySelector("dialog[open]:modal");
      html.classList.toggle("kb-scroll-lock", modal);
      if (modal) lenis?.stop();
      else lenis?.start();
    };
    const mo = new MutationObserver(syncDialogs);
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });

    return () => {
      window.removeEventListener("scrollend", done);
      window.removeEventListener("wheel", userScroll);
      window.removeEventListener("touchstart", userScroll);
      mo.disconnect();
      html.classList.remove("kb-scroll-lock");
      gsap.ticker.remove(raf);
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  return null;
}
