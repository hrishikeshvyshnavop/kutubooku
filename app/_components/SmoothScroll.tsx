"use client";

// Page scrolling (2026-11-05): native browser scrolling. Lenis (smooth scroll driven from a
// main-thread rAF loop) was removed: whenever the page was busy (images decoding, a book page
// prefetching, the hero's 3D books), the scroll froze with it, which read as the site getting
// "stuck". Native scrolling runs on the compositor, so it stays smooth even then.
// Kept from before, with the same API:
// - pageScroll: scroll the page to a position, smoothly or instantly; target() is where an
//   in-flight smooth scroll is heading (the home book row adds to it, gesture after gesture).
// - Freeze the page behind an open modal dialog (html.kb-scroll-lock; scrollbar-gutter keeps
//   the layout from shifting when the scrollbar goes).

import { useEffect } from "react";

let heading: number | null = null; // target of the current smooth scroll, if any

export const pageScroll = {
  target: () => heading ?? window.scrollY,
  to: (top: number, immediate = false) => {
    const smooth = !immediate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    heading = smooth ? top : null;
    window.scrollTo({ top, behavior: smooth ? "smooth" : "instant" });
  },
};

export function SmoothScroll() {
  useEffect(() => {
    const done = () => (heading = null);
    // A wheel / touch scroll by the user takes over from any scroll we started, unless a handler
    // took the gesture for itself (the home book row turns sideways swipes into page scroll).
    const userScroll = (e: Event) => {
      if (!e.defaultPrevented) heading = null;
    };
    window.addEventListener("scrollend", done);
    window.addEventListener("wheel", userScroll, { passive: true });
    window.addEventListener("touchstart", userScroll, { passive: true });

    const html = document.documentElement;
    const syncDialogs = () => html.classList.toggle("kb-scroll-lock", !!document.querySelector("dialog[open]:modal"));
    const mo = new MutationObserver(syncDialogs);
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });

    return () => {
      window.removeEventListener("scrollend", done);
      window.removeEventListener("wheel", userScroll);
      window.removeEventListener("touchstart", userScroll);
      mo.disconnect();
      html.classList.remove("kb-scroll-lock");
    };
  }, []);

  return null;
}
