"use client";

// Home hero: a slow, seamless carousel of real 3D books (CSS 3D, no WebGL).
// Composition modelled on ramp.design's hero (large objects drifting through a
// middle band, ~3 in view, edges cropped) — built with KutuBooku's own covers.
//
// Layers:  scene (one shared perspective + pointer parallax)
//            → track (marquee: translateX 0 → -50%, items duplicated for a seamless loop)
//              → item (fixed slot) → book (slow float) → 6 faces
// Interactions: slow auto-drift left; drag/swipe with momentum; trackpad/shift-wheel;
// hover, hold and keyboard focus pause; arrow keys step books; click lifts the book and opens its page (/books/[id]).
// Reduced motion: no drift/float/parallax, but dragging, scrolling and clicking still work.
// Performance: the loop and the float animations pause while the hero is off screen,
// covered by the next section, or the tab is hidden.

import { useEffect, useRef, useState } from "react";
import { openBook, preloadCover, preloadSheet } from "../_lib/book-sheet";
import { MOCK_BOOKS, type MockBook } from "../_data/curation-mock";
import { BOOKS, Book3D } from "./Book3D";
import { HeroAsk } from "./HeroAsk";
import { HERO_GLOW } from "./hero-bg";

const H = 440; // book height (px) at full size; scaled per breakpoint below
// Image size hint matching how wide a cover really shows: H × cover ratio (up to ~1) × the row's
// scale at each breakpoint below (0.42 phones … 1.0 from 1800px). Without it, 3× phones fetched
// 1080px files for books shown ~185px wide.
const HERO_SIZES =
  "(min-width: 1800px) 440px, (min-width: 1536px) 405px, (min-width: 1280px) 352px, (min-width: 1024px) 317px, (min-width: 640px) 264px, 185px";
const GAP = 150; // space between books along the track

const INFO = new Map<string, MockBook>(MOCK_BOOKS.map((b) => [b.cover, b]));
// ms before opening the book sheet: long enough to see the book start to lift; the
// book then flies from the carousel into the sheet (app/_lib/book-sheet.ts).
const OPEN_DELAY = 120;

const AUTO_SPEED = -42; // px/s (unscaled): drift to the left (was -26, sped up 2026-11-03)
const DRAG_THRESHOLD = 6; // px moved before a press counts as a drag, not a click

export function BookHero() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null); // scaled row (parallax + scale)
  const trackRef = useRef<HTMLDivElement>(null); // translated track
  const [selKey, setSelKey] = useState<string | null>(null); // book (by cover) lifted in the centre
  const [askOpen, setAskOpen] = useState(false); // "Ask KutuBooku AI" chat open: carousel pauses and dims
  const openTimer = useRef<number | undefined>(undefined);
  const [focusKey, setFocusKey] = useState<string | null>(null); // book (by cover) with keyboard focus
  // Leaving the page (or Next hiding it to keep it for Back): drop the lifted book,
  // so the carousel is back to normal when you return.
  useEffect(
    () => () => {
      window.clearTimeout(openTimer.current);
      setSelKey(null);
    },
    [],
  );

  // Live motion state (refs: no re-render per frame)
  const m = useRef({ x: 0, v: AUTO_SPEED, hover: false, focus: false, dragging: false, moved: 0, lastX: 0, lastT: 0, target: null as number | null, reduced: false, modal: false });

  // The book sheet closed (the page stays put now, so the unmount reset above doesn't run):
  // put the lifted book down, un-dim the others, and let go of the focus the sheet hands back
  // to the clicked book (it would otherwise keep the drift paused).
  useEffect(() => {
    const reset = () => {
      window.clearTimeout(openTimer.current);
      setSelKey(null);
      setFocusKey(null);
      const a = document.activeElement as HTMLElement | null;
      if (a && sceneRef.current?.contains(a) && !a.matches(":focus-visible")) a.blur();
      m.current.focus = false;
    };
    window.addEventListener("kb:book-sheet-closed", reset);
    return () => window.removeEventListener("kb:book-sheet-closed", reset);
  }, []);

  useEffect(() => {
    m.current.modal = !!selKey || askOpen; // hold the drift while a book is lifted or the chat is open
  }, [selKey, askOpen]);

  useEffect(() => {
    const scene = sceneRef.current;
    const row = rowRef.current;
    const track = trackRef.current;
    if (!scene || !row || !track) return;
    const st = m.current;
    st.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // unscaled px per screen px (the row is CSS-scaled per breakpoint)
    const scale = () => row.getBoundingClientRect().width / row.offsetWidth || 1;
    // One full set (the track holds two). Cached: reading scrollWidth every frame forced a
    // style/layout pass per frame; it only changes on resize.
    let setWidth = track.scrollWidth / 2;
    const setW = () => setWidth;
    const wrap = (x: number) => {
      const w = setW();
      if (!w) return x;
      let r = x % w;
      if (r > 0) r -= w;
      return r;
    };

    let raf = 0;
    let prev = performance.now();
    let lastX = NaN; // last transform written, to skip no-op style writes while paused
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      if (!st.dragging) {
        if (st.target !== null) {
          // glide to a centred book: keep the target inside the loop and take the shortest way round
          const w = setW();
          let t = wrap(st.target);
          if (w) {
            if (t - st.x > w / 2) t -= w;
            if (st.x - t > w / 2) t += w;
          }
          st.target = t;
          st.x += (st.target - st.x) * Math.min(1, dt * 10);
          if (Math.abs(st.target - st.x) < 0.5) st.target = null;
          st.v = 0;
        } else {
          const paused = st.hover || st.focus || st.modal || st.reduced;
          const goal = paused ? 0 : AUTO_SPEED;
          st.v += (goal - st.v) * Math.min(1, dt * 1.8); // momentum eases back into the drift
          st.x += st.v * dt;
        }
      }
      st.x = wrap(st.x);
      if (st.x !== lastX) {
        track.style.transform = `translate3d(${st.x}px,0,0)`;
        lastX = st.x;
      }
      raf = requestAnimationFrame(tick);
    };

    // Run the drift loop and the CSS float only while the hero can be seen. It stays
    // sticky under the section that slides over it (marked data-covers-hero), so
    // "on screen" alone isn't enough: also stop once that section reaches the top.
    let onScreen = true;
    let covered = false;
    let running = true;
    // Float animations: only books actually in view float, and none while the hero is
    // covered or the tab hidden (30 3D books floating off screen cost frames for nothing).
    const visibleBooks = new Set<Element>();
    const floatState = (el: Element) => {
      const book = el.querySelector<HTMLElement>("[data-book3d]");
      if (book) book.style.animationPlayState = running && visibleBooks.has(el) ? "running" : "paused";
    };
    const items = [...track.children];
    const bookSeen = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visibleBooks.add(e.target);
        else visibleBooks.delete(e.target);
        floatState(e.target);
      }
    });
    items.forEach((el) => bookSeen.observe(el));
    const sizeObs = new ResizeObserver(() => (setWidth = track.scrollWidth / 2));
    sizeObs.observe(track);
    const setRunning = () => {
      const run = onScreen && !covered && !document.hidden;
      running = run;
      items.forEach(floatState);
      if (run && !raf) {
        prev = performance.now();
        raf = requestAnimationFrame(tick);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const seen = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      setRunning();
    });
    seen.observe(scene);
    const cover = document.querySelector("[data-covers-hero]");
    // root shrunk to a thin strip at the top of the viewport: intersecting = covering the hero
    const covering = new IntersectionObserver(
      ([e]) => {
        covered = e.isIntersecting;
        setRunning();
      },
      { rootMargin: "0px 0px -98% 0px" },
    );
    if (cover) covering.observe(cover);
    document.addEventListener("visibilitychange", setRunning);
    setRunning();

    // pointer parallax (mouse only)
    // Coalesced to one update per frame (fast mice send up to 1000 events a second, and each
    // --mx/--my change restyles all 30 books), and frozen while dragging: the tilt swings the
    // 3D row against the drag direction (with its 700ms ease), which made books shake back
    // and forth under the cursor.
    let parallaxRaf = 0;
    let px = 0;
    let py = 0;
    const onMoveParallax = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || st.reduced || st.dragging) return;
      px = e.clientX;
      py = e.clientY;
      if (parallaxRaf) return;
      parallaxRaf = requestAnimationFrame(() => {
        parallaxRaf = 0;
        if (st.dragging) return;
        const r = scene.getBoundingClientRect();
        scene.style.setProperty("--mx", (((px - r.left) / r.width) * 2 - 1).toFixed(3));
        scene.style.setProperty("--my", (((py - r.top) / r.height) * 2 - 1).toFixed(3));
      });
    };

    // drag / swipe with momentum
    let dragScale = 1; // row scale, measured once per drag (not on every move: that forced a layout per event)
    let grabbed: HTMLElement | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      st.dragging = true;
      dragScale = scale();
      // Keep the grabbed book lifted for the whole drag: once the scene captures the pointer,
      // the book loses :hover and its hover lift used to spring back down mid-drag.
      grabbed = (e.target as HTMLElement).closest<HTMLElement>("button[data-book]");
      grabbed?.setAttribute("data-grabbed", "");
      st.moved = 0;
      st.lastX = e.clientX;
      st.lastT = performance.now();
      st.target = null;
      st.v = 0;
    };
    const onMove = (e: PointerEvent) => {
      if (!st.dragging) return;
      const now = performance.now();
      const dx = e.clientX - st.lastX;
      const k = dragScale;
      st.moved += Math.abs(dx);
      // capture only once it is a real drag, so a plain click still reaches the book
      if (st.moved > DRAG_THRESHOLD && !scene.hasPointerCapture(e.pointerId)) scene.setPointerCapture(e.pointerId);
      st.x += dx / k;
      const dts = Math.max(1, now - st.lastT) / 1000;
      st.v = st.v * 0.6 + ((dx / k) / dts) * 0.4; // smoothed velocity for the throw
      st.lastX = e.clientX;
      st.lastT = now;
    };
    const onUp = (e: PointerEvent) => {
      if (!st.dragging) return;
      st.dragging = false;
      grabbed?.removeAttribute("data-grabbed");
      grabbed = null;
      st.v = Math.max(-2400, Math.min(2400, st.v)); // throw, then eases back to the drift
      if (scene.hasPointerCapture(e.pointerId)) scene.releasePointerCapture(e.pointerId);
    };
    // a real drag must not also click a book
    const onClickCapture = (e: MouseEvent) => {
      if (st.moved > DRAG_THRESHOLD) {
        e.preventDefault();
        e.stopPropagation();
      }
      st.moved = 0;
    };
    // trackpad / wheel: horizontal intent scrolls the row
    const onWheel = (e: WheelEvent) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!dx) return;
      e.preventDefault();
      st.target = null;
      st.x -= dx / scale();
      st.v = 0;
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") st.hover = true;
    };
    const onLeave = () => {
      st.hover = false;
      scene.style.setProperty("--mx", "0");
      scene.style.setProperty("--my", "0");
    };

    window.addEventListener("pointermove", onMoveParallax);
    scene.addEventListener("pointerdown", onDown);
    scene.addEventListener("pointermove", onMove);
    scene.addEventListener("pointerup", onUp);
    scene.addEventListener("pointercancel", onUp);
    scene.addEventListener("click", onClickCapture, true);
    scene.addEventListener("wheel", onWheel, { passive: false });
    scene.addEventListener("pointerenter", onEnter);
    scene.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(parallaxRaf);
      seen.disconnect();
      covering.disconnect();
      bookSeen.disconnect();
      sizeObs.disconnect();
      document.removeEventListener("visibilitychange", setRunning);
      window.removeEventListener("pointermove", onMoveParallax);
      scene.removeEventListener("pointerdown", onDown);
      scene.removeEventListener("pointermove", onMove);
      scene.removeEventListener("pointerup", onUp);
      scene.removeEventListener("pointercancel", onUp);
      scene.removeEventListener("click", onClickCapture, true);
      scene.removeEventListener("wheel", onWheel);
      scene.removeEventListener("pointerenter", onEnter);
      scene.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // centre a book (on click or keyboard focus); arrows step through books
  const centerBook = (el: HTMLElement) => {
    const scene = sceneRef.current;
    const row = rowRef.current;
    if (!scene || !row) return;
    const k = row.getBoundingClientRect().width / row.offsetWidth || 1;
    const item = el.parentElement as HTMLElement;
    const center = item.offsetLeft + item.offsetWidth / 2;
    m.current.target = -(center - scene.clientWidth / 2 / k);
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const btns = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-book]:not([tabindex='-1'])")];
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    btns[(i + (e.key === "ArrowRight" ? 1 : -1) + btns.length) % btns.length]?.focus();
  };

  // Track = books twice, so the loop is seamless.
  const track = [...BOOKS, ...BOOKS];

  return (
    <section
      aria-labelledby="hero-title"
      // Exactly one screen tall below the header (80px tall, 88px from xl where the pill nav
      // shows), at every size: no max cap (it left a gap on 1080p+ screens) and phones too.
      // min-h keeps short windows usable.
      className="relative flex h-[calc(100dvh-80px)] min-h-[560px] w-full flex-col overflow-hidden sm:min-h-[620px] xl:h-[calc(100dvh-88px)]"
    >
      <div aria-hidden className={HERO_GLOW} />

      {/* Carousel band: drag/swipe, trackpad, keyboard, hover-pause, click to open */}
      <div
        ref={sceneRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured books. Drag, swipe or use the arrow keys; select a book to see more."
        onKeyDown={onKeyDown}
        onFocus={() => (m.current.focus = true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) m.current.focus = false;
        }}
        inert={askOpen || undefined}
        className={`relative flex min-h-[420px] flex-1 touch-pan-y select-none items-center transition-[opacity,filter] duration-500 ${askOpen ? "opacity-35 blur-[3px]" : ""} [perspective:1700px] [perspective-origin:50%_45%] data-[paused]:**:[animation-play-state:paused]`}
        style={{ "--mx": 0, "--my": 0 } as React.CSSProperties}
      >
        <div
          ref={rowRef}
          // Scale the whole row (books + gaps together) so ~3 books are in view at every width.
          className="flex w-max origin-left items-center scale-[0.42] [transform-style:preserve-3d] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:scale-[0.6] lg:scale-[0.72] xl:scale-[0.8] 2xl:scale-[0.92] min-[1800px]:scale-100 [@media(max-height:820px)]:lg:scale-[0.62]"
          style={{ transform: "rotateY(calc(var(--mx) * 6deg)) rotateX(calc(var(--my) * -5deg))" }}
        >
          <div ref={trackRef} className="flex w-max items-center [transform-style:preserve-3d] will-change-transform">
            {track.map((b, i) => {
              const info = INFO.get(b.src);
              const clone = i >= BOOKS.length; // second copy: not focusable, hidden from screen readers
              return (
                <div
                  key={`${b.src}-${i}`}
                  className={`shrink-0 transition-opacity duration-500 [transform-style:preserve-3d] ${selKey && selKey !== b.src ? "opacity-30" : ""}`}
                  style={{ marginRight: GAP }}
                >
                  <button
                    type="button"
                    data-book
                    tabIndex={clone ? -1 : 0}
                    aria-hidden={clone || undefined}
                    aria-label={`${b.title}${info?.author ? ` by ${info.author}` : ""}. Open book page`}
                    onClick={(e) => {
                      centerBook(e.currentTarget);
                      setSelKey(b.src); // by cover, so whichever loop copy lands centre is the one lifted
                      window.clearTimeout(openTimer.current);
                      if (info) {
                        // Warm now too (touch has no hover), then open the book sheet; the book flies into it.
                        preloadSheet();
                        preloadCover(b.src);
                        const btn = e.currentTarget;
                        openTimer.current = window.setTimeout(() => openBook(info.id, btn), OPEN_DELAY);
                      }
                    }}
                    // Load the book page ahead of the click, so it opens straight away.
                    onPointerEnter={() => {
                      if (!info) return;
                      preloadSheet();
                      preloadCover(b.src);
                    }}
                    onFocus={(e) => {
                      if (info) {
                        preloadSheet();
                        preloadCover(b.src);
                      }
                      centerBook(e.currentTarget);
                      if (e.currentTarget.matches(":focus-visible")) setFocusKey(b.src); // keyboard only
                    }}
                    onBlur={() => setFocusKey((k) => (k === b.src ? null : k))}
                    draggable={false}
                    className="group/book relative block cursor-pointer rounded-[10px] [transform-style:preserve-3d] outline-none"
                  >
                    <span
                      className={`block transition-[translate,scale] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] [transform-style:preserve-3d] group-hover/book:-translate-y-4 group-data-[grabbed]/book:-translate-y-4 ${
                        selKey === b.src ? "-translate-y-6 scale-[1.12]" : focusKey === b.src ? "-translate-y-6 scale-[1.06]" : ""
                      }`}
                    >
                      {/* The clicked book flies from here into the book sheet's cover (app/_lib/book-sheet.ts). */}
                      <Book3D b={b} i={i % BOOKS.length} height={H} eager={i < 3} focused={focusKey === b.src && !selKey} sizes={HERO_SIZES} />
                    </span>
                    <span
                      aria-hidden
                      className={`pointer-events-none absolute left-1/2 top-full mt-14 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1d2838] px-7 py-3.5 text-[24px] font-semibold text-[#fffdf8] shadow-[0_16px_32px_-16px_rgba(29,40,56,0.6)] transition-[opacity,translate] duration-300 sm:block ${focusKey === b.src && !selKey ? "opacity-100" : "translate-y-2 opacity-0"}`}
                    >
                      {b.title} <span className="font-normal text-[#fffdf8]/70">· Press Enter</span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ask KutuBooku AI: prompt box along the bottom; its reply opens above it, over the carousel. */}
      <div className="relative z-20 flex-none px-4 pb-6 sm:px-6 sm:pb-10">
        <HeroAsk onOpenChange={setAskOpen} />
      </div>

      {/* No visible hero text (removed 2026-11-03). Hidden heading kept for screen readers and SEO. */}
      <h1 id="hero-title" className="sr-only">
        KutuBooku: books picked for your child
      </h1>

    </section>
  );
}
