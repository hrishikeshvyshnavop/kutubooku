"use client";

// In-page list animations as a View Transition: the box's Remove / Move to…, and the catalogue's
// filters. Elements opt in with data attributes instead of a permanent view-transition-name:
//   <li data-vt-name="cat-<id>" data-vt-class="cat-card">
// The names are put on only while the transition runs (old state before, new state after the
// update), so page-to-page transitions never see them and the page still moves as one piece.
// .vt-local on <html> keeps the sticky header above the moving items (globals.css).
// Falls back to an instant change (older browsers, reduced motion).

import { flushSync } from "react-dom";

type VTDocument = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };

function setNames(on: boolean) {
  document.querySelectorAll<HTMLElement>("[data-vt-name]").forEach((el) => {
    el.style.setProperty("view-transition-name", on ? el.dataset.vtName! : null);
    el.style.setProperty("view-transition-class", on ? el.dataset.vtClass ?? null : null);
  });
}

export function localTransition(update: () => void) {
  const d = document as VTDocument;
  if (!d.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return update();
  const html = document.documentElement;
  html.classList.add("vt-local");
  setNames(true);
  d.startViewTransition(() => {
    flushSync(update);
    setNames(true); // items that just appeared
  }).finished.finally(() => {
    html.classList.remove("vt-local");
    setNames(false);
  });
}
