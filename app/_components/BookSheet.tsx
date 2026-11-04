"use client";

// The book page as a slide-up sheet over whatever screen you're on. Shown by BookSheetHost when
// the URL has ?book=<id> (app/_lib/book-sheet.ts), so refresh keeps it and the link can be shared.
// Close with ×, Escape, the dimmed strip or the browser's Back: it slides down, then the URL updates.

import { useEffect, useRef } from "react";
import { SHEET_CLOSE_BTN, SHEET_CLOSE_MS, SHEET_DIALOG } from "./sheet";

export function BookSheet({ bookId, onClose, children }: { bookId: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const closing = useRef(false);

  // Open in the ref callback (before any layout effect inside the sheet runs), so the content
  // can measure the open sheet straight away: the book's flight into the cover needs that.
  const attach = (d: HTMLDialogElement | null) => {
    ref.current = d;
    if (d && !d.open) d.showModal();
  };

  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
    };
  }, []);

  // Another book opened inside the sheet ("Read more like this"): start it from the top.
  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [bookId]);

  /** Slide down, then update the URL (which removes the sheet). */
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    if (ref.current?.open) ref.current.close();
    setTimeout(onClose, SHEET_CLOSE_MS);
  };

  return (
    <dialog
      ref={attach}
      aria-labelledby="book-title"
      // Escape closes the dialog natively; then go back too.
      onClose={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close(); // the dimmed strip
      }}
      data-lenis-prevent
      className={SHEET_DIALOG}
    >
      <div className="min-h-full font-[family-name:var(--font-q-sans)]">
        {/* Grabber + close float over the book (zero-height sticky bar), so the sheet can open
            before the book (and its colours) has streamed in. */}
        <div className="pointer-events-none sticky top-0 z-40 h-0">
          <span aria-hidden className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-black/20" />
          <div className="mx-auto flex max-w-[1920px] justify-end px-5 pt-4 sm:px-10 lg:px-[6%]">
            <button type="button" onClick={close} aria-label="Close book" className={`pointer-events-auto shadow-md ${SHEET_CLOSE_BTN}`}>
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>
        {children}
      </div>
    </dialog>
  );
}
