"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Edition } from "../_data/editions";
import { amazonCartUrl, rupees } from "../_lib/amazon";
import { EditionCover } from "./EditionCover";

/* ------------------------------------------------------------------------ */
/* Shelf                                                                     */
/* ------------------------------------------------------------------------ */

export function Shelf({ editions }: { editions: Edition[] }) {
  const [active, setActive] = useState<Edition | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const open = (e: Edition, el: HTMLElement) => {
    returnFocus.current = el;
    setActive(e);
  };

  const close = useCallback(() => {
    setActive(null);
    returnFocus.current?.focus();
  }, []);

  return (
    <>
      <ul className="grid w-full max-w-6xl grid-cols-2 gap-y-14 sm:grid-cols-3 lg:grid-cols-5 lg:gap-y-20">
        {editions.map((e) => (
          <li key={e.slug} className="relative flex flex-col items-center px-[7%] sm:px-[9%]">
            <ShelfBook edition={e} onOpen={open} />
            {/* Shelf segment: plank + soft shadow below. Segments in a row
                butt together into one continuous shelf (no negative spread,
                so the shadow has no gaps at the joins). */}
            <span aria-hidden className="pointer-events-none absolute -bottom-2.5 inset-x-0 h-2.5 bg-gradient-to-b from-white to-[#f1f1ef]" />
            <span aria-hidden className="pointer-events-none absolute -bottom-7 inset-x-0 h-[18px] bg-gradient-to-b from-black/15 via-black/5 to-transparent" />
          </li>
        ))}
      </ul>

      <EditionDialog edition={active} onClose={close} />
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Book on the shelf — leans against the wall, tips up and follows cursor   */
/* ------------------------------------------------------------------------ */

const REST = { rx: 8, ry: 0, ty: 0, s: 1 };

function ShelfBook({
  edition,
  onOpen,
}: {
  edition: Edition;
  onOpen: (e: Edition, el: HTMLElement) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const set = (v: typeof REST, fast = false) => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", `${v.rx}deg`);
    el.style.setProperty("--ry", `${v.ry}deg`);
    el.style.setProperty("--ty", `${v.ty}px`);
    el.style.setProperty("--s", `${v.s}`);
    el.style.setProperty("--dur", fast ? "120ms" : "600ms");
  };

  const onMove = (ev: React.PointerEvent<HTMLButtonElement>) => {
    if (ev.pointerType !== "mouse") return;
    const r = ev.currentTarget.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width - 0.5; // -0.5..0.5
    const y = (ev.clientY - r.top) / r.height - 0.5;
    set({ rx: -y * 10, ry: x * 14, ty: -14, s: 1.05 }, true);
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={(ev) => onOpen(edition, ev.currentTarget)}
      onPointerEnter={() => set({ rx: 0, ry: 0, ty: -14, s: 1.05 })}
      onPointerMove={onMove}
      onPointerLeave={() => set(REST)}
      onFocus={() => set({ rx: 0, ry: 0, ty: -14, s: 1.05 })}
      onBlur={() => set(REST)}
      aria-haspopup="dialog"
      aria-label={`Open the ${edition.month} ${edition.year} Edition: ${edition.title}${edition.current ? " (this month)" : ""}`}
      className="group relative block w-full cursor-pointer [perspective:900px] focus-visible:outline-none"
    >
      <span
        className="relative block aspect-[3/4] w-full origin-bottom rounded-[2px] shadow-[6px_-4px_14px_-6px_rgba(0,0,0,0.35),0_12px_18px_-10px_rgba(0,0,0,0.4)] transition-[transform,box-shadow] ease-out [transform:rotateX(var(--rx,8deg))_rotateY(var(--ry,0deg))_translateY(var(--ty,0px))_scale(var(--s,1))] [transition-duration:var(--dur,600ms)] group-hover:shadow-[0_30px_40px_-18px_rgba(0,0,0,0.5)] group-focus-visible:ring-4 group-focus-visible:ring-marigold motion-reduce:transition-none"
      >
        <span className="block size-full overflow-hidden rounded-[2px]">
          <EditionCover art={edition.art} title={edition.title} />
        </span>
        {/* glossy light sweep on hover */}
        <span className="pointer-events-none absolute inset-0 rounded-[2px] bg-gradient-to-tr from-transparent via-white/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </span>
      <span className="pointer-events-none absolute inset-x-0 -bottom-10 text-center text-xs font-semibold text-ink-soft opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
        {edition.month} {edition.year}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------------ */
/* Pop-up: book appears, cover flips open, inside page has the buy button   */
/* ------------------------------------------------------------------------ */

const FLIP_DELAY = 350; // ms after the pop-up appears before the cover opens
const CLOSE_MS = 650;

function EditionDialog({ edition, onClose }: { edition: Edition | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [shown, setShown] = useState<Edition | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [visible, setVisible] = useState(false);

  // Open when an edition is chosen.
  useEffect(() => {
    if (!edition) return;
    const d = dialogRef.current;
    if (!d) return;
    setShown(edition);
    setFlipped(false);
    if (!d.open) d.showModal();
    const raf = requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => setFlipped(true), FLIP_DELAY);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [edition]);

  const requestClose = useCallback(() => {
    setFlipped(false);
    setTimeout(() => setVisible(false), 250);
    setTimeout(() => {
      dialogRef.current?.close();
      setShown(null);
      onClose();
    }, CLOSE_MS);
  }, [onClose]);

  const e = shown;
  const total = e ? e.books.reduce((s, x) => s + x.price, 0) : 0;

  return (
    <dialog
      ref={dialogRef}
      aria-label={e ? `${e.title} — ${e.month} ${e.year} Edition` : "Edition"}
      onCancel={(ev) => {
        ev.preventDefault();
        requestClose();
      }}
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) requestClose();
      }}
      className={`fixed inset-0 m-0 h-dvh max-h-none w-dvw max-w-none overflow-hidden p-0 transition-[background-color,backdrop-filter] duration-300 backdrop:bg-transparent ${
        visible ? "bg-ink/55 backdrop-blur-[3px]" : "bg-ink/0"
      }`}
    >
      {e ? (
        <div
          className="flex size-full items-center justify-center px-4"
          onClick={(ev) => {
            if (ev.target === ev.currentTarget) requestClose();
          }}
        >
          <button
            type="button"
            onClick={requestClose}
            className={`absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/90 text-ink shadow-md transition-opacity duration-300 hover:bg-white ${visible ? "opacity-100" : "opacity-0"}`}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          {/* The book. On wider screens it slides right as it opens so the
              two-page spread ends up centred. */}
          <div
            className={`relative aspect-[3/4] w-[min(86vw,380px,calc((100dvh-6rem)*0.75))] [perspective:1800px] transition-[transform,opacity] duration-700 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none ${
              visible ? "opacity-100" : "opacity-0"
            } ${flipped ? "sm:translate-x-1/2" : ""} ${visible ? "scale-100" : "scale-90"}`}
          >
            {/* Inside right page */}
            <section className="absolute inset-0 flex flex-col overflow-hidden rounded-r-md bg-card shadow-2xl">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/10 to-transparent" />
              <div className="flex-1 overflow-y-auto p-5 pl-7 sm:p-6 sm:pl-8">
                <p className="text-[11px] font-bold uppercase tracking-wider text-marigold-deep">
                  {e.month} {e.year} Edition{e.current ? " · This month" : ""}
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold leading-tight">{e.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{e.blurb}</p>

                <ol className="mt-4 divide-y divide-line border-y border-line">
                  {e.books.map((bk) => (
                    <li key={bk.title} className="flex items-start justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="font-display text-[0.95rem] font-semibold leading-snug">{bk.title}</p>
                        <p className="text-xs text-ink-soft">
                          {bk.author} · Ages {bk.ages}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold">{rupees(bk.price)}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="border-t border-line bg-paper p-4 pl-7 sm:pl-8">
                <div className="mb-3 flex items-baseline justify-between text-sm">
                  <span className="text-ink-soft">{e.books.length} books · approx.</span>
                  <span className="font-display text-lg font-semibold">{rupees(total)}</span>
                </div>
                <a
                  href={amazonCartUrl(e.books, `${e.title} children's books`)}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-marigold px-5 py-3 font-bold text-ink shadow-[0_4px_0_0_var(--color-marigold-deep)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_1px_0_0_var(--color-marigold-deep)]"
                >
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="9" cy="20" r="1.5" />
                    <circle cx="18" cy="20" r="1.5" />
                    <path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.5L21 8H6" />
                  </svg>
                  Buy all on Amazon
                </a>
                <Link
                  href={`/reading-preferences?edition=${e.slug}`}
                  className="mt-2 block text-center text-sm font-semibold text-ink-soft underline decoration-line underline-offset-4 hover:text-ink"
                >
                  Personalise this Edition for my child
                </Link>
                <p className="mt-2 text-center text-[10px] leading-snug text-ink-soft/80">
                  Prices are approximate; final price on Amazon.in. We earn from qualifying purchases.
                </p>
              </div>
            </section>

            {/* Front cover: flips open around its left edge */}
            <div
              className={`absolute inset-0 origin-left [transform-style:preserve-3d] transition-[transform,opacity] duration-[900ms] ease-[cubic-bezier(.6,.05,.25,1)] motion-reduce:transition-none ${
                flipped ? "[transform:rotateY(-178deg)] max-sm:opacity-0 max-sm:delay-500" : "[transform:rotateY(0deg)]"
              }`}
            >
              <div className="absolute inset-0 overflow-hidden rounded-r-md shadow-2xl [backface-visibility:hidden]">
                <EditionCover art={e.art} title={e.title} />
              </div>
              {/* Inside of the cover (left page once open) */}
              <div className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-l-md bg-paper-deep p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black/10 to-transparent" />
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-ink font-display font-bold text-marigold">K</span>
                  <span className="font-display text-lg font-semibold">KutuBooku</span>
                </div>
                <div>
                  <p className="font-display text-5xl font-semibold leading-none text-ink/15">
                    {e.month.slice(0, 3)}
                    <br />
                    {e.year}
                  </p>
                  <p className="mt-4 font-script text-2xl leading-tight text-ink-soft">
                    This Edition belongs to
                    <br />a curious reader.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
