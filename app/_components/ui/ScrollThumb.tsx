"use client";

import { useEffect, useRef, useState } from "react";

const MIN_THUMB = 40;
const EDGE = 10;
const IDLE_MS = 1200;

type Geo = { top: number; height: number; scrollable: boolean };
type Scroller = React.RefObject<HTMLElement | null> | "page";

function resolve(scroller: Scroller) {
  return scroller === "page" ? document.documentElement : scroller.current;
}

export function ScrollThumb({ scroller, className = "" }: { scroller: Scroller; className?: string }) {
  const [geo, setGeo] = useState<Geo>({ top: 0, height: 0, scrollable: false });
  const [awake, setAwake] = useState(false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ y: number; scrollTop: number } | null>(null);
  const travel = useRef(0);
  const timer = useRef(0);

  const sleepSoon = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAwake(false), IDLE_MS);
  };
  const wake = () => {
    window.clearTimeout(timer.current);
    setAwake(true);
  };

  useEffect(() => {
    const el = resolve(scroller);
    if (!el) return;
    const page = scroller === "page";
    const events: EventTarget = page ? window : el;

    const measure = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const max = scrollHeight - clientHeight;
      const start = (parseFloat(getComputedStyle(el).borderTopRightRadius) || 0) + EDGE;
      const rail = clientHeight - start - EDGE;
      const height = Math.max(MIN_THUMB, (clientHeight / scrollHeight) * rail);
      travel.current = rail - height;
      setGeo({ scrollable: max > 1, height, top: start + (max > 0 ? (scrollTop / max) * travel.current : 0) });
    };

    const onScroll = () => {
      measure();
      window.clearTimeout(timer.current);
      setAwake(true);
      timer.current = window.setTimeout(() => setAwake(false), IDLE_MS);
    };

    const ro = new ResizeObserver(measure);
    ro.observe(page ? document.body : el);
    const content = page ? document.body.firstElementChild : el.firstElementChild;
    if (content) ro.observe(content);
    events.addEventListener("scroll", onScroll, { passive: true });
    if (page) window.addEventListener("resize", measure);
    const raf = requestAnimationFrame(measure);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      events.removeEventListener("scroll", onScroll);
      if (page) window.removeEventListener("resize", measure);
      window.clearTimeout(timer.current);
    };
  }, [scroller]);

  const onDown = (e: React.PointerEvent) => {
    const el = resolve(scroller);
    if (!el) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, scrollTop: el.scrollTop };
    setDragging(true);
  };
  const onMove = (e: React.PointerEvent) => {
    const el = resolve(scroller);
    if (!el || !drag.current) return;
    const ratio = (el.scrollHeight - el.clientHeight) / Math.max(1, travel.current);
    el.scrollTo({ top: drag.current.scrollTop + (e.clientY - drag.current.y) * ratio, behavior: "instant" });
  };
  const onUp = () => {
    drag.current = null;
    setDragging(false);
    sleepSoon();
  };

  if (!geo.scrollable) return null;

  return (
    <div aria-hidden className={`pointer-events-none w-3 ${className}`}>
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerEnter={wake}
        onPointerLeave={() => !dragging && sleepSoon()}
        className={`group pointer-events-auto absolute inset-x-0 flex cursor-grab touch-none justify-center transition-opacity duration-300 active:cursor-grabbing motion-reduce:transition-none ${
          awake || dragging ? "opacity-100" : "opacity-0"
        }`}
        style={{ top: geo.top, height: geo.height }}
      >
        <span
          className={`h-full rounded-full transition-[width,background-color] duration-200 ${
            dragging ? "w-2 bg-[#f9a220]" : "w-1.5 bg-[#1d2838]/35 group-hover:w-2 group-hover:bg-[#f9a220]"
          }`}
        />
      </div>
    </div>
  );
}
