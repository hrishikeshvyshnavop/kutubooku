"use client";

// Book sheet on the listing (/curation). A full-page modal that slides up and leaves a 100px gap
// at the top so the list stays visible, dimmed, behind it. Close with ×, Escape or the dimmed strip.
// Since 2026-11-04 its content is the new book page (BookPdp in sheet mode) rather than the old
// details layout (copy of the old version: scratchpad/BookDetails.before-pdp.tsx, outside the repo).
// The buy tray inside it puts books in the box for this child (C1).

import { useEffect, useRef, useState } from "react";
import { playMorph } from "../_lib/book-sheet";
import { BookPdp, bookTheme } from "../books/[id]/BookPdp";
import type { MockBook } from "../_data/curation-mock";
import { SHEET_CLOSE_BTN, SHEET_DIALOG } from "../_components/sheet";

type Props = {
  /** Book to show; null closes the sheet. */
  book: MockBook | null;
  /** "Why we picked it" line, when the book is in the curation. */
  reason?: string;
  inList: boolean;
  /** Child the books go into the box for (the curation's child), or null. */
  child: string | null;
  onAdd: () => void;
  onOpen: (id: string) => void;
  onClose: () => void;
};

export function BookDetails({ book, reason, inList, child, onAdd, onOpen, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  // Keep the last book on screen while the sheet animates closed.
  const [shown, setShown] = useState<MockBook | null>(book);
  if (book && book !== shown) setShown(book);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (book) {
      if (!d.open) d.showModal();
      d.scrollTo({ top: 0 });
      // The clicked card's book flies into the sheet's cover (app/_lib/book-sheet.ts).
      playMorph(book.id, d.querySelector<HTMLElement>("[data-book-cover]"));
      const html = document.documentElement;
      const prev = html.style.overflow;
      html.style.overflow = "hidden";
      return () => {
        html.style.overflow = prev;
      };
    }
    if (d.open) d.close();
  }, [book]);

  const b = shown;

  return (
    <dialog
      ref={ref}
      aria-labelledby="book-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // backdrop
      }}
      // data-lenis-prevent: the sheet scrolls itself, not the page behind it.
      data-lenis-prevent
      className={SHEET_DIALOG}
    >
      {b ? (
        <div style={bookTheme(b)} className="min-h-full font-[family-name:var(--font-q-sans)]">
          {/* Top bar: grabber, list status / "Add to my list", close. Sits on the hero's tint. */}
          <div className="sticky top-0 z-40 bg-[var(--book-tint)]/90 backdrop-blur">
            <span aria-hidden className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-black/20" />
            <div className="mx-auto flex max-w-[1920px] items-center justify-between gap-3 px-5 pb-2 pt-4 sm:px-10 lg:px-[6%]">
              {inList ? (
                <p className="truncate text-[15px] font-semibold text-black/60">In {child ? `${child}'s` : "your"} list</p>
              ) : (
                <button
                  type="button"
                  onClick={onAdd}
                  className="h-11 rounded-full bg-white px-4 text-[15px] font-semibold transition-colors hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  + Add to {child ? `${child}'s` : "my"} list
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close book"
                className={SHEET_CLOSE_BTN}
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            {reason ? (
              <p className="mx-auto max-w-[1920px] px-5 pb-3 text-[15px] font-medium sm:px-10 lg:px-[6%]">
                <span className="font-bold">Why we picked it: </span>
                {reason}
              </p>
            ) : null}
          </div>

          {/* key: a new book starts from the top with fresh state */}
          <BookPdp key={b.id} book={b} sheet={{ onOpenBook: onOpen, child }} />
        </div>
      ) : null}
    </dialog>
  );
}
