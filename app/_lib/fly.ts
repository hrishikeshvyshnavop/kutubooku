"use client";

import { getImageProps } from "next/image";

const DURATION = 820;

function flightImage(source: Element | null, cover: string): string {
  const shown = source?.querySelector?.("img") as HTMLImageElement | null;
  if (shown?.currentSrc && shown.complete) return shown.currentSrc;
  return getImageProps({ src: cover, alt: "", width: 180, height: 240 }).props.src;
}

const visible = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
};

function findSource(bookId: string, scope: ParentNode): Element | null {
  const all = [...scope.querySelectorAll(`[data-book-cover="${CSS.escape(bookId)}"]`)];
  return all.find(visible) ?? null;
}

function findTarget(scope: ParentNode, inDialog: boolean): HTMLElement | null {
  const all = [...scope.querySelectorAll<HTMLElement>("[data-box-target]")].filter(
    (el) => inDialog || !el.closest("dialog"),
  );
  return all.find((el) => el.dataset.boxTarget === "header" && el.getClientRects().length > 0) ?? all.find(visible) ?? null;
}

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function flyToBox({
  bookId,
  cover,
  from,
  ratio = 1,
}: {
  bookId: string;
  cover: string;
  from?: Element | null;
  ratio?: number;
}) {
  if (typeof window === "undefined") return;
  const dialog = (from?.closest("dialog[open]") as HTMLDialogElement | null) ?? null;
  const scope: ParentNode = dialog ?? document;

  if (!dialog) window.dispatchEvent(new Event("kb:reveal-header"));
  const target = findTarget(scope, Boolean(dialog));
  if (!target) return;

  if (reduced()) {
    target.dispatchEvent(new CustomEvent("kb:box-catch"));
    return;
  }

  const cover_ = findSource(bookId, scope);
  const source = cover_ ?? from;
  if (!source) return;
  const r0 = source.getBoundingClientRect();
  const s = cover_
    ? r0
    : (() => {
        const bw = 96;
        const bh = bw / ratio;
        return { left: r0.left + r0.width * 0.15 - bw / 2, top: r0.top + r0.height / 2 - bh / 2, width: bw, height: bh };
      })();
  target.dispatchEvent(new CustomEvent("kb:box-incoming"));

  const host = dialog ?? document.body;
  const w = Math.min(s.width, 180);
  const h = Math.min(s.height, (180 / Math.max(s.width, 1)) * s.height);
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  Object.assign(el.style, {
    position: "fixed",
    left: "0px",
    top: "0px",
    width: `${w}px`,
    height: `${h}px`,
    zIndex: "2147483000",
    pointerEvents: "none",
    borderRadius: "4px 10px 10px 4px",
    backgroundImage: `url("${flightImage(cover_, cover)}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    boxShadow: "0 18px 30px -12px rgba(29,40,56,0.55)",
    willChange: "transform, opacity",
    transformOrigin: "50% 50%",
  } satisfies Partial<CSSStyleDeclaration>);
  host.appendChild(el);

  const origin = el.getBoundingClientRect();
  const sx = s.left + s.width / 2 - w / 2 - origin.left;
  const sy = s.top + s.height / 2 - h / 2 - origin.top;
  const endScale = 26 / w;

  const start = performance.now();
  let raf = 0;
  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / DURATION);
    const r = target.getBoundingClientRect();
    const tx = r.left + r.width / 2 - w / 2 - origin.left;
    const ty = r.top + r.height / 2 - h / 2 - origin.top;
    const p = easeInOut(t);
    const lift = Math.sin(Math.PI * Math.min(1, t * 1.6)) * -40;
    const arc = Math.sin(Math.PI * p) * -Math.max(120, Math.abs(ty - sy) * 0.35);
    const x = sx + (tx - sx) * p;
    const y = sy + (ty - sy) * p + arc + (t < 0.6 ? lift * (1 - p) : 0);
    const grow = t < 0.18 ? 1 + 0.12 * easeOut(t / 0.18) : 1.12 - (1.12 - endScale) * easeInOut((t - 0.18) / 0.82);
    const rot = Math.sin(t * Math.PI * 1.5) * -14 + t * 18;
    el.style.transform = `translate(${x}px, ${y}px) scale(${grow}) rotate(${rot}deg)`;
    el.style.opacity = t > 0.92 ? String(1 - (t - 0.92) / 0.08) : "1";
    if (t < 1) raf = requestAnimationFrame(frame);
    else {
      el.remove();
      target.dispatchEvent(new CustomEvent("kb:box-catch"));
      catchPulse(target);
    }
  };
  raf = requestAnimationFrame(frame);
  setTimeout(() => {
    cancelAnimationFrame(raf);
    if (el.isConnected) {
      el.remove();
      target.dispatchEvent(new CustomEvent("kb:box-catch"));
    }
  }, DURATION + 600);
}

function catchPulse(target: HTMLElement) {
  target.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(0.86, 1.1)", offset: 0.25 },
      { transform: "scale(1.12, 0.92)", offset: 0.55 },
      { transform: "scale(1)" },
    ],
    { duration: 520, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
  );
  const r = target.getBoundingClientRect();
  const host = target.closest("dialog[open]") ?? document.body;
  const plus = document.createElement("span");
  plus.setAttribute("aria-hidden", "true");
  plus.textContent = "+1";
  Object.assign(plus.style, {
    position: "fixed",
    left: "0px",
    top: "0px",
    zIndex: "2147483000",
    pointerEvents: "none",
    font: "700 15px/1 var(--font-q-sans), sans-serif",
    color: "#fff",
    background: "#2e7a58",
    padding: "4px 8px",
    borderRadius: "999px",
  } satisfies Partial<CSSStyleDeclaration>);
  host.appendChild(plus);
  const o = plus.getBoundingClientRect();
  const x = r.left - o.width - 8 - o.left;
  const y = r.top + r.height / 2 - o.height / 2 - o.top;
  plus
    .animate(
      [
        { transform: `translate(${x}px, ${y}px) scale(0.6)`, opacity: 0 },
        { transform: `translate(${x}px, ${y - 4}px) scale(1.05)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${x}px, ${y - 16}px) scale(1)`, opacity: 0 },
      ],
      { duration: 900, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    )
    .finished.finally(() => plus.remove());
}
