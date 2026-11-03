"use client";

// Scroll area for the hero chat thread (HeroAsk), with our own scrollbar.
// The native bar is hidden (it sat flush on the card edge and ran into the rounded
// corners); this draws one in the design language instead:
// - a slim black pill, inset 8px from the card's right edge and 12px from top/bottom;
// - it widens and turns amber on hover / while dragging; you can drag it;
// - it shows while scrolling or while the pointer is over the thread, then fades away;
// - soft fades at the top / bottom edge of the thread when there is more to scroll.
// Only appears when the thread actually overflows. Wheel, touch and keyboard
// scrolling are untouched (they act on the thread itself).
// `followKey`: whenever it changes, the thread scrolls to the newest message.

import { useEffect, useRef, useState } from "react";

const INSET = 12; // px of rail kept clear at the top and bottom
const MIN_THUMB = 36;
const FADE = 28; // px of the top/bottom edge fades

type Geo = { top: number; height: number; scrollable: boolean; atTop: boolean; atBottom: boolean };

export function ChatScrollArea({
  className = "",
  followKey,

  children,
}: {
  className?: string;
  followKey: string | number;

  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geo>({ top: 0, height: 0, scrollable: false, atTop: true, atBottom: true });
  const [awake, setAwake] = useState(false); // shown while scrolling / hovering
  const [dragging, setDragging] = useState(false);
  const sleepTimer = useRef(0);
  const drag = useRef<{ y: number; scrollTop: number } | null>(null);

  const measure = () => {
    const el = ref.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const max = scrollHeight - clientHeight;
    const rail = clientHeight - INSET * 2;
    const height = Math.max(MIN_THUMB, (clientHeight / scrollHeight) * rail);
    setGeo({
      scrollable: max > 1,
      height,
      top: INSET + (max > 0 ? (scrollTop / max) * (rail - height) : 0),
      atTop: scrollTop <= 1,
      atBottom: scrollTop >= max - 1,
    });
  };
  const measureRef = useRef(measure);
  useEffect(() => {
    measureRef.current = measure;
  });

  const sleepSoon = () => {
    window.clearTimeout(sleepTimer.current);
    sleepTimer.current = window.setTimeout(() => setAwake(false), 1000);
  };
  const wake = () => {
    window.clearTimeout(sleepTimer.current);
    setAwake(true);
  };

  // Re-measure when the thread or its content changes size (answers type out, picks are
  // dealt in). The observers' first callbacks also do the initial measure.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const run = () => measureRef.current();
    const ro = new ResizeObserver(run);
    ro.observe(el);
    const mo = new MutationObserver(run);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
      window.clearTimeout(sleepTimer.current);
    };
  }, []);

  // Keep the newest message in view.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [followKey]);

  const onThumbDown = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, scrollTop: el.scrollTop };
    setDragging(true);
  };
  const onThumbMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || !drag.current) return;
    const rail = el.clientHeight - INSET * 2 - geo.height;
    const ratio = (el.scrollHeight - el.clientHeight) / Math.max(1, rail);
    el.scrollTop = drag.current.scrollTop + (e.clientY - drag.current.y) * ratio;
  };
  const onThumbUp = () => {
    drag.current = null;
    setDragging(false);
    sleepSoon();
  };

  // Edge fades only on a side that has more content past it.
  const mask = geo.scrollable
    ? `linear-gradient(to bottom, ${geo.atTop ? "#000" : "transparent"} 0, #000 ${FADE}px, #000 calc(100% - ${FADE}px), ${geo.atBottom ? "#000" : "transparent"} 100%)`
    : undefined;
  const shown = awake || dragging;

  return (
    <div className="relative">
      <div
        ref={ref}
        data-lenis-prevent
        onScroll={() => {
          measure();
          wake();
          sleepSoon();
        }}
        onPointerEnter={wake}
        onPointerLeave={sleepSoon}
        className={`no-scrollbar overflow-y-auto overscroll-contain ${className}`}
        // scrollbarWidth inline: outranks the page-wide `* { scrollbar-width: thin }` in globals.css (unlayered, so no class can beat it).
        // .no-scrollbar (globals.css) also hides it in older Safari via ::-webkit-scrollbar.
        style={{ maskImage: mask, WebkitMaskImage: mask, scrollbarWidth: "none" }}
      >
        {children}
      </div>

      {geo.scrollable && (
        // Decorative for assistive tech: the thread itself scrolls with wheel, touch and keys.
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-2 w-3">
          <div
            onPointerDown={onThumbDown}
            onPointerMove={onThumbMove}
            onPointerUp={onThumbUp}
            onPointerCancel={onThumbUp}
            onPointerEnter={wake}
            onPointerLeave={() => !dragging && sleepSoon()}
            className={`group pointer-events-auto absolute inset-x-0 flex cursor-grab touch-none justify-center transition-opacity duration-300 active:cursor-grabbing ${
              shown ? "opacity-100" : "opacity-0"
            }`}
            style={{ top: geo.top, height: geo.height }}
          >
            <span
              className={`h-full rounded-full transition-[width,background-color] duration-200 ${
                dragging ? "w-2 bg-[#f9a220]" : "w-1 bg-black/25 group-hover:w-2 group-hover:bg-[#f9a220]"
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
