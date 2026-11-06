"use client";

// /box — the family book box (decisions C7–C24 in docs/CONTEXT.md §15; per child: B3–B5, B10).
// Query flags: ?demo=1 fills the box with sample books; ?shared=… shows a read-only shared box (C21).

import Image from "next/image";
import { Toast } from "../_components/Toast";
import Link from "next/link";
import { IntentLink } from "../_components/IntentLink";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { localTransition } from "../_lib/local-transition";
import { book3DFor } from "../_components/Book3D";
import { childNameOf, readAnswers } from "../_components/curation/ui";
import { isSignedIn, useSession } from "../_lib/session";
import { activeOf, displayName, useChildren } from "../_lib/children";
import { ReaderAvatar } from "../_components/ReaderAvatar";
import { CheckIcon } from "../_components/CheckIcon";
import { amazonCartUrl, rupees } from "../_lib/amazon";
import {
  BATCH_SIZE,
  MOCK_UNAVAILABLE,
  bookById,
  confirmOrdered,
  keepBox,
  markCheckoutStarted,
  monthKey,
  boxKey,
  moveItem,
  toBuy,
  type Scope,
  monthName,
  readShared,
  removeFromBox,
  seedDemoBox,
  setCopies,
  shareUrl,
  swapItem,
  track,
  useBox,
  type BoxItem,
  type BoxState,
} from "../_lib/box";

const INK = "#1d2838";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";
const AMBER_BLOCK = "bg-[#f9a220] text-black transition-colors group-hover:bg-[#e8900c]";
const QUIET_BTN = `inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-black/15 px-4 text-[15px] font-semibold transition-colors hover:border-black hover:bg-black/5 ${FOCUS}`;
const SIDE_PAD = "px-page";

/* ------------------------------- Derived data ------------------------------ */

type Group = { child: string | null; items: BoxItem[] };
type Line = { bookId: string; qty: number; price: number; title: string; author: string };

/** B10: the active child first, then the other children in the order they were added, "For anyone" last. */
function groupsOf(items: BoxItem[], order: string[]): Group[] {
  const map = new Map<string | null, BoxItem[]>();
  for (const i of items) map.set(i.child, [...(map.get(i.child) ?? []), i]);
  const rank = (c: string | null) => (c === null ? Infinity : order.includes(c) ? order.indexOf(c) : order.length);
  return [...map.entries()].sort(([a], [b]) => rank(a) - rank(b)).map(([child, items]) => ({ child, items }));
}

/**
 * What goes to Amazon: one line per book, 2+ copies only when the parent chose "one each" (C10).
 * Scoped to one child (B3): only their books, one copy each (a shared copy goes with them, B5).
 */
function linesOf(state: BoxState, scope?: Scope): Line[] {
  const byBook = new Map<string, number>();
  for (const i of state.items) {
    if (!toBuy(i)) continue; // C14 unavailable / B5 already bought as a shared copy
    if (scope && i.child !== scope.child) continue;
    byBook.set(i.bookId, (byBook.get(i.bookId) ?? 0) + 1);
  }
  return [...byBook.entries()].flatMap(([bookId, children]) => {
    const b = bookById(bookId);
    if (!b) return [];
    const qty = children > 1 && state.copies[bookId] === "each" ? children : 1;
    return [{ bookId, qty, price: b.price, title: b.title, author: b.author }];
  });
}


const chunk = <T,>(list: T[], size: number) =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Counts from the old value to the new one (ease-out), e.g. ₹2,893 → ₹3,292 on "Buy 2". */
function useTween(value: number, ms = 600) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const a = from.current;
    if (a === value) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = reduce ? 1 : Math.min(1, (t - start) / ms);
      const cur = a + (value - a) * (1 - Math.pow(1 - p, 3));
      from.current = cur;
      setShown(cur);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return Math.round(shown);
}

/** The box total: counts to the new amount, nudges, and floats the difference ("+ ₹399") beside it. */
function AnimatedTotal({ value, className = "" }: { value: number; className?: string }) {
  const shown = useTween(value);
  const [delta, setDelta] = useState<{ d: number; k: number } | null>(null);
  const prev = useRef(value);
  useEffect(() => {
    const d = value - prev.current;
    prev.current = value;
    if (!d) return;
    const raf = requestAnimationFrame(() => setDelta((x) => ({ d, k: (x?.k ?? 0) + 1 })));
    const t = setTimeout(() => setDelta(null), 1300);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [value]);
  return (
    <span className="relative inline-block tabular-nums">
      <span key={delta?.k ?? 0} className={`total-anim inline-block ${delta ? "animate-[total-nudge_450ms_cubic-bezier(0.34,1.56,0.64,1)]" : ""} ${className}`}>
        ≈ {rupees(shown)}
      </span>
      {delta && (
        <span
          key={`d${delta.k}`}
          aria-hidden
          className={`delta-anim pointer-events-none absolute right-full top-1/2 mr-2 -mt-3 animate-[delta-float_1.3s_ease-out_forwards] whitespace-nowrap rounded-full px-2 py-0.5 text-sm font-bold ${delta.d > 0 ? "bg-[#fff3d6] text-[#9a5b00]" : "bg-[#dcefe4] text-[#1f5c41]"}`}
        >
          {delta.d > 0 ? "+" : "−"} {rupees(Math.abs(delta.d))}
        </span>
      )}
    </span>
  );
}

/** "N books" that counts too. */
function AnimatedCount({ value, one }: { value: number; one: string }) {
  const n = useTween(value, 400);
  return <>{plural(n, one)}</>;
}

/* ---------------------------------- Page ---------------------------------- */

export function Box() {
  const router = useRouter();
  const box = useBox();
  const [shared, setShared] = useState<BoxState | null>(null);
  const [ordered, setOrdered] = useState<number | null>(null);
  const [childName, setChildName] = useState("");
  const [notice, setNotice] = useState("");
  // Signed in vs guest. ⚠️ Sign-in is simulated (sessionStorage), like the rest of the flow; real accounts are a dev-team task.
  const signedIn = Boolean(useSession());
  // C5: first visit after signing in with books already in this browser → "added to your account" note.
  const [merged, setMerged] = useState(false);
  // ?checkout=1 (from a book page's "Add & buy all N on Amazon"): open the handoff screen straight away.
  const [autoCheckout, setAutoCheckout] = useState(false);

  // Client-only reads: query flags and the questionnaire answers.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("demo") === "1") seedDemoBox();
    if (q.get("checkout") === "1") setAutoCheckout(true); // eslint-disable-line react-hooks/set-state-in-effect
    if (q.has("demo") || q.has("checkout")) router.replace("/box");
    const s = q.get("shared");
    if (s) setShared(readShared(s));
    setChildName(childNameOf(readAnswers()));
    const signed = isSignedIn();
    try {
      if (signed && sessionStorage.getItem(MERGED_KEY) !== "1") {
        sessionStorage.setItem(MERGED_KEY, "1");
        setMerged(true);
      }
    } catch {
      /* ignore */
    }
    track("box_view", { shared: Boolean(s), signedIn: signed });
  }, [router]);

  const state = shared ?? box;
  const readOnly = Boolean(shared);

  if (!state) return <Shell><div className="h-[50vh]" aria-busy /></Shell>;

  if (ordered !== null) return <Shell><Ordered count={ordered} /></Shell>;

  if (state.items.length === 0) return <Shell><Empty childName={childName} signedIn={signedIn} /></Shell>;

  return (
    <Shell>
      <BoxBody
        state={state}
        readOnly={readOnly}
        notice={notice}
        setNotice={setNotice}
        onOrdered={() => {
          const r = confirmOrdered();
          if (r.empty) setOrdered(r.count);
          else setNotice(`Marked ${plural(r.count, "book")} as bought`);
        }}
        autoCheckout={autoCheckout && !readOnly}
        signedIn={signedIn}
        merged={merged && state.items.length > 0}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className={`mx-auto w-full max-w-[1920px] pb-16 pt-8 sm:pt-12 ${SIDE_PAD}`}>{children}</div>;
}

/* ------------------------------- Filled box ------------------------------- */

function BoxBody({
  state,
  readOnly,
  notice,
  setNotice,
  onOrdered,
  autoCheckout,
  signedIn,
  merged,
}: {
  state: BoxState;
  readOnly: boolean;
  notice: string;
  setNotice: (s: string) => void;
  onOrdered: () => void;
  autoCheckout: boolean;
  signedIn: boolean;
  merged: boolean;
}) {
  const kids = useChildren();
  const list = useMemo(() => (signedIn ? kids?.list ?? [] : []), [signedIn, kids]);
  const active = activeOf(signedIn ? kids : null);
  const order = useMemo(() => {
    const names = list.map((c) => displayName(c.name));
    const a = active ? displayName(active.name) : null;
    return a ? [a, ...names.filter((n) => n !== a)] : names;
  }, [list, active]);
  const profileOf = (child: string | null) => list.find((c) => displayName(c.name) === child) ?? null;
  // "Move to…" targets (B4): every child in the account or the box, then "For anyone".
  const targets = useMemo(() => {
    const inBox = state.items.map((i) => i.child).filter((c): c is string => c !== null);
    return [...new Set([...order, ...inBox])];
  }, [order, state.items]);
  // Signed out (decided 2026-11-04): children's profiles are account data, so the box is one
  // plain list, each book once, no child groups / Move to… / "both have this".
  const flat = !signedIn && !readOnly;
  const view = useMemo<BoxState>(() => {
    if (!flat) return state;
    const seen = new Set<string>();
    const items = state.items.filter((i) => (seen.has(i.bookId) ? false : (seen.add(i.bookId), true)));
    return { ...state, items, copies: {} };
  }, [flat, state]);
  const groups = useMemo(
    () => (flat ? [{ child: null, items: view.items }] : groupsOf(state.items, order)),
    [flat, view.items, state.items, order],
  );
  const lines = useMemo(() => linesOf(view), [view]);
  const copies = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((n, l) => n + l.qty * l.price, 0);

  // Which children have each book (C10).
  const childrenOf = useMemo(() => {
    const m = new Map<string, (string | null)[]>();
    for (const i of state.items) m.set(i.bookId, [...(m.get(i.bookId) ?? []), i.child]);
    return m;
  }, [state.items]);

  // C23: books left over from an earlier month's Edition.
  const thisMonth = monthKey();
  const stale = state.items.filter((i) => i.edition && i.edition < thisMonth);
  const staleMonth = stale[0]?.edition;

  return (
    <>
      <p className="w-fit origin-bottom-left -rotate-3 font-[family-name:var(--font-caveat)] text-[28px] leading-none text-[#3b308f] sm:text-[36px]">
        {readOnly ? "shared with you" : "your box"}
      </p>
      <h1 className="mt-3 text-balance text-[clamp(44px,4.17vw,80px)] font-bold leading-[0.85] tracking-[-0.02em] sm:mt-4">
        {readOnly ? "A book list for the family" : "Books for the family"}
      </h1>
      <p className="mt-4 max-w-[640px] text-lg text-black/65">
        {readOnly
          ? "Someone picked these books on KutuBooku and shared them with you. You can buy them on Amazon.in."
          : `${plural(view.items.length, "book")} saved ${signedIn ? "to your account" : "in this browser"}. You'll pay and get delivery on Amazon.in.`}
      </p>

      {/* No standing notes about saving (decided 2026-11-04). Just after signing in, a toast says
          this browser's books were added to the account, once. */}
      {!readOnly && signedIn && merged && <MergedToast count={state.items.length} />}

      {!readOnly && state.pendingCheckout && (
        <DidYouOrder
          onYes={onOrdered}
          child={"child" in state.pendingCheckout ? state.pendingCheckout.child ?? "anyone" : undefined}
          book={state.pendingCheckout.bookId ? bookById(state.pendingCheckout.bookId)?.title : undefined}
        />
      )}

      {!readOnly && stale.length > 0 && staleMonth && (
        <p className="mt-6 flex items-start gap-3 rounded-2xl bg-white/60 px-5 py-4 text-[15px] font-medium">
          <span aria-hidden>📅</span>
          {plural(stale.length, "book")} from {monthName(staleMonth)}&apos;s Edition {stale.length === 1 ? "is" : "are"} still here.
        </p>
      )}

      <p role="status" aria-live="polite" className="sr-only">{notice}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start xl:gap-12">
        <div className="flex flex-col gap-6">
          {groups.map((g, gi) => {
            const id = `group-${g.child ?? "anyone"}`;
            const profile = profileOf(g.child);
            const groupLines = linesOf(state, { child: g.child });
            return (
              <section
                key={g.child ?? "anyone"}
                aria-labelledby={id}
                data-vt-name={vtName("group", g.child ?? "anyone")}
                data-vt-class="box-group"
                className="rounded-[28px] bg-white p-4 shadow-[0_24px_70px_rgba(29,40,56,0.08)] sm:rounded-[36px] sm:p-6"
              >
                <div className={`flex flex-wrap items-center gap-x-4 gap-y-3 px-1 ${flat ? "sr-only" : ""}`}>
                  {profile ? <ReaderAvatar child={profile} index={list.indexOf(profile)} size={44} round /> : null}
                  <div className="min-w-0 flex-1">
                    <h2 id={id} className="flex items-baseline gap-2 text-2xl font-bold tracking-[-0.02em] sm:text-3xl">
                      {flat ? "Your books" : g.child ? `For ${g.child}` : "For anyone"}
                      <span className="text-lg font-semibold text-black/45">({g.items.length})</span>
                    </h2>
                    {!g.child && !flat && <p className="text-[15px] text-black/55">Added while just browsing</p>}
                  </div>
                  {/* B3: buy just this child's books (only worth it when there's more than one group). */}
                  {!readOnly && groups.length > 1 && groupLines.length > 0 && (
                    <AmazonButton
                      lines={groupLines}
                      readOnly={readOnly}
                      scope={{ child: g.child }}
                      label={`Buy ${g.child ? `${g.child}'s` : "these"} books`}
                      variant="quiet"
                      autoOpen={false}
                      key={`buy-${gi}`}
                    />
                  )}
                </div>
                <ul className={`divide-y divide-black/8 ${flat ? "" : "mt-3"}`}>
                  {g.items.map((item) => (
                    <Row
                      key={item.key}
                      item={item}
                      readOnly={readOnly}
                      others={flat ? [] : (childrenOf.get(item.bookId) ?? []).filter((c) => c !== item.child)}
                      copies={state.copies[item.bookId] ?? "share"}
                      targets={targets.filter((t) => t !== item.child)}
                      flat={flat}
                      // Flat list: removing a book removes it for every child.
                      removeKeys={flat ? state.items.filter((i) => i.bookId === item.bookId).map((i) => i.key) : [item.key]}
                      setNotice={setNotice}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <Summary lines={lines} copies={copies} total={total} readOnly={readOnly} state={view} autoCheckout={autoCheckout} />
      </div>

      {/* Phones: the total and the Amazon button stay in reach. */}
      <MobileBar copies={copies} total={total} lines={lines} readOnly={readOnly} />
    </>
  );
}

/* ----------------------------------- Row ----------------------------------- */

function Row({
  item,
  readOnly,
  others,
  copies,
  targets,
  flat = false,
  removeKeys,
  setNotice,
}: {
  item: BoxItem;
  readOnly: boolean;
  others: (string | null)[];
  copies: "share" | "each";
  /** Children this book can move to (B4); "For anyone" is always offered too. */
  targets: string[];
  /** Signed out: one plain list, no children. */
  flat?: boolean;
  /** Rows "Remove" takes out (flat list: the book for every child). */
  removeKeys: string[];
  setNotice: (s: string) => void;
}) {
  // Moved here from another child: a short warm glow once it has landed.
  const [arrived] = useState(() => ARRIVING.has(item.key));
  useEffect(() => {
    if (!arrived) return;
    const t = setTimeout(() => ARRIVING.delete(item.key), 1200);
    return () => clearTimeout(t);
  }, [arrived, item.key]);
  const book = bookById(item.bookId);
  if (!book) return null;
  const unavailable = MOCK_UNAVAILABLE.has(book.id);
  // B5: covered by a shared copy bought with another child's books.
  const coveredBy = item.sharedBoughtWith;
  const covered = coveredBy !== undefined;
  const ratio = book3DFor(book.cover, book.title, book.tone).ratio;
  const otherNames = others.map((c) => c ?? "Anyone");
  const names = [item.child ?? "Anyone", ...otherNames];

  return (
    // A stable name per row (survives a move between children), so View Transitions can glide it.
    <li className="py-4 first:pt-2 last:pb-1" data-vt-name={vtName("row", `${item.bookId}-${item.addedAt}`)} data-vt-class="box-row">
      <div className={`-mx-2 rounded-2xl px-2 ${arrived ? "animate-[row-arrive_1.2s_ease-out_0.35s_both]" : ""}`}>
      <div className="flex gap-4">
        {/* Fixed 96px box so titles line up whatever the cover's shape. */}
        <IntentLink href={`/books/${book.id}`} className="flex size-24 shrink-0 items-end justify-center" tabIndex={-1} aria-hidden>
          <Image
            src={book.cover}
            alt=""
            width={Math.round(96 * ratio)}
            height={96}
            className={`max-h-24 w-auto max-w-24 rounded-r-md rounded-l-[3px] object-contain shadow-[0_10px_20px_-12px_rgba(29,40,56,0.6)] ${unavailable ? "opacity-40 grayscale" : ""}`}
          />
        </IntentLink>

        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
          <div className="min-w-0 flex-1">
            <IntentLink href={`/books/${book.id}`} className={`rounded text-lg font-bold leading-tight tracking-[-0.01em] link-underline ${FOCUS} ${unavailable ? "text-black/45" : ""}`}>
              {book.title}
            </IntentLink>
            <p className="text-[15px] text-black/60">{book.author}</p>
            <p className="mt-0.5 text-sm text-black/45">
              Ages {book.ageMin}–{book.ageMax} · {book.format}
              {item.edition && ` · From ${monthName(item.edition)}'s Edition`}
            </p>
          </div>

          <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
            {covered ? (
              <p className="rounded-full bg-[#dcefe4] px-3 py-1 text-sm font-semibold text-[#1f5c41]">
                Shared with {coveredBy ?? "the family"} · bought
              </p>
            ) : (
              <p className={`text-lg font-bold ${unavailable ? "text-black/35 line-through" : ""}`}>
                ≈ {rupees(book.price)}
              </p>
            )}
            {!readOnly && (
              <div className="flex items-center gap-3">
                {!covered && !flat && (
                  <MoveMenu
                    item={item}
                    title={book.title}
                    targets={targets}
                    onMove={(t) =>
                      animateBox(() => {
                        ARRIVING.add(boxKey(item.bookId, t));
                        moveItem(item.key, t);
                        setNotice(`Moved ${book.title} to ${t ? `${t}'s books` : "For anyone"}`);
                      })
                    }
                  />
                )}
                <button
                  type="button"
                  onClick={() =>
                    animateBox(() => {
                      removeKeys.forEach(removeFromBox);
                      setNotice(`Removed ${book.title}`);
                    })
                  }
                  className={`rounded text-sm font-semibold text-black/55 hover:text-black link-underline ${FOCUS}`}
                  aria-label={`${covered ? "Clear" : "Remove"} ${book.title}${item.child && !flat ? ` for ${item.child}` : ""}`}
                >
                  {covered ? "Clear" : "Remove"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* C14: unavailable — keep it, mark it, offer a swap. */}
      {unavailable && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-[#f4efe6] px-4 py-3 sm:ml-[112px]">
          <p className="flex-1 text-[15px] font-medium">
            Unavailable on Amazon.in right now. We won&apos;t send it.
          </p>
          {!readOnly && (
            <button
              type="button"
              onClick={() => {
                const next = swapItem(item.key);
                setNotice(next ? `Swapped ${book.title} for ${next.title}` : "No similar book found");
              }}
              className={QUIET_BTN}
            >
              Swap for a similar book
            </button>
          )}
        </div>
      )}

      {/* C10: the same book for two children — 1 to share (default) or 1 each. */}
      {!unavailable && !covered && others.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-[#fff3d6] px-4 py-3 sm:ml-[112px]">
          <p className="flex-1 text-[15px] font-medium">
            {listNames(names)} both have this.
          </p>
          {readOnly ? (
            <p className="text-[15px] font-semibold">{copies === "each" ? `${names.length} copies` : "1 copy to share"}</p>
          ) : (
            <div role="radiogroup" aria-label={`Copies of ${book.title}`} className="flex rounded-full bg-white p-1">
              {(["share", "each"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={copies === c}
                  onClick={() => setCopies(book.id, c)}
                  className={`h-9 rounded-full px-4 text-sm font-semibold transition-colors ${FOCUS} ${copies === c ? "bg-black text-white" : "text-black/65 hover:text-black"}`}
                >
                  {c === "share" ? "Buy 1 to share" : `Buy ${names.length}`}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </li>
  );
}

/** Keys of rows that were just moved here: they glow once after landing. */
const ARRIVING = new Set<string>();

/** CSS-safe view-transition-name. */
const vtName = (kind: string, id: string) => `${kind}-${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

/**
 * Remove / Move to… as one seamless motion (View Transitions, app/_lib/local-transition.ts): a moved
 * row glides from its spot into the other child's group, a removed one fades away while the rows
 * below slide up, and the group cards resize smoothly.
 */
const animateBox = localTransition;

/** B4: "Move to…": the book belongs to another child (or "For anyone"). */
function MoveMenu({ item, title, targets, onMove }: { item: BoxItem; title: string; targets: string[]; onMove: (to: string | null) => void }) {
  const kids = useChildren()?.list ?? [];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);
  const options: (string | null)[] = [...targets, ...(item.child !== null ? [null] : [])];
  if (!options.length) return null;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Move ${title} to another child`}
        className={`rounded text-sm font-semibold text-black/55 hover:text-black link-underline ${FOCUS}`}
      >
        Move to…
      </button>
      <ul id={menuId} hidden={!open} className="absolute right-0 top-[calc(100%+6px)] z-20 w-56 rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-black/8">
        {options.map((t) => (
          <li key={t ?? "anyone"}>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onMove(t);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-[15px] font-semibold hover:bg-[#fff3d6] ${FOCUS}`}
            >
              {/* The child's profile picture (or a neutral "anyone" mark), like the header and box groups. */}
              {(() => {
                const profile = t ? kids.find((c) => displayName(c.name) === t) : null;
                return profile ? (
                  <ReaderAvatar child={profile} index={kids.indexOf(profile)} size={32} round />
                ) : (
                  <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f4efe6] text-black/55">
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="8" r="3" />
                      <circle cx="16.5" cy="9.5" r="2.5" />
                      <path d="M3.5 19c.7-3 3-4.5 5.5-4.5s4.8 1.5 5.5 4.5M14.5 14.6c2.6-.4 5 .9 5.8 3.9" />
                    </svg>
                  </span>
                );
              })()}
              <span className="truncate">{t ? `For ${t}` : "For anyone"}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const listNames = (n: string[]) => (n.length <= 2 ? n.join(" and ") : `${n.slice(0, -1).join(", ")} and ${n.at(-1)}`);

/* --------------------------------- Summary --------------------------------- */

function Summary({ lines, copies, total, readOnly, state, autoCheckout }: { lines: Line[]; copies: number; total: number; readOnly: boolean; state: BoxState; autoCheckout: boolean }) {
  const [copied, setCopied] = useState(false);
  const trips = Math.ceil(copies / BATCH_SIZE);

  const share = async () => {
    const url = shareUrl(state.items, state.copies);
    track("box_share", { count: state.items.length });
    try {
      if (navigator.share) await navigator.share({ title: "Our KutuBooku book list", url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      /* share sheet closed */
    }
  };

  return (
    <aside aria-label="Box total" className="rounded-[28px] bg-white p-6 shadow-[0_24px_70px_rgba(29,40,56,0.08)] sm:rounded-[36px] sm:p-8 lg:sticky lg:top-24">
      <dl className="flex items-baseline justify-between gap-4">
        <dt className="text-lg font-semibold"><AnimatedCount value={copies} one="book" /> to buy</dt>
        {/* aria-live: the new total is read once, not every counting step */}
        <dd className="text-3xl font-bold tracking-[-0.02em]">
          <AnimatedTotal value={total} />
          <span className="sr-only" aria-live="polite">Total now about {rupees(total)}</span>
        </dd>
      </dl>
      {/* C13: always an approximate total, with a disclaimer. */}
      <p className="mt-2 text-sm text-black/55">
        Approximate. Prices change, and the final price and delivery are shown on Amazon.in.
      </p>

      {trips > 1 && (
        <p className="mt-4 rounded-2xl bg-[#fff3d6] px-4 py-3 text-[15px] font-medium">
          Amazon takes up to {BATCH_SIZE} books at a time, so this opens in {trips} trips.
        </p>
      )}

      <AmazonButton lines={lines} readOnly={readOnly} autoOpen={autoCheckout} className="mt-6 w-full" />

      {!readOnly && (
        <button type="button" onClick={share} className={`${QUIET_BTN} mt-3 w-full`}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" />
          </svg>
          {copied ? "Link copied" : "Share this list"}
        </button>
      )}

      <p className="mt-6 border-t border-black/8 pt-4 text-xs text-black/50">
        As an Amazon Associate, KutuBooku earns from qualifying purchases.
      </p>
    </aside>
  );
}

function MobileBar({ copies, total, lines, readOnly }: { copies: number; total: number; lines: Line[]; readOnly: boolean }) {
  return (
    <div data-toast-avoid className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-black/10 bg-white/95 px-5 py-3 backdrop-blur lg:hidden">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-black/55"><AnimatedCount value={copies} one="book" /></p>
        <p className="text-xl font-bold leading-tight"><AnimatedTotal value={total} /></p>
      </div>
      <AmazonButton lines={lines} readOnly={readOnly} compact />
    </div>
  );
}

/* ------------------------- Handoff to Amazon (C16) ------------------------- */

function AmazonButton({
  lines,
  readOnly,
  className = "",
  compact = false,
  autoOpen = false,
  scope,
  label,
  variant = "amber",
}: {
  lines: Line[];
  readOnly: boolean;
  className?: string;
  compact?: boolean;
  autoOpen?: boolean;
  /** One child's books only (B3). */
  scope?: Scope;
  label?: string;
  /** "quiet": the smaller per-child button on each group. */
  variant?: "amber" | "quiet";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // ?checkout=1 opens the handoff once, on arrival. Only once: this used to re-run whenever the
  // number of books changed, so removing a book popped "Opening Amazon.in…" open again.
  const autoOpened = useRef(false);
  useEffect(() => {
    if (!autoOpen || autoOpened.current || lines.length === 0) return;
    autoOpened.current = true;
    if (!ref.current?.open) ref.current?.showModal();
  }, [autoOpen, lines.length]);
  const disabled = lines.length === 0;
  if (variant === "quiet") {
    return (
      <>
        <button type="button" onClick={() => ref.current?.showModal()} className={`${QUIET_BTN} border-[#f9a220] bg-[#fff3d6] ${className}`}>
          {label}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/arrow-right.svg" alt="" width={14} height={12} />
        </button>
        <Handoff dialogRef={ref} lines={lines} readOnly={readOnly} scope={scope} />
      </>
    );
  }
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => ref.current?.showModal()}
        className={`group flex h-14 items-stretch gap-0.5 disabled:pointer-events-none disabled:opacity-40 ${FOCUS} ${className}`}
      >
        <span className={`flex flex-1 items-center justify-center whitespace-nowrap rounded-lg px-5 text-xl font-bold leading-none tracking-[-0.48px] ${AMBER_BLOCK}`}>
          {compact ? "Go to Amazon" : "Go to Amazon.in"}
        </span>
        <span className={`grid w-14 shrink-0 place-items-center rounded-lg ${AMBER_BLOCK}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/arrow-right.svg" alt="" width={18.6562} height={16} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </button>
      <Handoff dialogRef={ref} lines={lines} readOnly={readOnly} />
    </>
  );
}

function Handoff({ dialogRef, lines, readOnly, scope }: { dialogRef: React.RefObject<HTMLDialogElement | null>; lines: Line[]; readOnly: boolean; scope?: Scope }) {
  const copies = lines.reduce((n, l) => n + l.qty, 0);
  const batches = chunk(lines, BATCH_SIZE);
  const [opened, setOpened] = useState<Set<number>>(new Set());
  const close = () => dialogRef.current?.close();
  const titleId = useId();

  const go = (i: number) => {
    setOpened((s) => new Set(s).add(i));
    track("go_to_amazon", { batch: i + 1, of: batches.length, books: batches[i].length, shared: readOnly, child: scope?.child });
    if (!readOnly) markCheckoutStarted(copies, scope);
    if (batches.length === 1) close();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClick={(e) => e.target === e.currentTarget && close()}
      className="m-auto w-[min(560px,calc(100vw-32px))] rounded-[28px] bg-white p-0 text-[#1d2838] shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm sm:rounded-[36px]"
      style={{ color: INK }}
    >
      <div className="relative p-6 sm:p-8">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className={`absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-black/5 text-black transition-colors hover:bg-black/10 sm:right-6 sm:top-6 ${FOCUS}`}
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <p className="text-4xl" aria-hidden>📦</p>
        <h2 id={titleId} className="mt-3 pr-12 text-3xl font-bold leading-tight tracking-[-0.02em]">
          Opening Amazon.in with {scope ? `${scope.child ? `${scope.child}'s` : ""} ${plural(copies, "book")}`.trim() : plural(copies, "book")}
        </h2>
        <p className="mt-3 text-lg text-black/65">
          You&apos;ll pay and get delivery on Amazon. {readOnly ? "" : "Your box here stays until you tell us you've ordered."}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {batches.map((b, i) => {
            const from = i * BATCH_SIZE + 1;
            return (
              <a
                key={i}
                href={amazonCartUrl(
                  b.map((l) => ({ asin: bookById(l.bookId)?.asin, qty: l.qty })),
                  `${b[0].title} ${b[0].author}`,
                )}
                target="_blank"
                rel="sponsored noopener"
                onClick={() => go(i)}
                className={`group flex h-14 items-stretch gap-0.5 ${FOCUS}`}
              >
                <span className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-5 text-lg font-bold ${opened.has(i) ? "bg-black/8 text-black/60" : AMBER_BLOCK}`}>
                  {batches.length === 1 ? (
                    "Continue to Amazon"
                  ) : (
                    <>
                      {opened.has(i) && <CheckIcon />}
                      {`${opened.has(i) ? "Opened" : "Open"} books ${from}–${from + b.length - 1}`}
                    </>
                  )}
                </span>
                <span className={`grid w-14 shrink-0 place-items-center rounded-lg ${opened.has(i) ? "bg-black/8" : AMBER_BLOCK}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/arrow-right.svg" alt="" width={18.6562} height={16} />
                </span>
              </a>
            );
          })}
          <button type="button" onClick={close} className={`${QUIET_BTN} h-12`}>
            {opened.size > 0 ? "Done" : "Not now"}
          </button>
        </div>

        <p className="mt-6 text-xs text-black/50">
          Amazon opens in a new tab. These are affiliate links: as an Amazon Associate, KutuBooku earns from qualifying purchases, at no extra cost to you.
        </p>
      </div>
    </dialog>
  );
}

/* ------------------------- Signed in / guest (C5) ------------------------- */

const MERGED_KEY = "kb:box-merged";
const SIGN_IN_HREF = "/sign-in?next=/box";

// Just signed in with books already in this browser (C5): say so once, then fade away.
function MergedToast({ count }: { count: number }) {
  const [shown, setShown] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShown(false), 5000);
    return () => clearTimeout(t);
  }, []);
  return (
    <Toast toast={shown ? { text: `Added ${plural(count, "book")} from this browser to your account` } : null} />
  );
}

/* --------------------------- "Did you order?" (C17) -------------------------- */

/** `child`: only that child's books went to Amazon (B3); "anyone" for the For-anyone group. */
function DidYouOrder({ onYes, child, book }: { onYes: () => void; child?: string; book?: string }) {
  // book: a single "Buy now" from that book's page.
  const whose = book ? "" : child === undefined ? "" : child === "anyone" ? " for the For anyone books" : ` for ${child}'s books`;
  if (book)
    return (
      <section aria-labelledby="did-you-order" className="mt-6 flex flex-col gap-4 rounded-[28px] bg-[#96D7C8] p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex-1">
          <h2 id="did-you-order" className="text-xl font-bold tracking-[-0.01em]">Did you order &ldquo;{book}&rdquo; on Amazon?</h2>
          <p className="mt-1 text-[15px] text-black/70">We&apos;ll mark it as bought, so we don&apos;t pick it again. The rest of your box stays.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onYes} className={`h-12 rounded-full bg-black px-5 text-[15px] font-semibold text-white hover:bg-black/85 ${FOCUS}`}>
            Yes, mark it bought
          </button>
          <button type="button" onClick={keepBox} className={`${QUIET_BTN} h-12 border-black/25`}>
            Not yet
          </button>
        </div>
      </section>
    );
  return (
    <section aria-labelledby="did-you-order" className="mt-6 flex flex-col gap-4 rounded-[28px] bg-[#96D7C8] p-5 sm:flex-row sm:items-center sm:p-6">
      <div className="flex-1">
        <h2 id="did-you-order" className="text-xl font-bold tracking-[-0.01em]">Did you place the order{whose} on Amazon?</h2>
        <p className="mt-1 text-[15px] text-black/70">We&apos;ll mark these books as bought, so we don&apos;t pick them again.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onYes} className={`h-12 rounded-full bg-black px-5 text-[15px] font-semibold text-white hover:bg-black/85 ${FOCUS}`}>
          {child === undefined ? "Yes, clear my box" : "Yes, mark them bought"}
        </button>
        <button type="button" onClick={keepBox} className={`${QUIET_BTN} h-12 border-black/25`}>
          Not yet, keep it
        </button>
      </div>
    </section>
  );
}

/* ------------------------------- Empty / done ------------------------------- */

function Centered({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[720px] py-8 text-center">
      <div className="rounded-[36px] bg-[#fffdf8] px-6 py-12 shadow-[0_24px_70px_rgba(29,40,56,0.12)] sm:rounded-[56px] sm:px-12 sm:py-16">
        <p className="mx-auto w-fit -rotate-3 font-[family-name:var(--font-caveat)] text-[28px] leading-none text-[#3b308f] sm:text-[36px]">{eyebrow}</p>
        <h1 className="mt-4 text-balance text-[clamp(40px,3.6vw,64px)] font-bold leading-[0.9] tracking-[-0.02em]">{title}</h1>
        {children}
      </div>
    </div>
  );
}

const CTA_PRIMARY = `inline-flex h-14 items-center justify-center rounded-[18px] bg-[#f9a220] px-7 type-button text-black transition-[background-color,border-radius,scale] duration-300 hover:rounded-[28px] hover:bg-[#e8900c] active:scale-[0.98] ${FOCUS}`;
const CTA_OUTLINE = `inline-flex h-14 items-center justify-center rounded-[18px] border-2 border-[#1d2838]/20 px-7 type-button transition-[background-color,border-color,border-radius,scale] duration-300 hover:rounded-[28px] hover:border-[#1d2838] hover:bg-[#1d2838]/5 active:scale-[0.98] ${FOCUS}`;

// C19: empty box — next steps (the mascot peeks over the footer below).
function Empty({ childName, signedIn }: { childName: string; signedIn: boolean }) {
  return (
    <Centered eyebrow="your box" title="Your box is empty">
      <p className="mx-auto mt-5 max-w-[480px] type-body-lg text-black/65">
        Tick books on {childName ? `${childName}'s` : "your child's"} list, or add them from this month&apos;s Edition. They&apos;ll wait here until you&apos;re ready for Amazon.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/reading-preferences" className={CTA_PRIMARY}>
          Find books for {childName || "my child"}
        </Link>
        {/* TODO: point at the Edition pop-up once the Editions page is live (it's parked in app/_held). */}
        <Link href="/" className={CTA_OUTLINE}>
          See this month&apos;s Edition
        </Link>
      </div>
      {!signedIn && (
        <p className="mt-8 text-[15px] text-black/60">
          Started a box on another device?{" "}
          <Link href={SIGN_IN_HREF} className={`rounded font-semibold text-black link-underline-on ${FOCUS}`}>
            Sign in to see it
          </Link>
        </p>
      )}
    </Centered>
  );
}

// C18: after "Yes, I ordered".
function Ordered({ count }: { count: number }) {
  return (
    <Centered eyebrow="happy reading" title="Order placed. Enjoy the stories!">
      <p className="mx-auto mt-5 max-w-[480px] type-body-lg text-black/65">
        We&apos;ve marked {plural(count, "book")} as bought, so we won&apos;t pick {count === 1 ? "it" : "them"} again.
      </p>
      <div className="mt-8 flex justify-center">
        <Link href="/" className={CTA_PRIMARY}>Back to home</Link>
      </div>
    </Centered>
  );
}
