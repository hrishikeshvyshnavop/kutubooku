"use client";

// /books: every book on the shelf.
// - Filters (decision 2026-11-04): search, one age band, any number of interests, as chips above
//   the grid. The active child's age is picked to start with; parents can switch it off.
//   Filters live in the URL (?age=3-5&into=animals,feelings&q=dot) so a filtered list can be shared.
// - Cards: the same tall colour cards as /curation. Tapping a card opens the book sheet;
//   the main button adds the book to the box for the child shown in the header (B1/B6),
//   or "your box" when nobody is picked.

import { useEffect, useState } from "react";
import { MOCK_BOOKS } from "../_data/curation-mock";
import { ageBand, ageOf } from "../_data/questions";
import { BookCard } from "../curation/BookCard";
import { TAG_SHORT } from "../curation/card-style";
import { activeOf, displayName, useChildren } from "../_lib/children";
import { useCardBox } from "../_components/useCardBox";
import { useSession } from "../_lib/session";
import { CheckIcon } from "../_components/CheckIcon";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]";
const CHIP = `inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-[15px] font-semibold transition-colors ${FOCUS}`;

const BANDS = [
  { id: "0-2", min: 0, max: 2 },
  { id: "3-5", min: 3, max: 5 },
  { id: "6-8", min: 6, max: 8 },
  { id: "9-12", min: 9, max: 12 },
  { id: "13-14", min: 13, max: 14 },
] as const;
type BandId = (typeof BANDS)[number]["id"];

const fitsBand = (b: { ageMin: number; ageMax: number }, band: BandId) => {
  const r = BANDS.find((x) => x.id === band)!;
  return b.ageMin <= r.max && b.ageMax >= r.min;
};

// Interests on the shelf, most common first.
const INTERESTS = Object.entries(
  MOCK_BOOKS.flatMap((b) => b.tags).reduce<Record<string, number>>((m, t) => ({ ...m, [t]: (m[t] ?? 0) + 1 }), {}),
)
  .filter(([t]) => TAG_SHORT[t])
  .sort((a, b) => b[1] - a[1])
  .map(([t]) => t);

/** A child's age band today (their age counts up from when it was given). */
function bandOf(a: Record<string, string | string[]> | undefined): BandId | null {
  const age = ageOf(a);
  return age === null ? null : (ageBand(age) as BandId);
}

type Filters = { age: BandId | null; into: string[]; q: string };

function readUrl(): Partial<Filters> & { hasAge: boolean } {
  const p = new URLSearchParams(window.location.search);
  const age = p.get("age");
  return {
    hasAge: p.has("age"),
    age: BANDS.some((b) => b.id === age) ? (age as BandId) : null,
    into: (p.get("into") ?? "").split(",").filter((t) => TAG_SHORT[t]),
    q: p.get("q") ?? "",
  };
}

function writeUrl(f: Filters) {
  const url = new URL(window.location.href);
  const set = (k: string, v: string) => (v ? url.searchParams.set(k, v) : url.searchParams.delete(k));
  set("age", f.age ?? "all");
  set("into", f.into.join(","));
  set("q", f.q.trim());
  window.history.replaceState(window.history.state, "", url);
}

export function Catalogue() {
  const session = useSession();
  const signedIn = Boolean(session);
  const kids = useChildren();
  const active = signedIn ? activeOf(kids) : null;

  const [f, setF] = useState<Filters>({ age: null, into: [], q: "" });
  const [ready, setReady] = useState(false);
  // Card buttons: "Add to {child}'s box" (shared with the home row).
  const { whoseBox, cardProps, toastEl } = useCardBox();

  // Start from the URL; with no age in it, the active child's age band (C: "pre-selected, can be switched off").
  const childBand = bandOf(active?.answers);
  useEffect(() => {
    // Wait for the session and the children store, so the active child's age can be the default.
    if (session === undefined || kids === null || ready) return;
    const u = readUrl();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL and the child store after hydration
    setF({ age: u.hasAge ? u.age ?? null : childBand, into: u.into ?? [], q: u.q ?? "" });
    setReady(true);
  }, [session, kids, ready, childBand]);

  useEffect(() => {
    if (ready) writeUrl(f);
  }, [f, ready]);


  const q = f.q.trim().toLowerCase();
  const matchesText = (b: (typeof MOCK_BOOKS)[number]) =>
    !q || `${b.title} ${b.subtitle ?? ""} ${b.author} ${b.illustrator ?? ""}`.toLowerCase().includes(q);
  const matchesInto = (b: (typeof MOCK_BOOKS)[number]) => !f.into.length || f.into.some((t) => b.tags.includes(t));
  const shown = MOCK_BOOKS.filter((b) => matchesText(b) && matchesInto(b) && (!f.age || fitsBand(b, f.age)));
  // Counts on the age chips (with the other filters applied), so empty bands are obvious.
  const bandCount = (band: BandId) => MOCK_BOOKS.filter((b) => matchesText(b) && matchesInto(b) && fitsBand(b, band)).length;

  const filtered = Boolean(f.age || f.into.length || q);

  const toggleInto = (t: string) => setF((x) => ({ ...x, into: x.into.includes(t) ? x.into.filter((y) => y !== t) : [...x.into, t] }));

  return (
    <main className="mx-auto w-full max-w-[1920px] flex-1 px-5 pb-20 pt-8 sm:px-10 sm:pt-12 lg:px-[6%]">
      <p className="w-fit -rotate-3 font-[family-name:var(--font-caveat)] text-[28px] leading-none text-[#3b308f] sm:text-[36px]">our whole shelf</p>
      <h1 className="mt-3 type-display">All books</h1>
      <p className="mt-3 max-w-2xl type-body-lg text-[#1d2838]/70">
        Every book our curators have picked. Tap one to look inside, or add it to {whoseBox}.
      </p>

      {/* Filters */}
      <section aria-label="Filter books" className="mt-8 flex flex-col gap-4">
        <label className="relative block max-w-xl">
          <span className="sr-only">Search by title or author</span>
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[#1d2838]/50" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          <input
            type="search"
            value={f.q}
            onChange={(e) => setF((x) => ({ ...x, q: e.target.value }))}
            placeholder="Search by title or author"
            className="h-14 w-full rounded-full bg-white pl-13 pr-5 text-lg outline-none ring-1 ring-[#1d2838]/10 placeholder:text-[#1d2838]/40 focus:ring-2 focus:ring-[#1d2838]"
            style={{ paddingLeft: 52 }}
          />
        </label>

        {/* Phones: each chip row is one line that scrolls sideways, so its height never changes when
            the child's age chip fills in after loading (no layout shift). Wider screens wrap. */}
        <div role="radiogroup" aria-label="Age" className="-mx-5 flex items-center gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&>*]:shrink-0">
          <span className="mr-1 text-[15px] font-semibold text-[#1d2838]/60">Age</span>
          {[null, ...BANDS.map((b) => b.id)].map((id) => {
            const on = f.age === id;
            const n = id ? bandCount(id) : null;
            const isChild = id !== null && id === childBand && active;
            return (
              <button
                key={id ?? "all"}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={n === 0 && !on}
                onClick={() => setF((x) => ({ ...x, age: id }))}
                className={`${CHIP} disabled:opacity-35 ${on ? "bg-[#1d2838] text-white" : "bg-white hover:bg-[#ece3d3]"}`}
              >
                {on && <CheckIcon className="size-4" />}
                {id ? `${id.replace("-", "–")} yrs` : "All ages"}
                {isChild ? <span className={on ? "text-white/70" : "text-[#1d2838]/50"}>· {displayName(active.name)}</span> : null}
              </button>
            );
          })}
        </div>

        <div role="group" aria-label="Interests" className="-mx-5 flex items-center gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&>*]:shrink-0">
          <span className="mr-1 text-[15px] font-semibold text-[#1d2838]/60">Into</span>
          {INTERESTS.map((t) => {
            const on = f.into.includes(t);
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                onClick={() => toggleInto(t)}
                className={`${CHIP} ${on ? "bg-[#1d2838] text-white" : "bg-white hover:bg-[#ece3d3]"}`}
              >
                {on && <CheckIcon className="size-4" />}
                {TAG_SHORT[t]}
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
        <p id="books-count" aria-live="polite" className="type-body font-semibold">
          {shown.length} {shown.length === 1 ? "book" : "books"}
          {filtered ? <span className="font-normal text-[#1d2838]/60"> of {MOCK_BOOKS.length}</span> : null}
        </p>
        {filtered ? (
          <button type="button" onClick={() => setF({ age: null, into: [], q: "" })} className={`rounded text-[15px] font-semibold underline underline-offset-4 ${FOCUS}`}>
            Clear filters
          </button>
        ) : null}
      </div>

      {!ready ? (
        <div className="mt-5 h-[60vh]" aria-busy />
      ) : shown.length ? (
        <ul className="mt-5 grid gap-x-5 gap-y-7 px-1 pt-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {shown.map((b, i) => (
            <li key={b.id} className="[perspective:1400px]">
              <BookCard
                book={b}
                index={i}
                href={`/books/${b.id}`}
                {...cardProps(b.id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-10 rounded-[36px] bg-[#fffdf8] px-6 py-14 text-center">
          <p className="type-display-sm">No books match that yet</p>
          <p className="mt-3 type-body-lg text-[#1d2838]/65">Try another age or fewer interests. Our curators add new books every month.</p>
          <button type="button" onClick={() => setF({ age: null, into: [], q: "" })} className={`mt-8 h-14 rounded-full bg-[#1d2838] px-7 type-button text-white ${FOCUS}`}>
            Show all books
          </button>
        </div>
      )}

      {toastEl}
    </main>
  );
}
