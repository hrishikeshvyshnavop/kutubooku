"use client";

// Tall colour book card, shared by /curation (with select, rate, menu and the
// AI reason) and the home page (plain: cover, tags, title, blurb, price, buy).
// Moved out of Curation.tsx on 2026-11-03.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { MockBook } from "../_data/curation-mock";
import { buyLabel, buyNow, useBox } from "../_lib/box";
import { bookIdFromHref, openBook, rememberMorph } from "../_lib/book-sheet";
import { BookCover, rupeesFmt } from "../_components/curation/ui";
import { CARD_TILTS, PILL_COLOURS, TAG_SHORT, cardColourFor } from "./card-style";

export function BookCard({
  book,
  index,
  swappingOut,
  fresh,
  deal,
  selected,
  rating,
  menuOpen,
  onToggle,
  onOpen,
  href,
  onRate,
  onMenu,
  onSwap,
  onRemove,
  onOwn,
  onRead,
  onReport,
  titleAs: Title = "h2",
  boxChild = null,
}: {
  /** Child the book goes into the box for when bought from this card (curation: the child's name). */
  boxChild?: string | null;
  /** `reason` shows the "Why we picked it" line (curation only). */
  book: MockBook & { reason?: string };
  index: number;
  /** Heading level for the title (h3 when the cards sit under a section h2). */
  titleAs?: "h2" | "h3";
  /** Opens the book details sheet (curation). Not needed when `href` is set. */
  onOpen?: () => void;
  /** Book page link (home): the title becomes a link and the whole card goes there. */
  href?: string;
  // Curation-only (each control is hidden when its handler is missing):
  swappingOut?: boolean;
  fresh?: boolean;
  deal?: "out" | "in" | null;
  selected?: boolean;
  rating?: "up" | "down";
  menuOpen?: boolean;
  onToggle?: () => void;
  onRate?: (r: "up" | "down") => void;
  onMenu?: () => void;
  onSwap?: () => void;
  onRemove?: () => void;
  onOwn?: () => void;
  onRead?: () => void;
  onReport?: () => void;
}) {
  // Tall colour card (2026-11-02), layout modelled on Aardvark's book cards:
  // bold solid card, big cover, tag pills, big title, short blurb, split CTA,
  // slight alternating tilt. KutuBooku's own colours, covers and copy.
  const ages = book.ageMin === book.ageMax ? `Age ${book.ageMin}` : `Ages ${book.ageMin}–${book.ageMax}`;
  // Entrance plays once. Without this, switching from the deal/flip animation
  // back to the default class restarted the entrance (cards "loaded again").
  const router = useRouter();
  const box = useBox();
  // Book links open the book sheet over the current screen (app/_lib/book-sheet.ts).
  const open = (e?: React.SyntheticEvent) => {
    const id = href ? bookIdFromHref(href) : null;
    if (id) openBook(id, e?.currentTarget as Element | undefined);
    else if (href) router.push(href);
    else {
      rememberMorph(book.id, e?.currentTarget as Element | undefined); // the listing's sheet plays the flight too
      onOpen?.();
    }
  };
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSettled(true), 900);
    return () => clearTimeout(t);
  }, []);
  const card = cardColourFor(book.tone, index);
  const whoseBox = boxChild ? `${boxChild}'s box` : "your box";
  const tilt = CARD_TILTS[index % CARD_TILTS.length];
  const pills = [...book.tags.map((t) => TAG_SHORT[t] ?? t), ages];
  const pillColours = PILL_COLOURS.filter((c) => c.bg !== card.bg);

  // Animated underline: draws in from the left on hover/focus, slides out to the right on leave.
  // A background (not text-decoration) so it animates on every line of a wrapped title.
  const titleText = (
    <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_2px] bg-[position:right_100%] bg-no-repeat pb-0.5 [box-decoration-break:clone] transition-[background-size] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/title:bg-[length:100%_2px] group-hover/title:bg-[position:left_100%] group-focus-visible/title:bg-[length:100%_2px] group-focus-visible/title:bg-[position:left_100%] motion-reduce:transition-none">
      {book.title}
    </span>
  );

  return (
    <article
      onClick={(e) => {
        // Controls inside the card keep their own behaviour.
        if ((e.target as HTMLElement).closest("button, a, input, label, [role=menu]")) return;
        open(e);
      }}
      style={{
        backgroundColor: card.bg,
        color: card.fg,
        ...(deal ? { animationDelay: `${index * (deal === "out" ? 40 : 70)}ms`, "--deal-r": index % 2 ? "9deg" : "-10deg" } : {}),
      } as React.CSSProperties}
      className={`group/card relative flex h-full cursor-pointer flex-col ${deal === "out" ? "pointer-events-none animate-[deal-out_420ms_cubic-bezier(0.5,0,0.75,0)_both]" : deal === "in" ? "animate-[deal-in_750ms_cubic-bezier(0.34,1.35,0.64,1)_both]" : fresh ? "animate-[card-flip-in_700ms_cubic-bezier(0.34,1.35,0.64,1)_both]" : swappingOut ? "pointer-events-none animate-[card-flip-out_300ms_cubic-bezier(0.5,0,0.75,0)_forwards]" : settled ? "" : "animate-q-in"} rounded-[30px] p-3 shadow-[0_18px_30px_-22px_rgba(29,40,56,0.7)] transition-[rotate,translate,opacity,filter] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1.5 motion-reduce:transition-none ${tilt} ${
        ""
      }`}
    >
      {fresh ? <SwapConfetti /> : null}
      {/* cover */}
      <div data-book-cover={book.id} className="relative overflow-hidden rounded-[20px]">
        <BookCover book={book} />
      </div>

      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3">
        {/* tag pills */}
        <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
          {pills.map((p, i) => {
            const c = pillColours[i % pillColours.length];
            return (
              <li key={p} className="rounded-full px-2.5 py-0.5 type-caption-strong" style={{ backgroundColor: c.bg, color: c.fg }}>
                {p}
              </li>
            );
          })}
        </ul>

        <Title className="mt-2.5 type-title">
          {href ? (
            <Link href={href} className="group/title text-left focus-visible:outline-none">
              {titleText}
            </Link>
          ) : (
            <button type="button" onClick={onOpen} className="group/title text-left focus-visible:outline-none">
              {titleText}
            </button>
          )}
        </Title>
        <p className="mt-1 type-caption opacity-75">
          {book.author} · {book.rating != null && book.reviews != null ? `★ ${book.rating} (${book.reviews.toLocaleString("en-IN")}) · ` : ""}{book.format}
        </p>

        <p className="mt-2 line-clamp-3 type-body-sm opacity-90">{book.description}</p>

        {book.reason ? (
        <p className="mt-3 rounded-[14px] px-3 py-2 type-body-sm" style={{ backgroundColor: card.dark ? "rgb(255 253 248 / 0.12)" : "rgb(255 253 248 / 0.55)" }}>
          <span className="font-semibold">
            <SparkleIcon className="-mt-0.5 mr-1 inline size-3.5" />
            Why we picked it:{" "}
          </span>
          <TypeReason key={book.id} text={book.reason} delay={(deal === "in" ? 750 : 450) + index * 110} />
        </p>
        ) : null}

        {/* price · thumbs · menu */}
        <div className="mt-auto flex items-center gap-1 pt-3">
          <span className="mr-auto type-title-sm tabular-nums">{rupeesFmt(book.price)}</span>
          {onRate ? (
          <>
          <Thumb dark={card.dark} pressed={rating === "up"} label={`I like “${book.title}”`} onClick={() => onRate("up")}>
            <path d="M7 10v10H4V10zM7 10l4-7c1.7 0 2.5 1 2.2 2.6L12.6 9H19a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 20H7" />
          </Thumb>
          <Thumb dark={card.dark} pressed={rating === "down"} label={`Not for us: “${book.title}”`} onClick={() => onRate("down")}>
            <path d="M17 14V4h3v10zM17 14l-4 7c-1.7 0-2.5-1-2.2-2.6l.6-3.4H5a2 2 0 0 1-2-2.3l1.2-7A2 2 0 0 1 6.2 4H17" />
          </Thumb>
          </>
          ) : null}

          {onMenu ? (
          <div className="relative" data-menu-root>
            <button
              type="button"
              onClick={onMenu}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`More options for “${book.title}”`}
              className={`grid size-10 place-items-center rounded-[13px] transition-colors ${card.dark ? "hover:bg-white/15" : "hover:bg-[#1d2838]/10"}`}
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
                <circle cx="5" cy="12" r="1.9" />
                <circle cx="12" cy="12" r="1.9" />
                <circle cx="19" cy="12" r="1.9" />
              </svg>
            </button>
            {menuOpen ? (
              <ul
                role="menu"
                aria-label={`Options for “${book.title}”`}
                className="absolute bottom-12 right-0 z-30 w-52 animate-q-in rounded-[20px] bg-[#fffdf8] p-1.5 type-body-sm text-[#1d2838] shadow-[0_20px_40px_-12px_rgba(29,40,56,0.45),inset_0_0_0_1px_rgba(29,40,56,0.08)]"
              >
                {[
                  ["Swap this book", onSwap],
                  ["Remove", onRemove],
                  ["Already own", onOwn],
                  ["Already read", onRead],
                  ["Report this book", onReport],
                ].map(([label, fn]) => (
                  <li key={label as string} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={fn as (() => void) | undefined}
                      className={`w-full rounded-[14px] px-3.5 py-2.5 text-left transition-colors hover:bg-[#f4eee3] ${
                        label === "Report this book" ? "text-[#c2412b]" : ""
                      }`}
                    >
                      {label as string}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          ) : null}
        </div>

        {/* Curation: the main button puts the book in this child's box (C1); Amazon is reached from the box.
            Pressed again, it takes it out. */}
        {onToggle ? (
          <button
            type="button"
            aria-pressed={!!selected}
            aria-label={selected ? `“${book.title}” is in ${whoseBox}. Take it out` : `Add “${book.title}” to ${whoseBox}`}
            onClick={(e) => {
              e.stopPropagation(); // the card itself opens the book
              onToggle();
            }}
            className="group/buy mt-2 flex h-12 w-full items-stretch gap-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          >
            <span
              className={`flex flex-1 items-center justify-center gap-2 rounded-[14px] type-button-sm transition-[border-radius,background-color,color] duration-300 group-hover/buy:rounded-[24px] ${selected ? "border-2 border-current" : ""}`}
              style={selected ? { backgroundColor: "transparent", color: "inherit" } : { backgroundColor: card.dark ? "#fffdf8" : "#1d2838", color: card.dark ? "#1d2838" : "#fffdf8" }}
            >
              {selected ? (
                <>
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                  <span className="group-hover/buy:hidden">In {whoseBox}</span>
                  <span className="hidden group-hover/buy:inline">Take it out</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3.5 8.5 12 4l8.5 4.5v9L12 22l-8.5-4.5z" />
                    <path d="M3.5 8.5 12 13l8.5-4.5M12 13v9" />
                  </svg>
                  Add to {whoseBox}
                </>
              )}
            </span>
          </button>
        ) : (
        <>
        {/* split CTA: label + arrow chip */}
        {/* C3/C4: adds the book to the box, then sends the whole box to Amazon. */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // the card itself opens the book
            if (buyNow(book, boxChild, href ? "book" : "curation") === "box") router.push("/box?checkout=1");
          }}
          className="group/buy mt-2 flex h-12 w-full items-stretch gap-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          <span
            className="flex flex-1 items-center justify-center rounded-[14px] type-button-sm transition-[border-radius] duration-300 group-hover/buy:rounded-[24px]"
            style={{ backgroundColor: card.dark ? "#fffdf8" : "#1d2838", color: card.dark ? "#1d2838" : "#fffdf8" }}
          >
            {buyLabel(box, book.id)}
          </span>
          <span
            className="grid w-12 place-items-center rounded-[14px] transition-[border-radius] duration-300 group-hover/buy:rounded-[24px]"
            style={{ backgroundColor: card.dark ? "#fffdf8" : "#1d2838", color: card.dark ? "#1d2838" : "#fffdf8" }}
          >
            <svg viewBox="0 0 24 24" className="size-5 transition-transform group-hover/buy:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 12h16M14 6l6 6-6 6" />
            </svg>
          </span>
        </button>
        </>
        )}
      </div>
    </article>
  );
}

/** Little confetti burst for a freshly swapped-in card (KutuBooku palette). */
const CONFETTI = [
  { c: "#f26b4f", dx: "-120px", dy: "-90px", r: "-140deg", w: 10, h: 14 },
  { c: "#f6c453", dx: "115px", dy: "-105px", r: "120deg", w: 12, h: 12 },
  { c: "#9fcbf2", dx: "-140px", dy: "10px", r: "160deg", w: 9, h: 15 },
  { c: "#c9b7f1", dx: "140px", dy: "0px", r: "-150deg", w: 11, h: 11 },
  { c: "#a9dfc0", dx: "-95px", dy: "110px", r: "90deg", w: 10, h: 14 },
  { c: "#f26b4f", dx: "100px", dy: "115px", r: "-110deg", w: 12, h: 12 },
  { c: "#f6c453", dx: "0px", dy: "-140px", r: "200deg", w: 9, h: 15 },
  { c: "#1d2838", dx: "-30px", dy: "140px", r: "-200deg", w: 8, h: 8 },
  { c: "#9fcbf2", dx: "60px", dy: "-130px", r: "70deg", w: 10, h: 10 },
  { c: "#c9b7f1", dx: "-70px", dy: "-135px", r: "-80deg", w: 11, h: 14 },
  { c: "#a9dfc0", dx: "150px", dy: "70px", r: "130deg", w: 9, h: 13 },
  { c: "#f26b4f", dx: "-150px", dy: "75px", r: "-60deg", w: 10, h: 10 },
];

function SwapConfetti() {
  return (
    <span aria-hidden className="pointer-events-none absolute left-1/2 top-[30%] z-40">
      {CONFETTI.map((p, i) => (
        <span
          key={i}
          className={`absolute block animate-[confetti_1000ms_cubic-bezier(0.22,1,0.36,1)_forwards] ${i % 3 === 0 ? "rounded-full" : "rounded-[3px]"}`}
          style={{ width: p.w, height: p.h, backgroundColor: p.c, "--dx": p.dx, "--dy": p.dy, "--r": p.r, animationDelay: `${100 + i * 15}ms` } as React.CSSProperties}
        />
      ))}
    </span>
  );
}

export function SparkleIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9z" />
      <path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8z" opacity="0.7" />
    </svg>
  );
}

/** Types the reason out after a delay, like the AI explaining its pick. */
function TypeReason({ text, delay }: { text: string; delay: number }) {
  const [shown, setShown] = useState(0);
  // Freeze the start delay on mount: the parent's deal phase changes later,
  // and a changing delay would restart the typing.
  const [startDelay] = useState(delay);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(text.length); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    let i = 0;
    let tick: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      tick = setInterval(() => {
        i += 2;
        setShown(Math.min(i, text.length));
        if (i >= text.length && tick) clearInterval(tick);
      }, 22);
    }, startDelay);
    return () => {
      clearTimeout(start);
      if (tick) clearInterval(tick);
    };
  }, [text, startDelay]);
  const typing = shown < text.length;
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {text.slice(0, shown)}
        {typing ? (
          <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-[caret_0.9s_steps(1)_infinite] bg-current" />
        ) : null}
      </span>
    </>
  );
}

function Thumb({
  dark,
  pressed,
  label,
  onClick,
  children,
}: {
  dark: boolean;
  pressed: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
      className={`grid size-10 place-items-center rounded-[13px] transition-[background-color,color,scale] duration-200 active:scale-95 ${
        pressed
          ? dark
            ? "relative bg-[#fffdf8] text-[#1d2838] animate-[like-pop_420ms_cubic-bezier(.22,1,.36,1)]"
            : "relative bg-[#1d2838] text-white animate-[like-pop_420ms_cubic-bezier(.22,1,.36,1)]"
          : dark
            ? "hover:bg-white/15"
            : "hover:bg-[#1d2838]/10"
      }`}
    >
      {pressed ? <span aria-hidden className="pointer-events-none absolute -inset-1 rounded-[16px] border-2 border-current opacity-0 animate-[like-ring_520ms_ease-out]" /> : null}
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
    </button>
  );
}
