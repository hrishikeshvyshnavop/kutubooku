"use client";

import Image from "next/image";
import { BookCard } from "../book/BookCard";
import { CARD_TILTS, PILL_COLOURS, cardColourFor } from "../../_data/card-style";
import type { MockBook } from "../../_data/curation-mock";
import { rupeesFmt } from "../../_lib/format";
import { useAddToBox } from "../useAddToBox";

export type CollectionItem =
  | { kind: "shelf"; key: string; book: MockBook }
  | { kind: "seasonal"; key: string; title: string; author: string; cover?: string; ages: string; price: number; href: string };

export function CollectionBooks({ label, items, accent }: { label: string; items: CollectionItem[]; accent: string }) {
  const { cardProps, toastEl } = useAddToBox();

  return (
    <>
      <ul
        aria-label={label}
        data-lenis-prevent-horizontal
        className="mx-[calc(var(--gutter)*-1)] mt-8 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto overscroll-x-contain px-page pb-6 pt-4 [scrollbar-width:none] sm:mt-10 sm:gap-5"
      >
        {items.map((b, i) => (
          <li key={b.key} className="w-[min(78vw,300px)] shrink-0 snap-start sm:w-[320px]">
            {b.kind === "shelf" ? (
              <BookCard book={b.book} index={i} titleAs="h3" href={`/books/${b.book.id}`} box={cardProps(b.book.id)} />
            ) : (
              <SeasonalCard b={b} index={i} accent={accent} />
            )}
          </li>
        ))}
      </ul>
      {toastEl}
    </>
  );
}

function SeasonalCard({ b, index, accent }: { b: Extract<CollectionItem, { kind: "seasonal" }>; index: number; accent: string }) {
  const card = cardColourFor(accent, index);
  const pillColours = PILL_COLOURS.filter((p) => p.bg !== card.bg);
  const pills = ["Seasonal pick", b.ages];
  const ink = card.dark ? "#fffdf8" : "#1d2838";
  const onInk = card.dark ? "#1d2838" : "#fffdf8";

  return (
    <article
      style={{ backgroundColor: card.bg, color: card.fg }}
      className={`group/card relative flex h-full flex-col rounded-[30px] p-3 shadow-[0_18px_30px_-22px_rgba(29,40,56,0.7)] transition-[rotate,translate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1.5 motion-reduce:transition-none ${
        CARD_TILTS[index % CARD_TILTS.length]
      }`}
    >
      <div className="relative aspect-square overflow-hidden rounded-r-[10px] rounded-l-[3px] bg-white shadow-[0_10px_20px_-12px_rgba(29,40,56,0.6)]">
        {b.cover ? (
          <Image src={b.cover} alt={`Cover of ${b.title}`} fill sizes="320px" className="object-cover" />
        ) : (
          <span aria-hidden className="absolute inset-0 flex flex-col justify-between p-5" style={{ backgroundColor: ink, color: onInk }}>
            <span className="type-caption-strong uppercase tracking-[0.12em] opacity-70">Seasonal pick</span>
            <span>
              <span className="block text-[28px] font-bold leading-[0.95] tracking-[-0.02em]">{b.title}</span>
              <span className="mt-2 block type-body-sm font-semibold opacity-80">{b.author}</span>
            </span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3">
        <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
          {pills.map((p, i) => {
            const pc = pillColours[i % pillColours.length];
            return (
              <li key={p} className="rounded-full px-2.5 py-0.5 type-caption-strong" style={{ backgroundColor: pc.bg, color: pc.fg }}>
                {p}
              </li>
            );
          })}
        </ul>
        <h3 className="mt-2.5 type-title">{b.title}</h3>
        <p className="mt-1 type-caption opacity-75">{b.author}</p>

        <div className="mt-auto flex items-center pt-3">
          <span className="type-title-sm tabular-nums">{rupeesFmt(b.price)}</span>
        </div>
        <a
          href={b.href}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="group/buy mt-2 flex h-12 w-full items-stretch gap-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          <span
            className="flex flex-1 items-center justify-center rounded-[14px] type-button-sm transition-[border-radius] duration-300 group-hover/buy:rounded-[24px]"
            style={{ backgroundColor: ink, color: onInk }}
          >
            Buy on Amazon.in
            <span className="sr-only"> (opens in a new tab)</span>
          </span>
          <span
            className="grid w-12 place-items-center rounded-[14px] transition-[border-radius] duration-300 group-hover/buy:rounded-[24px]"
            style={{ backgroundColor: ink, color: onInk }}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5 transition-transform group-hover/buy:-translate-y-0.5 group-hover/buy:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M7 17L17 7M9 7h8v8" />
            </svg>
          </span>
        </a>
      </div>
    </article>
  );
}
