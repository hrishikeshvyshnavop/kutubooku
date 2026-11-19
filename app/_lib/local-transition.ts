"use client";

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
    setNames(true);
  }).finished.finally(() => {
    html.classList.remove("vt-local");
    setNames(false);
  });
}
