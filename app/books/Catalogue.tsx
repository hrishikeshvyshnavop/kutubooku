"use client";

// /books: every book on the shelf.
// - Filters (decision 2026-11-04, price/format/personality 2026-11-05): search, one age band,
//   one price band, any number of formats, personalities and interests. Every option shows how
//   many books it would leave (with the other filters on); options that would leave none are greyed out.
//   Desktop (lg+): a sticky sidebar on the left of the grid (age as a list with counts, interests
//   as wrapping chips). Phones/tablets: the same controls as chip rows above the grid. The active child's age is picked to start with; parents can switch it off.
//   Filters live in the URL (?age=3-5&price=under-400&format=board&trait=brave&into=animals&q=dot)
//   so a filtered list can be shared.
// - Clear filters sits at the top of the filter section.
// - Cards: the same tall colour cards as /curation. Tapping a card opens the book sheet;
//   the main button adds the book to the box for the child shown in the header (B1/B6),
//   or "your box" when nobody is picked.

import { useEffect, useRef, useState } from "react";
import { MOCK_BOOKS, type BookFormat } from "../_data/curation-mock";
import { rupees } from "../_lib/amazon";
import { ageBand, ageOf } from "../_data/questions";
import { BookCard } from "../curation/BookCard";
import { TAG_SHORT } from "../curation/card-style";
import { activeOf, displayName, useChildren } from "../_lib/children";
import { useCardBox } from "../_components/useCardBox";
import { useSession } from "../_lib/session";
import { CheckIcon } from "../_components/CheckIcon";
import { localTransition } from "../_lib/local-transition";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]";
// Chip press: a quick squeeze, colours ease over (not a hard swap).
const CHIP = `inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-[15px] font-semibold transition-[background-color,color,scale] duration-200 ease-out active:scale-[0.94] motion-reduce:active:scale-100 ${FOCUS}`;

/** The tick on a selected chip: it grows in from nothing with a small overshoot, so the chip widens
 *  smoothly instead of jumping. Always mounted; the negative margin cancels the chip's gap when hidden. */
function Tick({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid transition-[grid-template-columns,opacity,margin] duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] motion-reduce:transition-none ${
        on ? "grid-cols-[1fr] opacity-100" : "-mr-1.5 grid-cols-[0fr] opacity-0 lg:-mr-1"
      }`}
    >
      <span className="min-w-0 overflow-hidden">
        <CheckIcon className={`size-4 transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] motion-reduce:transition-none ${on ? "scale-100" : "scale-50"}`} />
      </span>
    </span>
  );
}

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

// Price bands (₹). Shelf today: ₹349–₹499, mostly ₹399.
const PRICES = [
  { id: "under-400", label: `Under ${rupees(400)}`, min: 0, max: 399 },
  { id: "400-499", label: `${rupees(400)}–${rupees(499)}`, min: 400, max: 499 },
  { id: "500-up", label: `${rupees(500)} and up`, min: 500, max: Infinity },
] as const;
type PriceId = (typeof PRICES)[number]["id"];
const fitsPrice = (b: { price: number }, id: PriceId) => {
  const r = PRICES.find((x) => x.id === id)!;
  return b.price >= r.min && b.price <= r.max;
};

// Formats, youngest first. URL ids are short.
const FORMATS: { id: string; label: BookFormat }[] = [
  { id: "board", label: "Board book" },
  { id: "picture", label: "Picture book" },
  { id: "paperback", label: "Paperback" },
  { id: "hardcover", label: "Hardcover" },
];
const formatLabel = (id: string) => FORMATS.find((x) => x.id === id)?.label;

// Personality: the kind of child a book speaks to / helps grow, from the curators' themes.
const TRAITS = [
  { id: "brave", label: "Brave", themes: ["courage", "resilience", "perseverance", "growth mindset"] },
  { id: "kind", label: "Kind", themes: ["empathy", "compassion", "kindness", "helpfulness", "friendship", "inclusion"] },
  { id: "curious", label: "Curious", themes: ["curiosity", "imagination", "creativity"] },
  { id: "calm", label: "Calm", themes: ["mindfulness", "emotional literacy", "feelings"] },
] as const;
const fitsTrait = (b: { themes: string[] }, id: string) => {
  const t = TRAITS.find((x) => x.id === id);
  return Boolean(t && b.themes.some((th) => (t.themes as readonly string[]).includes(th.toLowerCase())));
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

type Filters = { age: BandId | null; price: PriceId | null; format: string[]; trait: string[]; into: string[]; q: string };
const NONE: Filters = { age: null, price: null, format: [], trait: [], into: [], q: "" };

function readUrl(): Partial<Filters> & { hasAge: boolean } {
  const p = new URLSearchParams(window.location.search);
  const age = p.get("age");
  return {
    hasAge: p.has("age"),
    age: BANDS.some((b) => b.id === age) ? (age as BandId) : null,
    price: PRICES.some((x) => x.id === p.get("price")) ? (p.get("price") as PriceId) : null,
    format: (p.get("format") ?? "").split(",").filter((t) => formatLabel(t)),
    trait: (p.get("trait") ?? "").split(",").filter((t) => TRAITS.some((x) => x.id === t)),
    into: (p.get("into") ?? "").split(",").filter((t) => TAG_SHORT[t]),
    q: p.get("q") ?? "",
  };
}

function writeUrl(f: Filters) {
  const url = new URL(window.location.href);
  const set = (k: string, v: string) => (v ? url.searchParams.set(k, v) : url.searchParams.delete(k));
  set("age", f.age ?? "all");
  set("price", f.price ?? "");
  set("format", f.format.join(","));
  set("trait", f.trait.join(","));
  set("into", f.into.join(","));
  set("q", f.q.trim());
  window.history.replaceState(window.history.state, "", url);
}

/** Sticky top for a sidebar that may be taller than the screen: 24px when it fits, otherwise
 *  negative, so it sticks once its bottom edge (24px gap) reaches the bottom of the screen. */
function useStickySidebar() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const GAP = 24;
    const set = () => {
      el.style.top = `${Math.min(GAP, window.innerHeight - el.offsetHeight - GAP)}px`;
    };
    const ro = new ResizeObserver(set);
    ro.observe(el);
    window.addEventListener("resize", set);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", set);
    };
  }, []);
  return ref;
}

export function Catalogue() {
  const sidebarRef = useStickySidebar();
  const session = useSession();
  const signedIn = Boolean(session);
  const kids = useChildren();
  const active = signedIn ? activeOf(kids) : null;

  const [f, setF] = useState<Filters>(NONE);
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
    setF({
      age: u.hasAge ? u.age ?? null : childBand,
      price: u.price ?? null,
      format: u.format ?? [],
      trait: u.trait ?? [],
      into: u.into ?? [],
      q: u.q ?? "",
    });
    setReady(true);
  }, [session, kids, ready, childBand]);

  useEffect(() => {
    if (ready) writeUrl(f);
  }, [f, ready]);


  const q = f.q.trim().toLowerCase();
  type Book = (typeof MOCK_BOOKS)[number];
  // One test per filter; an option's count applies every filter except its own group.
  const tests: Record<keyof Filters, (b: Book) => boolean> = {
    q: (b) => !q || `${b.title} ${b.subtitle ?? ""} ${b.author} ${b.illustrator ?? ""}`.toLowerCase().includes(q),
    age: (b) => !f.age || fitsBand(b, f.age),
    price: (b) => !f.price || fitsPrice(b, f.price),
    format: (b) => !f.format.length || f.format.some((id) => formatLabel(id) === b.format),
    trait: (b) => !f.trait.length || f.trait.some((id) => fitsTrait(b, id)),
    into: (b) => !f.into.length || f.into.some((t) => b.tags.includes(t)),
  };
  const passes = (b: Book, except?: keyof Filters) => (Object.keys(tests) as (keyof Filters)[]).every((k) => k === except || tests[k](b));
  const shown = MOCK_BOOKS.filter((b) => passes(b));
  const countWith = (except: keyof Filters, extra: (b: Book) => boolean) => MOCK_BOOKS.filter((b) => passes(b, except) && extra(b)).length;
  const bandCount = (band: BandId) => countWith("age", (b) => fitsBand(b, band));
  const priceCount = (id: PriceId) => countWith("price", (b) => fitsPrice(b, id));
  const formatCount = (id: string) => countWith("format", (b) => b.format === formatLabel(id));
  const traitCount = (id: string) => countWith("trait", (b) => fitsTrait(b, id));

  const activeCount = (f.age ? 1 : 0) + (f.price ? 1 : 0) + f.format.length + f.trait.length + f.into.length + (q ? 1 : 0);
  const filtered = Boolean(f.age || f.price || f.format.length || f.trait.length || f.into.length || q);

  // Filter changes animate the grid (localTransition): cards that drop out fade and shrink away,
  // the rest glide to their new places, newcomers fade in. Typing in search updates instantly.
  const animateTo = (next: React.SetStateAction<Filters>) => localTransition(() => setF(next));
  const toggle = (key: "format" | "trait", id: string) =>
    animateTo((x) => ({ ...x, [key]: x[key].includes(id) ? x[key].filter((y) => y !== id) : [...x[key], id] }));
  const toggleInto = (t: string) => animateTo((x) => ({ ...x, into: x.into.includes(t) ? x.into.filter((y) => y !== t) : [...x.into, t] }));

  return (
    <main className="mx-auto w-full max-w-[1920px] flex-1 px-page pb-20 pt-8 sm:pt-12">
      <p className="w-fit -rotate-3 font-[family-name:var(--font-caveat)] text-[28px] leading-none text-[#3b308f] sm:text-[36px]">our whole shelf</p>
      <h1 className="mt-3 type-display">All books</h1>
      <p className="mt-3 max-w-2xl type-body-lg text-[#1d2838]/70">
        Every book our curators have picked. Tap one to look inside, or add it to {whoseBox}.
      </p>

      <div className="mt-8 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-14">
      {/* Filters: chip rows above the grid on phones/tablets, a sticky sidebar on desktop.
          No inner scroll. Sticky offset (see useStickySidebar): fits the screen → sticks 24px from
          the top; taller → scrolls with the page until its last filter is in view, then sticks there. */}
      <section
        ref={sidebarRef}
        aria-label="Filter books"
        className="flex flex-col gap-4 lg:sticky lg:gap-5 lg:rounded-[28px] lg:bg-white lg:p-6 lg:ring-1 lg:ring-[#1d2838]/8"
      >
        {/* Header: "Filters" + Clear filters. Clear is only shown once something is filtered
            (kept in the layout, so nothing shifts). */}
        <div className="flex h-8 items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 type-body font-semibold">
            Filters
            {/* How many filters are on */}
            {activeCount ? (
              <span className="grid h-6 min-w-6 animate-q-in place-items-center rounded-full bg-[#1d2838] px-1.5 text-[13px] font-bold leading-none text-white tabular-nums">
                {activeCount}
              </span>
            ) : null}
          </h2>
          <button
            type="button"
            onClick={() => animateTo(NONE)}
            inert={!filtered}
            className={`rounded text-[14px] font-semibold leading-none text-[#1d2838]/70 link-underline-on transition-[opacity,color] duration-200 hover:text-[#1d2838] ${FOCUS} ${filtered ? "opacity-100" : "opacity-0"}`}
          >
            Clear all
          </button>
        </div>

        <label className="relative block max-w-xl lg:max-w-none">
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
            className="h-14 w-full rounded-full bg-white pl-13 lg:h-11 lg:bg-[#f4efe6] lg:text-base pr-5 text-lg outline-none ring-1 ring-[#1d2838]/10 placeholder:text-[#1d2838]/40 focus:ring-2 focus:ring-[#1d2838]"
            style={{ paddingLeft: 52 }}
          />
        </label>

        {/* Phones: each chip row is one line that scrolls sideways, so its height never changes when
            the child's age chip fills in after loading (no layout shift). Wider screens wrap. */}
        <div role="radiogroup" aria-label="Age" className="mx-[calc(var(--gutter)*-1)] flex items-center gap-2 overflow-x-auto px-page pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 lg:gap-1.5 [&>*]:shrink-0">
          <span className="mr-1 text-[15px] font-semibold text-[#1d2838]/60 lg:mb-0.5 lg:mr-0 lg:w-full">Age</span>
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
                onClick={() => animateTo((x) => ({ ...x, age: id }))}
                className={`${CHIP} disabled:opacity-35 lg:h-9 lg:gap-1 lg:px-3 lg:text-[14px] ${on ? "bg-[#1d2838] text-white" : "bg-white hover:bg-[#ece3d3] lg:bg-[#f4efe6] lg:hover:bg-[#ece3d3]"}`}
              >
                <Tick on={on} />
                {id ? `${id.replace("-", "–")} yrs` : "All ages"}
                {isChild ? <span className={on ? "text-white/70" : "text-[#1d2838]/50"}>· {displayName(active.name)}</span> : null}
                {/* Sidebar: how many books in each band, right-aligned */}
                {n !== null ? (
                  <span aria-hidden className={`hidden text-[13px] tabular-nums lg:inline ${on ? "text-white/70" : "text-[#1d2838]/45"}`}>
                    {n}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div role="group" aria-label="Personality" className="mx-[calc(var(--gutter)*-1)] flex items-center gap-2 overflow-x-auto px-page pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 lg:gap-1.5 [&>*]:shrink-0">
          <span className="mr-1 text-[15px] font-semibold text-[#1d2838]/60 lg:mb-0.5 lg:mr-0 lg:w-full">Personality</span>
          {TRAITS.map(({ id, label }) => {
            const on = f.trait.includes(id);
            const n = traitCount(id);
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                disabled={n === 0 && !on}
                onClick={() => toggle("trait", id)}
                className={`${CHIP} disabled:opacity-35 lg:h-9 lg:gap-1 lg:px-3 lg:text-[14px] ${on ? "bg-[#1d2838] text-white" : "bg-white hover:bg-[#ece3d3] lg:bg-[#f4efe6] lg:hover:bg-[#ece3d3]"}`}
              >
                <Tick on={on} />
                {label}
                <span aria-hidden className={`hidden text-[13px] tabular-nums lg:inline ${on ? "text-white/70" : "text-[#1d2838]/45"}`}>
                  {n}
                </span>
              </button>
            );
          })}
        </div>

        <div role="radiogroup" aria-label="Price" className="mx-[calc(var(--gutter)*-1)] flex items-center gap-2 overflow-x-auto px-page pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 lg:gap-1.5 [&>*]:shrink-0">
          <span className="mr-1 text-[15px] font-semibold text-[#1d2838]/60 lg:mb-0.5 lg:mr-0 lg:w-full">Price</span>
          {[null, ...PRICES.map((x) => x.id)].map((id) => {
            const on = f.price === id;
            const n = id ? priceCount(id) : null;
            return (
              <button
                key={id ?? "any"}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={n === 0 && !on}
                onClick={() => animateTo((x) => ({ ...x, price: id }))}
                className={`${CHIP} disabled:opacity-35 lg:h-9 lg:gap-1 lg:px-3 lg:text-[14px] ${on ? "bg-[#1d2838] text-white" : "bg-white hover:bg-[#ece3d3] lg:bg-[#f4efe6] lg:hover:bg-[#ece3d3]"}`}
              >
                <Tick on={on} />
                {id ? PRICES.find((x) => x.id === id)!.label : "Any price"}
                {n !== null ? (
                  <span aria-hidden className={`hidden text-[13px] tabular-nums lg:inline ${on ? "text-white/70" : "text-[#1d2838]/45"}`}>
                    {n}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div role="group" aria-label="Format" className="mx-[calc(var(--gutter)*-1)] flex items-center gap-2 overflow-x-auto px-page pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 lg:gap-1.5 [&>*]:shrink-0">
          <span className="mr-1 text-[15px] font-semibold text-[#1d2838]/60 lg:mb-0.5 lg:mr-0 lg:w-full">Format</span>
          {FORMATS.map(({ id, label }) => {
            const on = f.format.includes(id);
            const n = formatCount(id);
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                disabled={n === 0 && !on}
                onClick={() => toggle("format", id)}
                className={`${CHIP} disabled:opacity-35 lg:h-9 lg:gap-1 lg:px-3 lg:text-[14px] ${on ? "bg-[#1d2838] text-white" : "bg-white hover:bg-[#ece3d3] lg:bg-[#f4efe6] lg:hover:bg-[#ece3d3]"}`}
              >
                <Tick on={on} />
                {label}
                <span aria-hidden className={`hidden text-[13px] tabular-nums lg:inline ${on ? "text-white/70" : "text-[#1d2838]/45"}`}>
                  {n}
                </span>
              </button>
            );
          })}
        </div>

        <div role="group" aria-label="Interests" className="mx-[calc(var(--gutter)*-1)] flex items-center gap-2 overflow-x-auto px-page pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 lg:gap-1.5 [&>*]:shrink-0">
          <span className="mr-1 text-[15px] font-semibold text-[#1d2838]/60 lg:mb-0.5 lg:mr-0 lg:w-full">Into</span>
          {INTERESTS.map((t) => {
            const on = f.into.includes(t);
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                onClick={() => toggleInto(t)}
                className={`${CHIP} lg:h-9 lg:gap-1 lg:px-3 lg:text-[14px] ${on ? "bg-[#1d2838] text-white" : "bg-white hover:bg-[#ece3d3] lg:bg-[#f4efe6] lg:hover:bg-[#ece3d3]"}`}
              >
                <Tick on={on} />
                {TAG_SHORT[t]}
              </button>
            );
          })}
        </div>
      </section>

      {/* Results */}
      <div className="min-w-0">
      <p id="books-count" aria-live="polite" className="mt-8 type-body font-semibold lg:mt-0">
        {shown.length} {shown.length === 1 ? "book" : "books"}
        {filtered ? <span className="font-normal text-[#1d2838]/60"> of {MOCK_BOOKS.length}</span> : null}
      </p>

      {!ready ? (
        <div className="mt-5 h-[60vh]" aria-busy />
      ) : shown.length ? (
        <ul className="mt-5 grid gap-x-5 gap-y-7 px-1 pt-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {shown.map((b, i) => (
            <li key={b.id} className="[perspective:1400px]" data-vt-name={`cat-${b.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`} data-vt-class="cat-card">
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
          <button type="button" onClick={() => animateTo(NONE)} className={`mt-8 h-14 rounded-full bg-[#1d2838] px-7 type-button text-white ${FOCUS}`}>
            Show all books
          </button>
        </div>
      )}
      </div>
      </div>

      {toastEl}
    </main>
  );
}
