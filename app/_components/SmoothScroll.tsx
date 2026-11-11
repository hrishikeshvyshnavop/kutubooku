"use client";

// Page scrolling.
// 2026-11-05: Lenis was removed (native scrolling only): when the main thread was busy (images
// decoding, prefetching, the hero's 3D books) its rAF-driven scroll froze with it.
// 2026-11-11: brought back, driven by GSAP (gsap.ticker + ScrollTrigger), for mouse wheels
// only, because the site felt flat without the eased wheel scroll. Touch (phones, tablets) and trackpad momentum stay native — no syncTouch — so the
// "stuck" case can't happen there. Reduced motion: Lenis is not started at all.
// - pageScroll: scroll the page to a position, smoothly or instantly; target() is where an
//   in-flight smooth scroll is heading (the home book row adds to it, gesture after gesture).
// - Freeze the page behind an open modal dialog (lenis.stop() + html.kb-scroll-lock;
//   scrollbar-gutter keeps the layout from shifting when the scrollbar goes).
// Inner scrollers opt out with data-lenis-prevent (book sheet, chat thread) or are found by
// allowNestedScroll. A wheel event a component already took (preventDefault, e.g. the home book
// row turning sideways swipes into page scroll) is left alone.

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "lenis/dist/lenis.css";

let lenis: Lenis | null = null;
let heading: number | null = null; // target of the current native smooth scroll, if any

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
    // GSAP drives the scroll: one shared ticker for Lenis and any GSAP / ScrollTrigger animation,
    // so scroll-linked tweens stay in step with the eased scroll. (Not ScrollSmoother: it moves the
    // page inside a transformed wrapper, which breaks the position: sticky the site relies on.)
    const raf = (time: number) => lenis?.raf(time * 1000);
    if (!reducedMotion()) {
      lenis = new Lenis({
        autoRaf: false,
        lerp: 0.1,
        smoothWheel: true,
        syncTouch: false, // touch scrolling stays the browser's own
        allowNestedScroll: true,
        stopInertiaOnNavigate: true,
        prevent: (node) => !!node.closest("dialog, [data-lenis-prevent]"),
        // Skip wheel/touch events a component already handled itself.
        virtualScroll: ({ event }) => !event.defaultPrevented,
      });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0); // no catch-up jumps after a busy frame
    }

    const done = () => (heading = null);
    // A wheel / touch scroll by the user takes over from any native smooth scroll we started,
    // unless a handler took the gesture for itself.
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
