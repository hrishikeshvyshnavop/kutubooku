"use client";

// Home: seasonal / monthly collections ("This month's collection", "Diwali collection"…),
// one section each, from app/_data/collections.ts (stand-in for the CMS).
// - Only collections live today (India time) show; ?on=YYYY-MM-DD previews another day.
//   Worked out in the browser: this Next version won't read the clock while prerendering.
// - Each section takes the collection's own colour (light or dark), with the shared section
//   title (handwritten eyebrow + bold title), its dates and a row of books.
// - Stacked cards: each collection pins as you scroll and the next one slides up over it; the
//   covered card shrinks and dims a little, its top edge peeking out above the next (a deck).
//   A card taller than the screen pins by its bottom edge instead, so all of it is seen first.
// - The row scrolls sideways (swipe / trackpad / Shift + wheel), snapping to each book.
// - Shelf books link to their book page and can be added to the box; seasonal-only books
//   link to Amazon.in (a typeset cover stands in when there's no cover image).

import Image from "next/image";
import { IntentLink } from "./IntentLink";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { liveCollections, todayInIndia, untilLabel, type Collection, type CollectionBook } from "../_data/collections";
import { MOCK_BOOKS } from "../_data/curation-mock";
import { amazonCartUrl, rupees } from "../_lib/amazon";
import { SectionTitle } from "./SectionTitle";
import { useCardBox } from "./useCardBox";
import { BoxToggleButton } from "./BoxToggleButton";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";

/** Today (or ?on=…); null on the server and before hydration. */
function useDay(): string | null {
  return useSyncExternalStore(
    () => () => {},
    () => {
      const on = new URLSearchParams(window.location.search).get("on");
      return on && /^\d{4}-\d{2}-\d{2}$/.test(on) ? on : todayInIndia();
    },
    () => null,
  );
}

type Item =
  | { kind: "shelf"; key: string; id: string; title: string; author: string; cover: string; ages: string; price: number }
  | { kind: "seasonal"; key: string; title: string; author: string; cover?: string; ages: string; price: number; href: string };

function resolve(b: CollectionBook, i: number): Item | null {
  if (typeof b === "string") {
    const m = MOCK_BOOKS.find((x) => x.id === b);
    if (!m) return null; // removed from the shelf: skip quietly
    return { kind: "shelf", key: m.id, id: m.id, title: m.title, author: m.author, cover: m.cover, ages: `Ages ${m.ageMin}–${m.ageMax}`, price: m.price };
  }
  return {
    kind: "seasonal",
    key: `s${i}-${b.title}`,
    title: b.title,
    author: b.author,
    cover: b.cover,
    ages: `Ages ${b.ageMin}–${b.ageMax}`,
    price: b.price,
    href: amazonCartUrl(b.asin ? [{ asin: b.asin }] : [], `${b.title} ${b.author}`),
  };
}

export function HomeCollections() {
  const day = useDay();
  const { cardProps, whoseBox, toastEl } = useCardBox();
  const live = day ? liveCollections(day) : [];
  const stackRef = useDeck(live.length);
  if (!live.length) return null;
  return (
    // relative z-10: covers the sticky hero, like the other home sections. -mt: the first card's
    // rounded top overlaps the section above, so it reads as a card laid over the page.
    // Cream backdrop (the shelf section's colour): what shows around a card as it shrinks back,
    // instead of the hero underneath.
    <div ref={stackRef} className="relative z-10 -mt-8 bg-[#fffdf8] sm:-mt-12">
      {live.map((c) => (
        <CollectionSection key={c.slug} c={c} cardProps={cardProps} whoseBox={whoseBox} />
      ))}
      {toastEl}
    </div>
  );
}

/** Peek between stacked cards: each later card pins this much lower than the one before. */
const PEEK = 20;

/** Sticky stacking + the "pushed back" look for covered cards. */
function useDeck(count: number) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stack = ref.current;
    if (!stack || !count) return;
    const cards = [...stack.querySelectorAll<HTMLElement>(":scope > section")];
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pin: number[] = [];

    const layout = () => {
      cards.forEach((el, i) => {
        // Fits: pin near the top (stepped, so the cards behind peek out). Too tall: pin by the bottom.
        pin[i] = Math.min(i * PEEK, window.innerHeight - el.offsetHeight);
        el.style.top = `${pin[i]}px`;
      });
      update();
    };
    const update = () => {
      if (still) return;
      const vh = window.innerHeight;
      cards.forEach((el, i) => {
        const next = cards[i + 1];
        if (!next) return;
        // 0 when the next card enters at the bottom of the screen, 1 once it has pinned.
        const span = Math.max(1, vh - pin[i + 1]);
        const p = Math.min(1, Math.max(0, (vh - next.getBoundingClientRect().top) / span));
        el.style.transform = p ? `scale(${1 - 0.05 * p})` : "";
        // Darken with an overlay's opacity (compositor-only), not filter: brightness(), which
        // repainted the whole card on every scroll frame.
        const dim = el.querySelector<HTMLElement>(":scope > [data-dim]");
        if (dim) dim.style.opacity = String(0.3 * p);
      });
    };
    let raf = 0;
    let near = false; // only work while the stack is on or near the screen
    const onScroll = () => {
      if (!near) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(([e]) => (near = e.isIntersecting), { rootMargin: "50% 0px" });
    io.observe(stack);
    const ro = new ResizeObserver(layout);
    cards.forEach((el) => ro.observe(el));
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", layout);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", layout);
    };
  }, [count]);
  return ref;
}

function CollectionSection({
  c,
  cardProps,
  whoseBox,
}: {
  c: Collection;
  cardProps: ReturnType<typeof useCardBox>["cardProps"];
  whoseBox: string;
}) {
  const dark = c.theme.tone === "dark";
  const items = c.books.map(resolve).filter((x): x is Item => x !== null);
  const titleId = `c-${c.slug}-title`;

  return (
    <section
      id={`c-${c.slug}`}
      aria-labelledby={titleId}
      // sticky (top set by useDeck): pins, and the next collection slides over it. Rounded top so
      // each one reads as a card; origin-top so a covered card shrinks towards its peeking top edge.
      className={`sticky top-0 origin-top rounded-t-[32px] pb-16 pt-14 shadow-[0_-24px_60px_-28px_rgba(29,40,56,0.45)] sm:rounded-t-[48px] sm:pb-24 sm:pt-20 lg:rounded-t-[64px] ${dark ? "text-white" : "text-[#1d2838]"}`}
      style={{ background: c.theme.bg }}
    >
      {/* Darkens as the next collection slides over (useDeck sets its opacity). */}
      <span aria-hidden data-dim className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] bg-black opacity-0" />
      <div className="mx-auto w-full max-w-[1920px] px-page">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle id={titleId} eyebrow={c.eyebrow} tone={dark ? "dark" : "light"} className="max-w-[900px]">
            {c.title}
          </SectionTitle>
          <div className="flex max-w-md flex-col gap-3 lg:items-end lg:text-right">
            <p className={`type-body-lg ${dark ? "text-white/75" : "text-[#1d2838]/70"}`}>{c.description}</p>
            <p
              className="w-fit rounded-full px-3.5 py-1.5 text-[14px] font-semibold"
              style={{ background: c.theme.accent, color: dark ? "#1d2838" : "#fff" }}
            >
              {untilLabel(c.endsAt)} · {items.length} books
            </p>
          </div>
        </div>

        {/* Sideways row; native scrolling (swipe, trackpad, Shift + wheel), snapping to books. */}
        <ul
          aria-label={`${c.title}: books`}
          data-lenis-prevent-horizontal
          className="mx-[calc(var(--gutter)*-1)] mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4 [scrollbar-width:none] px-page sm:mt-12 sm:gap-6"
        >
          {items.map((b) => (
            <li key={b.key} className="w-[min(62vw,240px)] shrink-0 snap-start sm:w-[260px]">
              <BookTile b={b} c={c} dark={dark} whoseBox={whoseBox} {...(b.kind === "shelf" ? cardProps(b.id) : {})} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function BookTile({
  b,
  c,
  dark,
  selected,
  onToggle,
  whoseBox,
}: {
  b: Item;
  c: Collection;
  dark: boolean;
  whoseBox: string;
  selected?: boolean;
  onToggle?: () => void;
}) {
  const href = b.kind === "shelf" ? `/books/${b.id}` : b.href;
  const external = b.kind === "seasonal";
  const cover = (
    // data-book-cover: where "Add to box" throws the book from (app/_lib/fly.ts)
    <span
      data-book-cover={b.kind === "shelf" ? b.id : undefined}
      className="relative block aspect-[3/4] overflow-hidden rounded-r-[14px] rounded-l-[4px] shadow-[0_22px_40px_-22px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1.5 group-hover:-rotate-1"
    >
      {b.cover ? (
        <Image src={b.cover} alt="" fill sizes="260px" className="object-cover" />
      ) : (
        // Typeset cover for a seasonal book without an image
        <span className="absolute inset-0 flex flex-col justify-between p-5" style={{ background: c.theme.accent, color: dark ? "#1d2838" : "#fff" }}>
          <span className="text-[13px] font-bold uppercase tracking-[0.12em] opacity-70">Seasonal pick</span>
          <span>
            <span className="block text-[28px] font-bold leading-[0.95] tracking-[-0.02em]">{b.title}</span>
            <span className="mt-2 block text-[15px] font-semibold opacity-80">{b.author}</span>
          </span>
        </span>
      )}
    </span>
  );

  return (
    <div className="flex h-full flex-col">
      {external ? (
        <a href={href} target="_blank" rel="sponsored noopener noreferrer" className={`group block rounded-[14px] ${FOCUS}`}>
          {cover}
          <span className="sr-only"> (opens Amazon.in in a new tab)</span>
        </a>
      ) : (
        <IntentLink href={href} className={`group block rounded-[14px] ${FOCUS}`}>
          {cover}
        </IntentLink>
      )}
      <p className="mt-4 text-[20px] font-bold leading-tight tracking-[-0.02em]">{b.title}</p>
      <p className={`mt-1 text-[14px] ${dark ? "text-white/65" : "text-[#1d2838]/60"}`}>
        {b.author} · {b.ages}
      </p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-3">
        <span className="text-[17px] font-bold tabular-nums">{rupees(b.price)}</span>
        {b.kind === "shelf" ? (
          <BoxToggleButton
            selected={!!selected}
            onToggle={onToggle ?? (() => {})}
            title={b.title}
            whoseBox={whoseBox}
            addLabel="Add to box"
            inLabel="In box"
            fill={dark ? { bg: "#fffdf8", fg: "#1d2838" } : { bg: "#1d2838", fg: "#fffdf8" }}
            size="sm"
          />
        ) : (
          <a
            href={href}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className={`inline-flex h-10 items-center rounded-full px-4 text-[14px] font-semibold ${FOCUS} ${
              dark ? "bg-white/12 text-white ring-1 ring-white/30 hover:bg-white/20" : "bg-white/70 ring-1 ring-[#1d2838]/15 hover:bg-white"
            }`}
          >
            On Amazon ↗
          </a>
        )}
      </div>
    </div>
  );
}
