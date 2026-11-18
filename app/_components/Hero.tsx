"use client";

import { useEffect, useRef, useState } from "react";
import { openBook, preloadCover, preloadSheet } from "../_lib/book-sheet";
import { MOCK_BOOKS, type MockBook } from "../_data/curation-mock";
import { BOOKS, Book3D } from "./Book3D";
import { AiChat } from "./AiChat";
import { HERO_GLOW } from "../_data/theme";

const H = 440;
const HERO_SIZES =
  "(min-width: 1800px) 440px, (min-width: 1536px) 405px, (min-width: 1280px) 352px, (min-width: 1024px) 317px, (min-width: 640px) 264px, 185px";
const GAP = 150;

const INFO = new Map<string, MockBook>(MOCK_BOOKS.map((b) => [b.cover, b]));
const OPEN_DELAY = 120;

const AUTO_SPEED = -42;
const DRAG_THRESHOLD = 6;

export function Hero() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [selKey, setSelKey] = useState<string | null>(null);
  const [askOpen, setAskOpen] = useState(false);
  const openTimer = useRef<number | undefined>(undefined);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  useEffect(
    () => () => {
      window.clearTimeout(openTimer.current);
      setSelKey(null);
    },
    [],
  );

  const m = useRef({ x: 0, v: AUTO_SPEED, hover: false, focus: false, dragging: false, moved: 0, lastX: 0, lastT: 0, target: null as number | null, reduced: false, modal: false });

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
    m.current.modal = !!selKey || askOpen;
  }, [selKey, askOpen]);

  useEffect(() => {
    const scene = sceneRef.current;
    const row = rowRef.current;
    const track = trackRef.current;
    if (!scene || !row || !track) return;
    const st = m.current;
    st.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scale = () => row.getBoundingClientRect().width / row.offsetWidth || 1;
    let setWidth = track.scrollWidth / 2;
    const setW = () => setWidth;
    const wrap = (x: number) => {
      const w = setW();
      if (!w) return x;
      let r = x % w;
      if (r > 0) r -= w;
      return r;
    };

    const mouse = { x: 0, y: 0, inside: false };
    let lastHit = 0;
    const hitTest = (now: number) => {
      if (!mouse.inside) {
        st.hover = false;
        return;
      }
      if (now - lastHit < 80) return;
      lastHit = now;
      const el = document.elementFromPoint(mouse.x, mouse.y);
      st.hover = !!el?.closest("button[data-book]") && scene.contains(el);
    };

    let raf = 0;
    let prev = performance.now();
    let lastX = NaN;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      hitTest(now);
      if (!st.dragging) {
        if (st.target !== null) {
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
          st.v += (goal - st.v) * Math.min(1, dt * 1.8);
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

    let onScreen = true;
    let covered = false;
    let running = true;
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
    const covering = new IntersectionObserver(
      ([e]) => {
        covered = e.isIntersecting;
        scene.style.contentVisibility = covered ? "hidden" : "";
        setRunning();
      },
      { rootMargin: "0px 0px -98% 0px" },
    );
    if (cover) covering.observe(cover);
    document.addEventListener("visibilitychange", setRunning);
    setRunning();

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

    let dragScale = 1;
    let grabbed: HTMLElement | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      st.dragging = true;
      dragScale = scale();
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
      if (st.moved > DRAG_THRESHOLD && !scene.hasPointerCapture(e.pointerId)) scene.setPointerCapture(e.pointerId);
      st.x += dx / k;
      const dts = Math.max(1, now - st.lastT) / 1000;
      st.v = st.v * 0.6 + ((dx / k) / dts) * 0.4;
      st.lastX = e.clientX;
      st.lastT = now;
    };
    const onUp = (e: PointerEvent) => {
      if (!st.dragging) return;
      st.dragging = false;
      grabbed?.removeAttribute("data-grabbed");
      grabbed = null;
      st.v = e.type === "pointercancel" ? 0 : Math.max(-2400, Math.min(2400, st.v));
      if (scene.hasPointerCapture(e.pointerId)) scene.releasePointerCapture(e.pointerId);
    };
    const onClickCapture = (e: MouseEvent) => {
      if (st.moved > DRAG_THRESHOLD) {
        e.preventDefault();
        e.stopPropagation();
      }
      st.moved = 0;
    };
    const onDragStart = (e: DragEvent) => e.preventDefault();
    const onWheel = (e: WheelEvent) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!dx) return;
      e.preventDefault();
      st.target = null;
      st.x -= dx / scale();
      st.v = 0;
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mouse.inside = true;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      lastHit = 0;
    };
    const onMouseTrack = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.inside = false;
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
    scene.addEventListener("dragstart", onDragStart);
    scene.addEventListener("wheel", onWheel, { passive: false });
    scene.addEventListener("pointerenter", onEnter);
    scene.addEventListener("pointermove", onMouseTrack);
    scene.addEventListener("pointerleave", onLeave);
    return () => {
      scene.removeEventListener("pointermove", onMouseTrack);
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
      scene.removeEventListener("dragstart", onDragStart);
      scene.removeEventListener("wheel", onWheel);
      scene.removeEventListener("pointerenter", onEnter);
      scene.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    let clear = 0;
    const onIntro = (e: Event) => {
      const from = (e as CustomEvent<{ x: number; y: number } | null>).detail;
      if (!from) return;
      const items = [...scene.querySelectorAll<HTMLElement>("[data-intro-item]")]
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.right > 0 && r.left < window.innerWidth);
      items.sort((a, b) => Math.abs(a.r.left + a.r.width / 2 - from.x) - Math.abs(b.r.left + b.r.width / 2 - from.x));
      items.forEach(({ el, r }, n) => {
        const k = r.width / (el.offsetWidth || r.width) || 1;
        el.style.setProperty("--ix", `${(from.x - (r.left + r.width / 2)) / k}px`);
        el.style.setProperty("--iy", `${(from.y - (r.top + r.height / 2)) / k}px`);
        el.style.setProperty("--d", `${n * 70}ms`);
        el.dataset.introOn = "";
      });
      clear = window.setTimeout(() => {
        items.forEach(({ el }) => {
          delete el.dataset.introOn;
          ["--ix", "--iy", "--d"].forEach((p) => el.style.removeProperty(p));
        });
      }, 900 + items.length * 70 + 100);
    };
    window.addEventListener("kb:intro-done", onIntro);
    return () => {
      window.removeEventListener("kb:intro-done", onIntro);
      window.clearTimeout(clear);
    };
  }, []);

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

  const track = [...BOOKS, ...BOOKS];

  return (
    <div className="sticky top-20 z-0 xl:top-[88px]">
      <section
        aria-labelledby="hero-title"
        className="relative flex h-[calc(100svh-80px)] min-h-[560px] w-full flex-col overflow-hidden sm:min-h-[620px] xl:h-[calc(100svh-88px)]"
      >
        <div aria-hidden className={HERO_GLOW} />

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
            className="flex w-max origin-left items-center scale-[0.42] [transform-style:preserve-3d] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:scale-[0.6] lg:scale-[0.72] xl:scale-[0.8] 2xl:scale-[0.92] min-[1800px]:scale-100 [@media(max-height:820px)]:lg:scale-[0.62]"
            style={{ transform: "rotateY(calc(var(--mx) * 6deg)) rotateX(calc(var(--my) * -5deg))" }}
          >
            <div ref={trackRef} className="flex w-max items-center [transform-style:preserve-3d] will-change-transform">
              {track.map((b, i) => {
                const info = INFO.get(b.src);
                const clone = i >= BOOKS.length;
                return (
                  <div
                    key={`${b.src}-${i}`}
                    data-intro-item
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
                        setSelKey(b.src);
                        window.clearTimeout(openTimer.current);
                        if (info) {
                          preloadSheet();
                          preloadCover(b.src);
                          const btn = e.currentTarget;
                          openTimer.current = window.setTimeout(() => openBook(info.id, btn), OPEN_DELAY);
                        }
                      }}
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
                        if (e.currentTarget.matches(":focus-visible")) setFocusKey(b.src);
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

        <AiChat onOpenChange={setAskOpen} />

        <h1 id="hero-title" className="sr-only">
          KutuBooku: books picked for your child
        </h1>

      </section>
    </div>
  );
}
