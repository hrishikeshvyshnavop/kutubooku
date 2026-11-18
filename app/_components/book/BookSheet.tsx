"use client";

import { useEffect, useRef } from "react";
import { SHEET_CLOSE_BTN, SHEET_CLOSE_MS, SHEET_DIALOG } from "../../_data/sheet";

export function BookSheet({ bookId, onClose, children }: { bookId: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const closing = useRef(false);

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

  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [bookId]);

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
      onClose={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      data-lenis-prevent
      className={SHEET_DIALOG}
    >
      <div className="min-h-full font-[family-name:var(--font-q-sans)]">
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
