"use client";

// Site-wide smooth scrolling: Lenis eases the real window scroll on its own rAF loop.
// Native scroll stays in charge, so `position: sticky` and the window "scroll"
// listeners keep working.
// GSAP + ScrollTrigger used to drive this, but nothing used ScrollTrigger, so they
// were removed (2026-11-03): ~45 KB gzipped less JS on every page. If a scroll-linked
// GSAP animation is added later, drive Lenis from gsap.ticker again and call
// ScrollTrigger.update on Lenis's "scroll" event.

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

export function SmoothScroll() {
  useEffect(() => {
    // Respect reduced motion: keep plain native scrolling.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      anchors: true, // smooth in-page #links
      allowNestedScroll: true, // inner scroll areas scroll themselves
      stopInertiaOnNavigate: true,
      // Dialogs (book details, shelf) scroll natively.
      prevent: (node) => !!node.closest("dialog, [data-lenis-prevent]"),
    });

    // Freeze the page behind an open modal dialog.
    const syncDialogs = () => (document.querySelector("dialog[open]:modal") ? lenis.stop() : lenis.start());
    const mo = new MutationObserver(syncDialogs);
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });

    return () => {
      mo.disconnect();
      lenis.destroy();
    };
  }, []);

  return null;
}
