"use client";

// Home: book listing under the hero. Same tall colour cards as /curation
// (BookCard, without the curation-only controls). A card links to its book
// page, /books/[id].
//
// Horizontal scroll, driven by the page scroll: the section pins to the
// viewport and scrolling down moves the row sideways; once the last card is
// in view the page carries on. The title is the first panel of the row.
// Keyboard: focusing a card scrolls the page so that card is in view.

import { useEffect, useRef } from "react";
import { BookCard } from "../curation/BookCard";
import { MOCK_BOOKS } from "../_data/curation-mock";
import { Button } from "./Button";
import { SectionTitle } from "./SectionTitle";
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
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    // Keyboard: bring the focused card into view by scrolling the page.
    const onFocusIn = (e: FocusEvent) => {
      const li = (e.target as HTMLElement).closest("li");
      if (!li || !row.contains(li)) return;
      const want = Math.min(travel.current, Math.max(0, li.offsetLeft - (pin.clientWidth - li.offsetWidth) / 2));
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: sectionTop + want, behavior: "instant" });
    };

    const ro = new ResizeObserver(measure);
    ro.observe(pin);
    ro.observe(row);
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    row.addEventListener("focusin", onFocusIn);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      row.removeEventListener("focusin", onFocusIn);
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
      <div ref={pinRef} className="sticky top-0 flex h-dvh min-h-[560px] flex-col justify-center overflow-clip">
        <ul
          ref={rowRef}
          aria-label="Featured books"
          className="flex w-max items-center gap-5 px-5 py-10 will-change-transform sm:gap-7 sm:px-10 lg:px-[6vw]"
        >
          {/* Panel 1: title */}
          <li className={`${cardW} shrink-0 pr-2 sm:w-[min(440px,42vw)]`}>
            <SectionTitle id="home-books-title" eyebrow="From our shelf">
              Books kids keep coming back to
            </SectionTitle>
            <p className="mt-4 type-body-lg text-[#1d2838]/70">A few favourites to start with. Tap any book to see what&apos;s inside.</p>
            <Button href="/reading-preferences" variant="primary" arrow="right" className="mt-8">
              Find books for my child
            </Button>
            <Button href="/books" variant="secondary" className="mt-3">
              See all books
            </Button>
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
