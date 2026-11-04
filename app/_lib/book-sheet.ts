"use client";

// Book page as a slide-up sheet over any screen, kept in the URL as ?book=<id>
// (e.g. /box?book=the-dot). Because it's in the URL: refresh keeps the screen AND the sheet,
// the link can be shared, and Back closes it. Plain /books/<id> links (search engines, old links)
// still open the full page; inside the app they're caught and opened as the sheet
// (app/_components/BookSheetHost.tsx).
//
// Also: the "book flies into the sheet" morph, and preloading so the sheet opens instantly.

import { getImageProps } from "next/image";

export const BOOK_PARAM = "book";

/* ------------------------------ Open / close ------------------------------ */

/** How many sheet entries we pushed onto history in this visit (so × can go back over them). */
let depth = 0;

/** Where the clicked book was, so it can fly into the sheet once it's open. */
let pendingMorph: { id: string; rect: DOMRect; source: HTMLElement } | null = null;

/** Remember the clicked book's spot (also used by the listing's own sheet). */
export function rememberMorph(id: string, from?: Element | null) {
  const source = findSourceCover(from);
  pendingMorph = source ? { id, rect: source.getBoundingClientRect(), source } : null;
}

export function openBook(id: string, from?: Element | null) {
  const url = new URL(window.location.href);
  if (url.searchParams.get(BOOK_PARAM) === id) return;
  rememberMorph(id, from);
  url.searchParams.set(BOOK_PARAM, id);
  // Next syncs useSearchParams with the History API: no server round trip, the page stays put.
  window.history.pushState(null, "", url);
  depth++;
}

/** Close the sheet: back over the entries we pushed, or (opened from a shared link / refresh) drop the param. */
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

/** Browser Back/Forward moved through sheet entries. */
export function onSheetHistory(hasBook: boolean) {
  depth = hasBook ? Math.max(0, depth - 1) : 0;
}

/** /books/<id> → id (only plain book links). */
export function bookIdFromHref(href: string | null): string | null {
  const m = href?.match(/^\/books\/([^/?#]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
}

/* -------------------------------- Preload -------------------------------- */

// The 3D cover's `sizes` on the book page (BookCover3D): preload exactly that file.
const PAGE_COVER_SIZES = "(min-width: 1024px) 600px, 420px";
const preloaded = new Set<string>();

/** Fetch and decode the book page's cover ahead of the click. */
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

type ContentModule = typeof import("../_components/BookSheetContent");
let chunk: Promise<ContentModule> | null = null;
let loaded: ContentModule["default"] | null = null;
/** Load the sheet's code (it isn't in every page's bundle). Idle time, hover, focus and touch call this. */
export function preloadSheet() {
  chunk ??= import("../_components/BookSheetContent").then((m) => {
    loaded = m.default;
    return m;
  });
  return chunk;
}
/** The sheet's content component once loaded: rendered directly, so opening never waits. */
export const loadedSheetContent = () => loaded;

/* ------------------------- Book flies into the sheet ------------------------ */

function findSourceCover(from?: Element | null): HTMLElement | null {
  if (!from) return null;
  const own = from.closest<HTMLElement>("[data-book-cover]");
  if (own) return own;
  const card = from.closest("article, li, [data-book]") ?? from;
  return card.querySelector<HTMLElement>("[data-book-cover], [data-book3d], img");
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Called once the sheet's cover is in the page. The sheet's own 3D book flies from where the
 * clicked book was into its place, following the sheet as it slides up.
 *
 * The sheet clips its content while it slides, so the flying book is an exact copy of the
 * sheet's 3D book (same markup, tilt and images) in the browser's top layer, above the sheet.
 * On landing it sits exactly on the real one, which is shown in the same frame: no swap to see.
 */
export function playMorph(id: string, target: HTMLElement | null) {
  const m = pendingMorph;
  pendingMorph = null;
  if (!m || m.id !== id || !target || !target.isConnected) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const book = target.firstElementChild as HTMLElement | null; // the tilted 3D book inside the cover slot
  if (!book) return;

  // The real book stays hidden until the copy lands on it (set now, before the first paint).
  target.style.opacity = "0";
  m.source.style.visibility = "hidden";
  const restore = () => {
    target.style.opacity = "";
    m.source.style.visibility = "";
  };

  // The sheet may open in this same commit, after this runs: wait (a few frames at most) until
  // the cover slot has a size, then fly.
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
  // Unscaled size of the cover slot (it's scaled per breakpoint with CSS).
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
  flyEl.showPopover?.(); // top layer, above the open sheet

  const from = m.rect;
  const fromCx = from.left + from.width / 2;
  const fromCy = from.top + from.height / 2;
  const DURATION = 620;
  const start = performance.now();

  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / DURATION);
    const p = easeInOut(t);
    const nat = target.getBoundingClientRect(); // where the book will sit (the sheet is still moving)
    const s = nat.width / W; // the slot's own CSS scale
    const k0 = from.height / nat.height; // start at the clicked book's size
    const scale = s * (k0 + (1 - k0) * p);
    const cx = fromCx + (nat.left + nat.width / 2 - fromCx) * p;
    const cy = fromCy + (nat.top + nat.height / 2 - fromCy) * p + Math.sin(Math.PI * p) * -50;
    const x = cx - (W * scale) / 2;
    const y = cy - (H * scale) / 2;
    flyEl.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    flyEl.style.visibility = "visible";
    if (t < 1) requestAnimationFrame(frame);
    else {
      // Land: the real book appears exactly where the copy is, in the same frame.
      restore();
      flyEl.remove();
    }
  };
  frame(start);
}
