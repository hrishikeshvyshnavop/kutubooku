"use client";

// Home: book listing under the hero. Same tall colour cards as /curation
// (BookCard, without the curation-only controls). A card links to its book
// page, /books/[id].
//
// Horizontal scroll, driven by the page scroll: the section pins to the
// viewport and scrolling down moves the row sideways; once the last card is
// in view the page carries on. The title is the first panel of the row.
// Keyboard: focusing a card scrolls the page so that card is in view.
// Sideways trackpad swipes, Shift + wheel and sideways touch drags move the row as well.

import { useEffect, useRef } from "react";
import { BookCard } from "../curation/BookCard";
import { MOCK_BOOKS } from "../_data/curation-mock";
import { Button } from "./Button";
import { SectionTitle } from "./SectionTitle";
import { pageScroll } from "./SmoothScroll";
import { useCardBox } from "./useCardBox";

const SHOWN = 10;

/** Resting offset (px) and tilt (deg) per card, cycled. */
const RESTING = [
  { y: 24, r: -1.5 },
  { y: 0, r: 1 },
  { y: 10, r: -0.5 },
  { y: 44, r: 2 },
  { y: -6, r: -2 },
  { y: 30, r: 1.25 },
];

export function HomeBookList() {
  const books = MOCK_BOOKS.slice(0, SHOWN);
  // Each card's main button adds the book to the box (for the child in the header).
  const { cardProps, toastEl } = useCardBox();

  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLUListElement>(null);
  const travel = useRef(0); // px the row moves sideways in total

  useEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    const row = rowRef.current;
    if (!section || !pin || !row) return;

    const measure = () => {
      travel.current = Math.max(0, row.scrollWidth - pin.clientWidth);
      // vertical scroll distance = sideways travel (1:1 feels natural with a wheel)
      section.style.height = `${pin.offsetHeight + travel.current}px`;
      update();
    };
    const update = () => {
      const top = section.getBoundingClientRect().top;
      const x = Math.min(travel.current, Math.max(0, -top));
      row.style.transform = `translate3d(${-x}px,0,0)`;
    };
    let raf = 0;
    let near = false; // only track the scroll while the row's section is on or near the screen
    const onScroll = () => {
      if (!near) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    const nearIo = new IntersectionObserver(([e]) => {
      near = e.isIntersecting;
      if (near) update();
    }, { rootMargin: "50% 0px" });
    nearIo.observe(section);

    // Keyboard: bring the focused card into view by scrolling the page.
    // Keyboard only: a mouse/touch click on "Add to your box" also focuses the button, and
    // scrolling then made the row jump under the pointer.
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target.matches(":focus-visible")) return;
      const li = target.closest("li");
      if (!li || !row.contains(li)) return;
      const want = Math.min(travel.current, Math.max(0, li.offsetLeft - (pin.clientWidth - li.offsetWidth) / 2));
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: sectionTop + want, behavior: "instant" });
    };

    // Sideways gestures move the row too (people try to swipe a sideways row sideways).
    // The page scroll stays the one source of truth: a sideways gesture scrolls the page by
    // the same amount, kept within this section so it never runs on past the row.
    const moveBy = (dx: number, immediate: boolean) => {
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const now = Math.min(travel.current, Math.max(0, pageScroll.target() - sectionTop));
      const next = Math.min(travel.current, Math.max(0, now + dx));
      if (next !== now) pageScroll.to(sectionTop + next, immediate);
    };
    const pinned = () => {
      const r = section.getBoundingClientRect();
      return travel.current > 0 && r.top <= 1 && r.bottom >= window.innerHeight - 1;
    };
    // Trackpad sideways swipe / Shift + wheel. preventDefault also stops the browser's
    // swipe-to-go-back while the row is on screen.
    const onWheel = (e: WheelEvent) => {
      const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
      if (Math.abs(dx) <= Math.abs(e.deltaY) && !e.shiftKey) return; // mostly vertical: normal scroll
      if (!pinned()) return;
      e.preventDefault();
      moveBy(dx * (e.deltaMode === 1 ? 32 : 1), false); // eased like a normal wheel scroll
    };
    // Touch: a mostly sideways drag moves the row with the finger (vertical drags scroll as usual).
    let touch: { x: number; y: number; axis: "x" | "y" | null } | null = null;
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
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
        touch.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (touch.axis !== "x") return;
      e.preventDefault();
      moveBy(-dx, true); // follows the finger
      touch.x = t.clientX;
      touch.y = t.clientY;
    };
    const onTouchEnd = () => (touch = null);

    const ro = new ResizeObserver(measure);
    ro.observe(pin);
    ro.observe(row);
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    row.addEventListener("focusin", onFocusIn);
    pin.addEventListener("wheel", onWheel, { passive: false });
    pin.addEventListener("touchstart", onTouchStart, { passive: true });
    pin.addEventListener("touchmove", onTouchMove, { passive: false });
    pin.addEventListener("touchend", onTouchEnd);
    pin.addEventListener("touchcancel", onTouchEnd);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      nearIo.disconnect();
      window.removeEventListener("scroll", onScroll);
      row.removeEventListener("focusin", onFocusIn);
      pin.removeEventListener("wheel", onWheel);
      pin.removeEventListener("touchstart", onTouchStart);
      pin.removeEventListener("touchmove", onTouchMove);
      pin.removeEventListener("touchend", onTouchEnd);
      pin.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  // Card width follows the viewport height so a whole card fits on screen.
  const cardW = "w-[min(78vw,max(260px,min(40dvh,360px)))]";

  return (
    <section
      ref={sectionRef}
      aria-labelledby="home-books-title"
      // relative z-10: slides up over the sticky hero. data-covers-hero: the hero pauses its animation once this covers it.
      data-covers-hero
      className="relative z-10 rounded-t-[32px] bg-[#fffdf8] shadow-[0_-24px_60px_-28px_rgba(29,40,56,0.45)] sm:rounded-t-[48px] lg:rounded-t-[64px]"
    >
      <div ref={pinRef} className="sticky top-0 flex h-dvh min-h-[560px] flex-col justify-center overflow-clip overscroll-x-none">
        <ul
          ref={rowRef}
          aria-label="Featured books"
          className="flex w-max items-center gap-5 px-page py-10 will-change-transform sm:gap-7"
        >
          {/* Panel 1: title */}
          <li className={`${cardW} shrink-0 pr-2 sm:w-[min(440px,42vw)]`}>
            <SectionTitle id="home-books-title" eyebrow="From our shelf">
              Books kids keep coming back to
            </SectionTitle>
            <p className="mt-4 type-body-lg text-[#1d2838]/70">A few favourites to start with. Tap any book to see what&apos;s inside.</p>
            {/* CTAs: one row with a real gap (they used to touch); wraps to two rows on narrow cards. */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button href="/reading-preferences" variant="primary" arrow="right">
                Find books for my child
              </Button>
              <Button href="/books" variant="secondary">
                See all books
              </Button>
            </div>
          </li>

          {/* Cards: each rests at its own height and tilt, like books set out on a table. */}
          {books.map((b, i) => {
            const rest = RESTING[i % RESTING.length];
            return (
              <li
                key={b.id}
                className={`${cardW} shrink-0 [perspective:1400px]`}
                style={{ transform: `translateY(${rest.y}px) rotate(${rest.r}deg)` }}
              >
                <BookCard book={b} index={i} titleAs="h3" href={`/books/${b.id}`} {...cardProps(b.id)} />
              </li>
            );
          })}
        </ul>
      </div>

      {toastEl}
    </section>
  );
}
