"use client";

// The family book box (decisions C1–C24, docs/CONTEXT.md §15).
// No sign-in needed (C5): the box lives in this browser's localStorage and will be
// copied into the account on sign-in once real accounts exist (dev-team task).
// One family box, grouped by child profile (C8); a book can sit under several children.

import { useSyncExternalStore } from "react";
import { MOCK_BOOKS, type MockBook } from "../_data/curation-mock";
import { amazonCartUrl } from "./amazon";

/* --------------------------------- Types --------------------------------- */

export type BoxSource = "curation" | "edition" | "book";

export type BoxItem = {
  /** bookId + child: one row per book per child. */
  key: string;
  bookId: string;
  /** Child profile name, or null for "Just browsing" (shown as "General"). */
  child: string | null;
  from: BoxSource;
  /** Edition month the book came from, "YYYY-MM" (C23). */
  edition?: string;
  addedAt: number;
  /** B5: a shared copy was bought with this child's books: the row stays, marked "Shared with {child} · bought". */
  sharedBoughtWith?: string | null;
};

export type BoxState = {
  items: BoxItem[];
  /** Same book under two or more children (C10): one shared copy (default) or one each. */
  copies: Record<string, "share" | "each">;
  /** Set when the parent was sent to Amazon; cleared when they answer "Did you order?" (C17).
   *  `child`: only that child's books went (B3, "Buy Meera's books"); missing = the whole box. */
  pendingCheckout: { at: number; count: number; child?: string | null } | null;
};

export type BoughtBook = { bookId: string; child: string | null; at: number };

/** Soft limit (C15): Amazon's add-many link takes a limited number of items. Dev team to confirm the real number. */
export const BATCH_SIZE = 20;

/** MOCK: books "unavailable on Amazon.in right now" (C14). Real availability needs Amazon's product data (dev team). */
export const MOCK_UNAVAILABLE = new Set(["the-bad-seed"]);

/* -------------------------------- Storage -------------------------------- */

const BOX_KEY = "kb:box";
const BOUGHT_KEY = "kb:bought";
const EMPTY: BoxState = { items: [], copies: {}, pendingCheckout: null };

let cache: BoxState | null = null;
const listeners = new Set<() => void>();

function read(): BoxState {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(BOX_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<BoxState>) : null;
    cache = parsed && Array.isArray(parsed.items) ? { ...EMPTY, ...parsed } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: BoxState) {
  cache = next;
  try {
    localStorage.setItem(BOX_KEY, JSON.stringify(next));
  } catch {
    /* private mode / storage full: the box still works for this visit */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  // Another tab changed the box.
  const onStorage = (e: StorageEvent) => {
    if (e.key === BOX_KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

/** The box, or null during server render / before hydration (render a placeholder then). */
export function useBox(): BoxState | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

/* -------------------------------- Actions -------------------------------- */

const keyOf = (bookId: string, child: string | null) => `${bookId}::${child ?? ""}`;
export const boxKey = keyOf;

/** Curation tick (C1): adds the book for this child, or takes it out again. Returns true when added. */
export function toggleInBox(bookId: string, child: string | null, from: BoxSource): boolean {
  const key = keyOf(bookId, child);
  if (read().items.some((i) => i.key === key)) {
    removeFromBox(key);
    return false;
  }
  addToBox(bookId, child, from);
  return true;
}

/** Takes a book out for this child if it's there (curation: Remove / Swap / Already own). */
export function dropFromBox(bookId: string, child: string | null) {
  const key = keyOf(bookId, child);
  if (read().items.some((i) => i.key === key)) removeFromBox(key);
}

/** Used by the add-to-box points (curation ticks, Edition pop-up, book page) — not wired yet. */
export function addToBox(bookId: string, child: string | null, from: BoxSource, edition?: string) {
  const s = read();
  const key = keyOf(bookId, child);
  if (s.items.some((i) => i.key === key)) return;
  write({ ...s, items: [...s.items, { key, bookId, child, from, edition, addedAt: Date.now() }] });
  track("box_add", { bookId, child, from });
}

/** A child was renamed (to = new name) or removed (to = null: their books move to "Just browsing"). */
export function moveChildInBox(from: string, to: string | null) {
  const s = read();
  if (!s.items.some((i) => i.child === from)) return;
  const seen = new Set<string>();
  const items: BoxItem[] = [];
  for (const i of s.items) {
    const next = i.child === from ? { ...i, child: to, key: keyOf(i.bookId, to) } : i;
    if (seen.has(next.key)) continue; // already there under the new name
    seen.add(next.key);
    items.push(next);
  }
  write({ ...s, items });
}

export function removeFromBox(key: string) {
  const s = read();
  const item = s.items.find((i) => i.key === key);
  write({ ...s, items: s.items.filter((i) => i.key !== key) });
  if (item) track("box_remove", { bookId: item.bookId, child: item.child });
}

export function setCopies(bookId: string, choice: "share" | "each") {
  const s = read();
  write({ ...s, copies: { ...s.copies, [bookId]: choice } });
}

/** Replace an unavailable book with a similar one (C14). Returns the new book, or null if none fits. */
export function swapItem(key: string): MockBook | null {
  const s = read();
  const item = s.items.find((i) => i.key === key);
  if (!item) return null;
  const replacement = similarBook(item.bookId, new Set(s.items.map((i) => i.bookId)));
  if (!replacement) return null;
  const newKey = keyOf(replacement.id, item.child);
  write({
    ...s,
    items: s.items.map((i) => (i.key === key ? { ...i, key: newKey, bookId: replacement.id, addedAt: Date.now() } : i)),
  });
  track("box_swap", { from: item.bookId, to: replacement.id, child: item.child });
  return replacement;
}

/** Scope of a checkout: one child's group (B3), or undefined for the whole box. */
export type Scope = { child: string | null } | undefined;

export function markCheckoutStarted(count: number, scope?: Scope) {
  write({ ...read(), pendingCheckout: { at: Date.now(), count, ...(scope ? { child: scope.child } : {}) } });
}

/** B4: "Move to…": this book now belongs to another child (or "For anyone"). */
export function moveItem(key: string, to: string | null) {
  const s = read();
  const item = s.items.find((i) => i.key === key);
  if (!item || item.child === to) return;
  const newKey = keyOf(item.bookId, to);
  const exists = s.items.some((i) => i.key === newKey);
  write({
    ...s,
    // Already there for that child: just drop this row.
    items: exists ? s.items.filter((i) => i.key !== key) : s.items.map((i) => (i.key === key ? { ...i, key: newKey, child: to } : i)),
  });
  track("box_move", { bookId: item.bookId, from: item.child, to });
}

/** Rows that still need buying (not unavailable, not already covered by a bought shared copy). */
export const toBuy = (i: BoxItem) => !MOCK_UNAVAILABLE.has(i.bookId) && i.sharedBoughtWith === undefined;

/**
 * "Buy on Amazon" on a book (C3/C4): adds it to the box, then sends the whole box.
 * Only this book in the box → opens Amazon now (must run inside the click) and returns "amazon".
 * Other books too → returns "box": the caller goes to /box?checkout=1, whose handoff screen
 * handles batches, shared copies and unavailable books.
 */
export function buyNow(book: MockBook, child: string | null, from: BoxSource): "amazon" | "box" {
  addToBox(book.id, child, from);
  const others = read().items.some((i) => i.bookId !== book.id);
  if (others) return "box";
  track("go_to_amazon", { batch: 1, of: 1, books: 1, from });
  markCheckoutStarted(1);
  window.open(amazonCartUrl([book], `${book.title} ${book.author}`), "_blank", "noopener");
  return "amazon";
}

/** Label for a book's buy button (C4): follows what else is in the box. */
export function buyLabel(box: BoxState | null, bookId: string, price?: string) {
  const ids = new Set((box?.items ?? []).map((i) => i.bookId));
  const inBox = ids.has(bookId);
  ids.add(bookId);
  if (ids.size === 1) return price ? `Buy on Amazon · ${price}` : "Buy on Amazon";
  return `${inBox ? "Buy" : "Add & buy"} all ${ids.size} on Amazon`;
}

/** "Not yet, keep it" (C17). */
export function keepBox() {
  write({ ...read(), pendingCheckout: null });
}

/**
 * "Yes, I ordered" (C17/C18): remember the books as Bought and take them out of the box.
 * Whole box → the box empties. One child's books (B3) → only their rows go; a shared copy (B5)
 * covers the other children too, whose rows stay marked "Shared with {child} · bought".
 * Returns how many books were marked bought and whether the box is now empty.
 */
export function confirmOrdered(): { count: number; empty: boolean } {
  const s = read();
  const scope = s.pendingCheckout && "child" in s.pendingCheckout ? { child: s.pendingCheckout.child ?? null } : undefined;
  const at = Date.now();
  const inScope = (i: BoxItem) => !scope || i.child === scope.child;
  const bought = s.items.filter((i) => inScope(i) && toBuy(i));
  const boughtIds = new Set(bought.map((i) => i.bookId));
  // Rows covered by a shared copy that just got bought.
  const covered = scope
    ? s.items.filter((i) => !inScope(i) && boughtIds.has(i.bookId) && (s.copies[i.bookId] ?? "share") === "share" && i.sharedBoughtWith === undefined)
    : [];
  try {
    const add = [...bought, ...covered].map((i) => ({ bookId: i.bookId, child: i.child, at }));
    localStorage.setItem(BOUGHT_KEY, JSON.stringify([...readBought(), ...add]));
  } catch {
    /* ignore */
  }
  const coveredKeys = new Set(covered.map((i) => i.key));
  // Whole box: everything goes. One child: their bought rows go (unavailable ones stay for a swap).
  const items = scope
    ? s.items
        .filter((i) => !(inScope(i) && toBuy(i)))
        .map((i) => (coveredKeys.has(i.key) ? { ...i, sharedBoughtWith: scope.child } : i))
    : [];
  write({ ...s, items, pendingCheckout: null });
  track("order_confirmed", { count: bought.length, child: scope?.child });
  return { count: bought.length, empty: items.length === 0 };
}

/** Books marked Bought (C18): curations should skip these. Needs an account to follow the family across devices. */
export function readBought(): BoughtBook[] {
  try {
    const raw = localStorage.getItem(BOUGHT_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/* -------------------------------- Helpers -------------------------------- */

const BY_ID = new Map(MOCK_BOOKS.map((b) => [b.id, b]));
export const bookById = (id: string) => BY_ID.get(id);

/** Closest book by shared interests and overlapping ages, skipping ones already in the box. */
function similarBook(bookId: string, exclude: Set<string>): MockBook | null {
  const base = BY_ID.get(bookId);
  if (!base) return null;
  let best: MockBook | null = null;
  let bestScore = -1;
  for (const b of MOCK_BOOKS) {
    if (exclude.has(b.id) || MOCK_UNAVAILABLE.has(b.id)) continue;
    const shared = b.tags.filter((t) => base.tags.includes(t)).length;
    const ageOverlap = b.ageMin <= base.ageMax && b.ageMax >= base.ageMin ? 1 : 0;
    const score = shared * 2 + ageOverlap;
    if (score > bestScore) {
      best = b;
      bestScore = score;
    }
  }
  return best;
}

/** "YYYY-MM" for a date. */
export const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const monthName = (key: string) =>
  new Date(`${key}-01T00:00:00`).toLocaleString("en-IN", { month: "long" });

/* --------------------------------- Share --------------------------------- */
// C21: a link to a read-only copy of the box on this site (never an Amazon link in a message).
// For now the books are written into the link itself; a real short link needs storage (dev team).

type SharedEntry = [bookId: string, child: string | null];

export function shareUrl(items: BoxItem[], copies: BoxState["copies"]) {
  const payload = { i: items.map((i): SharedEntry => [i.bookId, i.child]), c: copies };
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${window.location.origin}/box?shared=${encoded}`;
}

export function readShared(encoded: string): BoxState | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded.replace(/-/g, "+").replace(/_/g, "/"))));
    const p = JSON.parse(json) as { i: SharedEntry[]; c?: BoxState["copies"] };
    const items = p.i
      .filter(([id]) => BY_ID.has(id))
      .map(([bookId, child]): BoxItem => ({ key: keyOf(bookId, child), bookId, child, from: "book", addedAt: 0 }));
    return { items, copies: p.c ?? {}, pendingCheckout: null };
  } catch {
    return null;
  }
}

/* -------------------------------- Demo data ------------------------------- */
// /box?demo=1 fills the box with sample books (like /curation?slow=1), until the add-to-box points are wired.

export function seedDemoBox() {
  const now = new Date();
  const last = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const t = Date.now();
  const item = (bookId: string, child: string | null, from: BoxSource, edition?: string, n = 0): BoxItem => ({
    key: keyOf(bookId, child),
    bookId,
    child,
    from,
    edition,
    addedAt: t - n * 60_000,
  });
  write({
    items: [
      item("the-dot", "Aarav", "curation", undefined, 9),
      item("jabari-jumps", "Aarav", "curation", undefined, 8),
      item("the-most-magnificent-thing", "Aarav", "curation", undefined, 7),
      item("the-color-monster", "Meera", "curation", undefined, 6),
      item("the-dot", "Meera", "curation", undefined, 5),
      item("the-bad-seed", "Meera", "book", undefined, 4),
      item("the-rabbit-listened", null, "edition", last, 3),
      item("i-am-human", null, "edition", last, 2),
      item("you-choose", null, "edition", last, 1),
    ],
    copies: {},
    pendingCheckout: null,
  });
}

/* ------------------------------- Analytics -------------------------------- */
// C24: added / viewed / go to Amazon / ordered, by where the book was added and by child.
// Pushes to window.dataLayer so any analytics tool can pick it up later.

export function track(event: string, props: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer ??= []).push({ event, ...props });
  if (process.env.NODE_ENV === "development") console.debug("[track]", event, props);
}
