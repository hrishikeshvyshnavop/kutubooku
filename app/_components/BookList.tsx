"use client";

import { useEffect, useRef } from "react";
import { BookCard } from "../curation/BookCard";
import { MOCK_BOOKS } from "../_data/curation-mock";
import { Button } from "./Button";
import { SectionTitle } from "./SectionTitle";
import { pageScroll } from "./SmoothScroll";
import { useAddToBox } from "./useAddToBox";

const SHOWN = 10;
const CARD_WIDTH = "w-[min(78vw,max(260px,min(40svh,360px)))]";
const AXIS_LOCK_PX = 8;
const LINE_PX = 32;

const RESTING = [
  { y: 24, r: -1.5 },
  { y: 0, r: 1 },
  { y: 10, r: -0.5 },
  { y: 44, r: 2 },
  { y: -6, r: -2 },
  { y: 30, r: 1.25 },
];

export function BookList() {
  const books = MOCK_BOOKS.slice(0, SHOWN);
  const { cardProps, toastEl } = useAddToBox();
  const { sectionRef, pinRef, rowRef } = useScrollDrivenRow();

  return (
    <section
      ref={sectionRef}
      aria-labelledby="home-books-title"
      data-covers-hero
      className="relative z-10 rounded-t-[32px] bg-[#fffdf8] shadow-[0_-24px_60px_-28px_rgba(29,40,56,0.45)] sm:rounded-t-[48px] lg:rounded-t-[64px]"
    >
      <div ref={pinRef} className="sticky top-0 flex h-svh min-h-[560px] flex-col justify-center overflow-clip overscroll-x-none">
        <ul ref={rowRef} aria-label="Featured books" className="flex w-max items-center gap-5 px-page py-10 will-change-transform sm:gap-7">
          <li className={`${CARD_WIDTH} shrink-0 pr-2 sm:w-[min(440px,42vw)]`}>
            <Intro />
          </li>

          {books.map((b, i) => {
            const rest = RESTING[i % RESTING.length];
            return (
              <li
                key={b.id}
                className={`${CARD_WIDTH} shrink-0 [perspective:1400px]`}
                style={{ transform: `translateY(${rest.y}px) rotate(${rest.r}deg)` }}
              >
                <BookCard book={b} index={i} titleAs="h3" href={`/books/${b.id}`} box={cardProps(b.id)} />
              </li>
            );
          })}
        </ul>
      </div>

      {toastEl}
    </section>
  );
}

function Intro() {
  return (
    <>
      <SectionTitle id="home-books-title" eyebrow="From our shelf">
        Books kids keep coming back to
      </SectionTitle>
      <p className="mt-4 type-body-lg text-[#1d2838]/70">A few favourites to start with. Tap any book to see what&apos;s inside.</p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button href="/reading-preferences" variant="primary" arrow="right">
          Find books for my child
        </Button>
        <Button href="/books" variant="secondary">
          See all books
        </Button>
      </div>
    </>
  );
}

function useScrollDrivenRow() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    const row = rowRef.current;
    if (!section || !pin || !row) return;

    let travel = 0;
    let raf = 0;
    let near = false;
    let touch: { x: number; y: number; axis: "x" | "y" | null } | null = null;

    const sectionTop = () => section.getBoundingClientRect().top + window.scrollY;
    const clamp = (x: number) => Math.min(travel, Math.max(0, x));

    const update = () => {
      row.style.transform = `translate3d(${-clamp(-section.getBoundingClientRect().top)}px,0,0)`;
    };

    const measure = () => {
      travel = Math.max(0, row.scrollWidth - pin.clientWidth);
      section.style.height = `${pin.offsetHeight + travel}px`;
      update();
    };

    const pinned = () => {
      const r = section.getBoundingClientRect();
      return travel > 0 && r.top <= 1 && r.bottom >= window.innerHeight - 1;
    };

    const moveBy = (dx: number, immediate: boolean) => {
      const top = sectionTop();
      const now = clamp(pageScroll.target() - top);
      const next = clamp(now + dx);
      if (next !== now) pageScroll.to(top + next, immediate);
    };

    const onScroll = () => {
      if (!near) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target.matches(":focus-visible")) return;
      const li = target.closest("li");
      if (!li || !row.contains(li)) return;
      const want = clamp(li.offsetLeft - (pin.clientWidth - li.offsetWidth) / 2);
      window.scrollTo({ top: sectionTop() + want, behavior: "instant" });
    };

    const onWheel = (e: WheelEvent) => {
      const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
      if (Math.abs(dx) <= Math.abs(e.deltaY) && !e.shiftKey) return;
      if (!pinned()) return;
      e.preventDefault();
      moveBy(dx * (e.deltaMode === 1 ? LINE_PX : 1), false);
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touch = e.touches.length === 1 ? { x: t.clientX, y: t.clientY, axis: null } : null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touch) return;
      const t = e.touches[0];
      const dx = t.clientX - touch.x;
      const dy = t.clientY - touch.y;
      if (!touch.axis) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_LOCK_PX) return;
        touch.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (touch.axis !== "x") return;
      e.preventDefault();
      moveBy(-dx, true);
      touch.x = t.clientX;
      touch.y = t.clientY;
    };

    const onTouchEnd = () => {
      touch = null;
    };

    const nearIo = new IntersectionObserver(
      ([e]) => {
        near = e.isIntersecting;
        if (near) update();
      },
      { rootMargin: "50% 0px" },
    );
    const ro = new ResizeObserver(measure);

    nearIo.observe(section);
    ro.observe(pin);
    ro.observe(row);
    measure();

    const listeners: [EventTarget, string, EventListener, AddEventListenerOptions?][] = [
      [window, "scroll", onScroll as EventListener, { passive: true }],
      [row, "focusin", onFocusIn as EventListener],
      [pin, "wheel", onWheel as EventListener, { passive: false }],
      [pin, "touchstart", onTouchStart as EventListener, { passive: true }],
      [pin, "touchmove", onTouchMove as EventListener, { passive: false }],
      [pin, "touchend", onTouchEnd],
      [pin, "touchcancel", onTouchEnd],
    ];
    listeners.forEach(([target, type, fn, opts]) => target.addEventListener(type, fn, opts));

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      nearIo.disconnect();
      listeners.forEach(([target, type, fn]) => target.removeEventListener(type, fn));
    };
  }, []);

  return { sectionRef, pinRef, rowRef };
}
