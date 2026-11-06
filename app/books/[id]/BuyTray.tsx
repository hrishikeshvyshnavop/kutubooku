"use client";

// Floating buy tray on the book page (grey tray, bottom-right), now box-aware (docs/CONTEXT.md §15):
// - "Add to box" → toast "Added · View box" + header badge (C6); turns into "In box".
// - Primary: "Buy now · ₹399" buys only this book, straight to Amazon (2026-11-05), whatever else is
//   in the box (the box is left as it is and later asks "Did you order …?" about this book).
//   Buying everything together happens from the box.
// - "Who's this for?" is asked once per visit when we know a child (C9): every reader in the
//   account (app/_lib/children.ts), or the questionnaire's name before signing in.
//   "+ Someone new" runs the questions for a new reader, puts this book in their box and
//   comes back here.
// - Per child (B1/B2): the toast says whose box it went to, with "Change" (moves that book);
//   the button says "In Meera's box" (with a tick) with "+ Add for Aarav too" underneath.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { childNameOf, readAnswers } from "../../_components/curation/ui";
import { MAX_CHILDREN, activeOf, displayName, readFor, setFor, useChildren } from "../../_lib/children";
import { useSession } from "../../_lib/session";
import { rupees } from "../../_lib/amazon";
import { addToBox, boxKey, buyThisBook, moveItem, useBox } from "../../_lib/box";
import { flyToBox } from "../../_lib/fly";
import { book3DFor } from "../../_components/Book3D";
import { CheckIcon } from "../../_components/CheckIcon";
import type { MockBook } from "../../_data/curation-mock";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";
const VIOLET = "bg-[#9a83de] text-white transition-colors group-hover:bg-[#8670cc]";

/** What the "Who's this for?" chooser is for: a new add, moving the last add (Change), or adding for another child. */
type Action = "add" | "change" | "another";

const whose = (child: string | null) => (child ? `${child}'s box` : "the box");

export function BuyTray({
  book,
  placement = "fixed",
  child: knownChild,
}: {
  book: MockBook;
  placement?: "fixed" | "sticky";
  /** Set by the listing's sheet: the curation's child, so there's nothing to ask. */
  child?: string | null;
}) {
  const router = useRouter();
  const box = useBox();
  const [draftName, setDraftName] = useState("");
  const [asking, setAsking] = useState<Action | null>(null);
  // The last add, for the toast and its "Change" (B1). null = no toast.
  const [toast, setToast] = useState<{ child: string | null; n: number } | null>(null);
  const signedIn = Boolean(useSession());
  const kids = useChildren();

  useEffect(() => {
    setDraftName(childNameOf(readAnswers())); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  // Readers to choose from: the account's children (active one first), or the draft's name.
  const active = activeOf(kids);
  const names =
    signedIn && kids?.list.length
      ? [...kids.list].sort((a, b) => Number(b.id === active?.id) - Number(a.id === active?.id)).map((c) => displayName(c.name))
      : draftName
        ? [draftName]
        : [];
  const roomForNew = !signedIn || (kids?.list.length ?? 0) < MAX_CHILDREN;

  /** "+ Someone new": the questions for a new reader, then this book goes in their box and we come back. */
  const someoneNew = () => {
    const back = window.location.pathname + window.location.search;
    router.push(`/reading-preferences?new=1&add=${encodeURIComponent(book.id)}&next=${encodeURIComponent(back)}`);
  };

  useEffect(() => {
    if (!toast || asking === "change") return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast, asking]);

  // Who already has this book (B2).
  const holders = (box?.items ?? []).filter((i) => i.bookId === book.id).map((i) => i.child);
  const inBox = holders.length > 0;
  const missing = names.filter((n) => !holders.includes(n));
  const inLabel =
    holders.length === 1 ? (holders[0] ? `In ${holders[0]}'s box` : "In box") : `In box · ${holders.map((h) => h ?? "anyone").join(", ")}`;

  const trayRef = useRef<HTMLDivElement>(null);

  const run = (action: Action, child: string | null) => {
    if (action === "change") {
      // B1: the last book goes to another child instead; later adds follow.
      if (toast) moveItem(boxKey(book.id, toast.child), child);
      setToast({ child, n: (toast?.n ?? 0) + 1 });
      return;
    }
    addToBox(book.id, child, "book");
    flyToBox({ bookId: book.id, cover: book.cover, from: trayRef.current, ratio: book3DFor(book.cover, book.title, book.tone).ratio });
    setToast({ child, n: (toast?.n ?? 0) + 1 });
  };

  const start = (action: Action) => {
    if (knownChild !== undefined) return run(action, knownChild);
    const saved = readFor();
    if (!names.length) return run(action, null); // no child known yet: nothing to ask
    if (saved !== undefined && (saved === null || names.includes(saved))) return run(action, saved);
    setAsking(action);
  };

  const choose = (child: string | null) => {
    const action = asking!;
    // "Add for another child" is a one-off; the others set who this visit's books are for.
    if (action !== "another") setFor(child);
    setAsking(null);
    run(action, child);
  };

  // Who the chooser offers, by what it's for.
  const choices: string[] =
    asking === "change" ? names.filter((n) => n !== toast?.child) : asking === "another" ? missing : names;
  const offerNew = roomForNew && asking !== "change";
  const offerBrowsing = asking !== "another" && !(asking === "change" && toast?.child === null);


  return (
    // "sticky": inside the listing's sheet, which scrolls on its own; pinned to the sheet's bottom-right.
    <div
      className={
        placement === "fixed"
          ? "fixed inset-x-4 bottom-4 z-30 sm:inset-x-auto sm:bottom-8 sm:right-8"
          : "pointer-events-none sticky bottom-4 z-30 mx-4 flex justify-end sm:bottom-8 sm:mx-8 [&>*]:pointer-events-auto"
      }
    >
      <div className={placement === "sticky" ? "w-full sm:w-auto" : undefined}>
      {/* C6: toast above the tray */}
      <div role="status" aria-live="polite" className="pointer-events-none mb-2 flex justify-end">
        {toast && (
          <p key={toast.n} className="pointer-events-auto flex animate-q-in items-center gap-2 rounded-full bg-black py-2 pl-4 pr-2 text-[15px] font-semibold text-white shadow-lg">
            <span className="mr-1">Added to {whose(toast.child)}</span>
            {knownChild === undefined && names.length > 0 && (
              <button type="button" onClick={() => setAsking("change")} className={`rounded-full bg-white/15 px-3 py-1.5 hover:bg-white/25 ${FOCUS}`}>
                Change
              </button>
            )}
            <Link href="/box" className={`rounded-full bg-white/15 px-3 py-1.5 hover:bg-white/25 ${FOCUS}`}>
              View box
            </Link>
          </p>
        )}
      </div>

      <div className="rounded-xl bg-[#f2f2f2] p-3 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.35)] sm:p-4">
        {/* C9: "Who's this for?", once per visit */}
        {asking && (
          <div role="group" aria-label="Who's this book for?" className="mb-3 flex flex-wrap items-center gap-2">
            <p className="mr-1 text-[15px] font-semibold">
              {asking === "change" ? "Move it to" : asking === "another" ? "Add it for" : "Who\u2019s this for?"}
            </p>
            {choices.map((n, i) => (
              <button key={n} type="button" onClick={() => choose(n)} className={`h-10 rounded-full px-4 text-[15px] font-semibold ${i === 0 ? "bg-black text-white hover:bg-black/85" : "border-2 border-black bg-white hover:bg-black/5"} ${FOCUS}`}>
                {n}
              </button>
            ))}
            {offerNew && (
              <button type="button" onClick={someoneNew} className={`h-10 rounded-full border-2 border-dashed border-black/30 px-4 text-[15px] font-semibold hover:border-black ${FOCUS}`}>
                + Someone new
              </button>
            )}
            {offerBrowsing && (
              <button type="button" onClick={() => choose(null)} className={`h-10 rounded-full border-2 border-black/15 px-4 text-[15px] font-semibold hover:border-black ${FOCUS}`}>
                {asking === "change" ? "For anyone" : "Just browsing"}
              </button>
            )}
            <button type="button" onClick={() => setAsking(null)} aria-label="Cancel" className={`ml-auto grid size-10 place-items-center rounded-full text-black/50 hover:text-black ${FOCUS}`}>
              ×
            </button>
          </div>
        )}

        <div ref={trayRef} className="flex gap-2">
          {/* Stable landing spot for the flying book (app/_lib/fly.ts): the button inside swaps on add. */}
          <span data-box-target="tray" className="flex shrink-0 rounded-lg">
          {inBox ? (
            <Link
              href="/box"
              aria-label={`${inLabel}. View box`}
              className={`flex h-14 max-w-[260px] shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 text-lg font-bold tracking-[-0.3px] text-black hover:bg-white/70 max-sm:w-14 max-sm:px-0 ${FOCUS}`}
            >
              <CheckIcon className="size-5 text-[#2e7a58]" />
              <span className="truncate max-sm:hidden">{inLabel}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => start("add")}
              aria-label="Add to box"
              className={`flex h-14 shrink-0 items-center justify-center gap-2 rounded-lg border-2 border-black/15 bg-white px-4 text-lg font-bold tracking-[-0.3px] text-black transition-colors hover:border-black max-sm:w-14 max-sm:px-0 ${FOCUS}`}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3.5 8.5 12 4l8.5 4.5v9L12 22l-8.5-4.5z" />
                <path d="M3.5 8.5 12 13l8.5-4.5M12 13v9M7.8 6.2l8.5 4.6" />
              </svg>
              <span className="max-sm:hidden">Add to box</span>
            </button>
          )}
          </span>

          {/* Primary: buy just this book now (opens Amazon in a new tab). */}
          <button
            type="button"
            onClick={() => buyThisBook(book, "book")}
            aria-label={`Buy now on Amazon, ${rupees(book.price)}`}
            className={`group flex h-14 min-w-0 flex-1 items-stretch gap-0.5 ${FOCUS}`}
          >
            <span className={`flex min-w-0 flex-1 items-center justify-center truncate rounded-lg px-5 text-xl font-bold leading-none tracking-[-0.48px] max-sm:px-3 max-sm:text-lg ${VIOLET}`}>
              Buy now · {rupees(book.price)}
            </span>
            <span className={`grid w-14 shrink-0 place-items-center rounded-lg ${VIOLET}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/arrow-right-white.svg" alt="" width={18.6562} height={16} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        </div>

        {/* B2: already in one child's box: one tap to add it for a brother or sister too. */}
        {inBox && knownChild === undefined && missing.length > 0 && !asking && (
          <button
            type="button"
            onClick={() => (missing.length === 1 ? run("another", missing[0]) : setAsking("another"))}
            className={`mt-2 rounded px-1 text-[15px] font-semibold link-underline-on hover:text-black/70 ${FOCUS}`}
          >
            + Add for {missing.length === 1 ? `${missing[0]} too` : "another child"}
          </button>
        )}
      </div>
      </div>
    </div>
  );
}
