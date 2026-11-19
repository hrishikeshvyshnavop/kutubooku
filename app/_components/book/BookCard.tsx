"use client";

import { Button } from "../ui/Button";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { AddToBoxButton } from "../ui/AddToBoxButton";
import { BookCover } from "./BookCover";
import { rupeesFmt } from "../../_lib/format";
import { IntentLink } from "../ui/IntentLink";
import type { MockBook } from "../../_data/curation-mock";
import { bookIdFromHref, openBook, rememberMorph } from "../../_lib/book-sheet";
import { buyLabel, buyNow, useBox } from "../../_lib/box";
import { CARD_TILTS, PILL_COLOURS, TAG_SHORT, cardColourFor } from "../../_data/card-style";

type Rating = "up" | "down";
type Deal = "out" | "in" | null;
type CardColour = ReturnType<typeof cardColourFor>;

export type BookCardBox = {
  child?: string | null;
  selected?: boolean;
  onToggle?: () => void;
};

export type BookCardMenu = {
  open: boolean;
  onToggle: () => void;
  onSwap: () => void;
  onRemove: () => void;
  onOwn: () => void;
  onRead: () => void;
  onReport: () => void;
};

export type BookCardCuration = {
  motion?: { deal?: Deal; fresh?: boolean; swappingOut?: boolean };
  rating?: Rating;
  onRate?: (r: Rating) => void;
  menu?: BookCardMenu;
};

type BookCardProps = {
  book: MockBook & { reason?: string };
  index: number;
  titleAs?: "h2" | "h3";
  href?: string;
  onOpen?: () => void;
  box?: BookCardBox;
  curation?: BookCardCuration;
  compact?: boolean;
};

const SETTLE_MS = 900;
const INTERACTIVE = "button, a, input, label, [role=menu]";

function motionClass({ deal, fresh, swappingOut, settled }: { deal?: Deal; fresh?: boolean; swappingOut?: boolean; settled: boolean }) {
  if (deal === "out") return "pointer-events-none animate-[deal-out_420ms_cubic-bezier(0.5,0,0.75,0)_both]";
  if (deal === "in") return "animate-[deal-in_750ms_cubic-bezier(0.34,1.35,0.64,1)_both]";
  if (fresh) return "animate-[card-flip-in_700ms_cubic-bezier(0.34,1.35,0.64,1)_both]";
  if (swappingOut) return "pointer-events-none animate-[card-flip-out_300ms_cubic-bezier(0.5,0,0.75,0)_forwards]";
  return settled ? "" : "animate-q-in";
}

const agesOf = (b: MockBook) => (b.ageMin === b.ageMax ? `Age ${b.ageMin}` : `Ages ${b.ageMin}–${b.ageMax}`);

export function BookCard({
  book,
  index,
  titleAs: Title = "h2",
  href,
  onOpen,
  box: { child: boxChild = null, selected, onToggle } = {},
  curation: { motion: { deal, fresh, swappingOut } = {}, rating, onRate, menu } = {},
  compact = false,
}: BookCardProps) {
  const router = useRouter();
  const box = useBox();
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSettled(true), SETTLE_MS);
    return () => clearTimeout(t);
  }, []);

  const card = cardColourFor(book.tone, index);
  const ink = { backgroundColor: card.dark ? "#fffdf8" : "#1d2838", color: card.dark ? "#1d2838" : "#fffdf8" };
  const pills = [...book.tags.map((t) => TAG_SHORT[t] ?? t), agesOf(book)];

  const open = (e?: React.SyntheticEvent) => {
    const from = e?.currentTarget as Element | undefined;
    const id = href ? bookIdFromHref(href) : null;
    if (id) openBook(id, from);
    else if (href) router.push(href);
    else {
      rememberMorph(book.id, from);
      onOpen?.();
    }
  };

  const titleText = <span className="link-underline">{book.title}</span>;
  const full = compact ? "max-sm:hidden" : "";
  const whoseBox = boxChild ? `${boxChild}'s box` : "your box";

  return (
    <article
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest(INTERACTIVE)) open(e);
      }}
      style={
        {
          backgroundColor: card.bg,
          color: card.fg,
          ...(deal ? { animationDelay: `${index * (deal === "out" ? 40 : 70)}ms`, "--deal-r": index % 2 ? "9deg" : "-10deg" } : {}),
        } as React.CSSProperties
      }
      className={`group/card relative flex h-full cursor-pointer flex-col rounded-[30px] p-3 ${compact ? "max-sm:rounded-[22px] max-sm:p-2" : ""} shadow-[0_18px_30px_-22px_rgba(29,40,56,0.7)] transition-[rotate,translate,opacity,filter] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1.5 motion-reduce:transition-none ${motionClass({ deal, fresh, swappingOut, settled })} ${
        CARD_TILTS[index % CARD_TILTS.length]
      }`}
    >
      {fresh && <SwapConfetti />}

      <div data-book-cover={book.id} className={`relative overflow-hidden rounded-[20px] ${compact ? "max-sm:rounded-[15px]" : ""}`}>
        <BookCover book={book} />
      </div>

      <div className={`flex flex-1 flex-col px-1.5 pb-1 pt-3 ${compact ? "max-sm:px-1 max-sm:pb-0 max-sm:pt-2.5" : ""}`}>
        <div className={full}>
          <TagPills pills={pills} card={card} />
        </div>

        <Title className={`mt-2.5 type-title ${compact ? "max-sm:mt-0 max-sm:line-clamp-2 max-sm:text-[18px] max-sm:leading-[1.08]" : ""}`}>
          {href ? (
            <IntentLink href={href} className="group/title text-left focus-visible:outline-none">
              {titleText}
            </IntentLink>
          ) : (
            <button type="button" onClick={onOpen} className="group/title text-left focus-visible:outline-none">
              {titleText}
            </button>
          )}
        </Title>
        <p className={`mt-1 type-caption opacity-75 ${full}`}>
          {book.author} · {book.rating != null && book.reviews != null ? `★ ${book.rating} (${book.reviews.toLocaleString("en-IN")}) · ` : ""}
          {book.format}
        </p>
        <p className={`mt-2 line-clamp-3 type-body-sm opacity-90 ${full}`}>{book.description}</p>

        {book.reason && <WhyPicked bookId={book.id} reason={book.reason} card={card} delay={(deal === "in" ? 750 : 450) + index * 110} />}

        <div className="mt-auto flex items-center gap-1 pt-3">
          <span className={`mr-auto type-title-sm tabular-nums ${compact ? "max-sm:text-[16px]" : ""}`}>{rupeesFmt(book.price)}</span>
          {compact && onToggle && (
            <AddToBoxButton
              selected={!!selected}
              onToggle={onToggle}
              title={book.title}
              whoseBox={whoseBox}
              fill={{ bg: ink.backgroundColor, fg: ink.color }}
              size="icon"
              className="sm:hidden"
            />
          )}
          {onRate && (
            <>
              <Thumb dark={card.dark} pressed={rating === "up"} label={`I like “${book.title}”`} onClick={() => onRate("up")}>
                <path d="M7 10v10H4V10zM7 10l4-7c1.7 0 2.5 1 2.2 2.6L12.6 9H19a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 20H7" />
              </Thumb>
              <Thumb dark={card.dark} pressed={rating === "down"} label={`Not for us: “${book.title}”`} onClick={() => onRate("down")}>
                <path d="M17 14V4h3v10zM17 14l-4 7c-1.7 0-2.5-1-2.2-2.6l.6-3.4H5a2 2 0 0 1-2-2.3l1.2-7A2 2 0 0 1 6.2 4H17" />
              </Thumb>
            </>
          )}
          {menu && (
            <CardMenu
              title={book.title}
              dark={card.dark}
              open={menu.open}
              onToggle={menu.onToggle}
              items={[
                ["Swap this book", menu.onSwap],
                ["Remove", menu.onRemove],
                ["Already own", menu.onOwn],
                ["Already read", menu.onRead],
                ["Report this book", menu.onReport],
              ]}
            />
          )}
        </div>

        {onToggle ? (
          <AddToBoxButton
            selected={!!selected}
            onToggle={onToggle}
            title={book.title}
            whoseBox={whoseBox}
            fill={{ bg: ink.backgroundColor, fg: ink.color }}
            className={`mt-2 w-full ${full}`}
          />
        ) : (
          <Button
            variant="split"
            size="md"
            tone={card.dark ? "light" : "ink"}
            onClick={(e) => {
              e.stopPropagation();
              if (buyNow(book, boxChild, href ? "book" : "curation") === "box") router.push("/box?checkout=1");
            }}
            className="mt-2 w-full"
          >
            {buyLabel(box, book.id)}
          </Button>
        )}
      </div>
    </article>
  );
}

function TagPills({ pills, card }: { pills: string[]; card: CardColour }) {
  const colours = PILL_COLOURS.filter((c) => c.bg !== card.bg);
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
      {pills.map((p, i) => {
        const c = colours[i % colours.length];
        return (
          <li key={p} className="rounded-full px-2.5 py-0.5 type-caption-strong" style={{ backgroundColor: c.bg, color: c.fg }}>
            {p}
          </li>
        );
      })}
    </ul>
  );
}

function WhyPicked({ bookId, reason, card, delay }: { bookId: string; reason: string; card: CardColour; delay: number }) {
  return (
    <div className="mt-3 rounded-[15px] bg-[image:var(--ai-gradient-line)] p-[1.5px]">
      <p className="rounded-[13.5px] px-3 py-2 type-body-sm" style={{ backgroundColor: card.dark ? `color-mix(in srgb, ${card.bg} 86%, #fff)` : "#fffdf8" }}>
        <span className="font-semibold">
          <AiSparkle className="-mt-0.5 mr-1 inline size-4" />
          Why we picked it:{" "}
        </span>
        <TypeReason key={bookId} text={reason} delay={delay} />
      </p>
    </div>
  );
}

function CardMenu({
  title,
  dark,
  open,
  onToggle,
  items,
}: {
  title: string;
  dark: boolean;
  open: boolean;
  onToggle: () => void;
  items: [string, () => void][];
}) {
  return (
    <div className="relative" data-menu-root>
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More options for “${title}”`}
        className={`grid size-10 place-items-center rounded-[13px] transition-colors ${dark ? "hover:bg-white/15" : "hover:bg-[#1d2838]/10"}`}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.9" />
          <circle cx="12" cy="12" r="1.9" />
          <circle cx="19" cy="12" r="1.9" />
        </svg>
      </button>
      {open && (
        <ul
          role="menu"
          aria-label={`Options for “${title}”`}
          className="absolute bottom-12 right-0 z-30 w-52 animate-q-in rounded-[20px] bg-[#fffdf8] p-1.5 type-body-sm text-[#1d2838] shadow-[0_20px_40px_-12px_rgba(29,40,56,0.45),inset_0_0_0_1px_rgba(29,40,56,0.08)]"
        >
          {items.map(([label, fn]) => (
            <li key={label} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={fn}
                className={`w-full rounded-[14px] px-3.5 py-2.5 text-left transition-colors hover:bg-[#f4eee3] ${label === "Report this book" ? "text-[#c2412b]" : ""}`}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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

function AiSparkle({ className }: { className?: string }) {
  const id = `ai-sparkle-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c5cff" />
          <stop offset="0.4" stopColor="#4f8bff" />
          <stop offset="0.7" stopColor="#22c7d6" />
          <stop offset="1" stopColor="#ff6ac1" />
        </linearGradient>
      </defs>
      <path fill={`url(#${id})`} d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9z" />
      <path fill={`url(#${id})`} d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8z" opacity="0.75" />
    </svg>
  );
}

function TypeReason({ text, delay }: { text: string; delay: number }) {
  const [shown, setShown] = useState(0);
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
        {typing && (
          <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-[caret_0.9s_steps(1)_infinite] bg-[image:linear-gradient(#7c5cff,#ff6ac1)]" />
        )}
      </span>
    </>
  );
}

function Thumb({ dark, pressed, label, onClick, children }: { dark: boolean; pressed: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  const tone = pressed
    ? `relative animate-[like-pop_420ms_cubic-bezier(.22,1,.36,1)] ${dark ? "bg-[#fffdf8] text-[#1d2838]" : "bg-[#1d2838] text-white"}`
    : dark
      ? "hover:bg-white/15"
      : "hover:bg-[#1d2838]/10";

  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
      className={`grid size-10 place-items-center rounded-[13px] transition-[background-color,color,scale] duration-200 active:scale-95 ${tone}`}
    >
      {pressed && <span aria-hidden className="pointer-events-none absolute -inset-1 rounded-[16px] border-2 border-current opacity-0 animate-[like-ring_520ms_ease-out]" />}
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
    </button>
  );
}
