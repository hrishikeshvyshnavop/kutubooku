"use client";

import { getImageProps } from "next/image";

export const BOOK_PARAM = "book";

let depth = 0;

let pendingMorph: { id: string; rect: DOMRect; source: HTMLElement } | null = null;

export function rememberMorph(id: string, from?: Element | null) {
  const source = findSourceCover(from);
  pendingMorph = source ? { id, rect: source.getBoundingClientRect(), source } : null;
}

export function openBook(id: string, from?: Element | null) {
  const url = new URL(window.location.href);
  if (url.searchParams.get(BOOK_PARAM) === id) return;
  rememberMorph(id, from);
  url.searchParams.set(BOOK_PARAM, id);
  window.history.pushState(null, "", url);
  depth++;
}

export function closeBook() {
  if (depth > 0) {
    const n = depth;
    depth = 0;
    window.history.go(-n);
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.delete(BOOK_PARAM);
  window.history.replaceState(null, "", url);
}

export function onSheetHistory(hasBook: boolean) {
  depth = hasBook ? Math.max(0, depth - 1) : 0;
}

export function bookIdFromHref(href: string | null): string | null {
  const m = href?.match(/^\/books\/([^/?#]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
}

const PAGE_COVER_SIZES = "(min-width: 1024px) 600px, 420px";
const preloaded = new Set<string>();

export function preloadCover(src: string) {
  if (preloaded.has(src)) return;
  preloaded.add(src);
  const { props } = getImageProps({ src, alt: "", fill: true, sizes: PAGE_COVER_SIZES });
  const img = new window.Image();
  img.sizes = props.sizes ?? "";
  if (props.srcSet) img.srcset = props.srcSet;
  img.src = props.src;
  img.decode?.().catch(() => {});
}

type ContentModule = typeof import("../_components/book/BookSheetContent");
let chunk: Promise<ContentModule> | null = null;
let loaded: ContentModule["default"] | null = null;
export function preloadSheet() {
  chunk ??= import("../_components/book/BookSheetContent").then((m) => {
    loaded = m.default;
    return m;
  });
  return chunk;
}
export const loadedSheetContent = () => loaded;

function findSourceCover(from?: Element | null): HTMLElement | null {
  if (!from) return null;
  const own = from.closest<HTMLElement>("[data-book-cover]");
  if (own) return own;
  const card = from.closest("article, li, [data-book]") ?? from;
  return card.querySelector<HTMLElement>("[data-book-cover], [data-book3d], img");
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function playMorph(id: string, target: HTMLElement | null) {
  const m = pendingMorph;
  pendingMorph = null;
  if (!m || m.id !== id || !target || !target.isConnected) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const book = target.firstElementChild as HTMLElement | null;
  if (!book) return;

  target.style.opacity = "0";
  m.source.style.visibility = "hidden";
  const restore = () => {
    target.style.opacity = "";
    m.source.style.visibility = "";
  };

  let tries = 0;
  const begin = () => {
    if (!target.isConnected) return restore();
    if (!target.offsetWidth && tries++ < 10) return void requestAnimationFrame(begin);
    if (!target.offsetWidth) return restore();
    fly(target, book, m, restore);
  };
  begin();
}

function fly(target: HTMLElement, book: HTMLElement, m: NonNullable<typeof pendingMorph>, restore: () => void) {
  const W = target.offsetWidth;
  const H = target.offsetHeight;

  const flyEl = document.createElement("div");
  flyEl.setAttribute("aria-hidden", "true");
  flyEl.setAttribute("popover", "manual");
  Object.assign(flyEl.style, {
    position: "fixed",
    inset: "auto",
    left: "0px",
    top: "0px",
    margin: "0",
    padding: "0",
    border: "0",
    background: "transparent",
    overflow: "visible",
    width: `${W}px`,
    height: `${H}px`,
    pointerEvents: "none",
    transformOrigin: "0 0",
    transformStyle: "preserve-3d",
    perspective: "1700px",
    willChange: "transform",
    visibility: "hidden",
  } satisfies Partial<CSSStyleDeclaration>);
  const copy = book.cloneNode(true) as HTMLElement;
  copy.style.setProperty("--mx", "0");
  copy.style.setProperty("--my", "0");
  copy.style.transition = "none";
  flyEl.appendChild(copy);
  document.body.appendChild(flyEl);
  flyEl.showPopover?.();

  const from = m.rect;
  const fromCx = from.left + from.width / 2;
  const fromCy = from.top + from.height / 2;
  const DURATION = 620;
  const start = performance.now();

  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / DURATION);
    const p = easeInOut(t);
    const nat = target.getBoundingClientRect();
    const s = nat.width / W;
    const k0 = from.height / nat.height;
    const scale = s * (k0 + (1 - k0) * p);
    const cx = fromCx + (nat.left + nat.width / 2 - fromCx) * p;
    const cy = fromCy + (nat.top + nat.height / 2 - fromCy) * p + Math.sin(Math.PI * p) * -50;
    const x = cx - (W * scale) / 2;
    const y = cy - (H * scale) / 2;
    flyEl.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    flyEl.style.visibility = "visible";
    if (t < 1) requestAnimationFrame(frame);
    else {
      restore();
      flyEl.remove();
    }
  };
  frame(start);
}
