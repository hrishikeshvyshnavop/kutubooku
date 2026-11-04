"use client";

// Child profiles (Q8, C8): several children per account, Netflix-style, each with their own
// reading answers and curation. One of them is "active": the curation, the book page's
// "Who's this for?" and the box's suggestions follow it.
//
// ⚠️ SIMULATED: profiles belong to the account, so they'll live in Payload once real accounts
// exist (dev-team task). Until then they're kept in this browser's localStorage, and only shown
// while signed in.
//
// The first child's answers start as a sign-in-free draft (sessionStorage, the questionnaire);
// commitDraft() turns that draft into a profile once the parent has signed in.
//
// The box files books under the child's display name (app/_lib/box.ts), so names must be
// unique within the account: a rename or removal moves their books along.

import { useSyncExternalStore } from "react";
import { AVATARS } from "../_data/avatars";
import { ageOf } from "../_data/questions";
import { moveChildInBox } from "./box";
import { isSignedIn } from "./session";

export type ChildAnswers = Record<string, string | string[]>;
export type ChildProfile = { id: string; name: string; answers: ChildAnswers; createdAt: number };
export type ChildrenState = { list: ChildProfile[]; active: string | null };

/** Plenty for a family, and keeps the picker on one screen. */
export const MAX_CHILDREN = 6;

const KEY = "kb:children";
/** First child's answers before sign-in (the questionnaire's draft). */
export const DRAFT_KEY = "kb:reading-preferences";
/** "Add another child" answers in progress (kept for refreshes). */
export const NEW_DRAFT_KEY = "kb:new-child";

const EMPTY: ChildrenState = { list: [], active: null };

/** Capitalised for display ("anna-maria" → "Anna-Maria"); the saved answer stays as typed. */
export function displayName(raw: unknown): string {
  return typeof raw === "string" && raw.trim()
    ? raw.trim().replace(/(^|[\s'-])([a-z])/g, (_m: string, p: string, c: string) => p + c.toUpperCase())
    : "";
}
const norm = (n: string) => n.trim().toLowerCase();

/* -------------------------------- Storage -------------------------------- */

let cache: ChildrenState | null = null;
const listeners = new Set<() => void>();

function read(): ChildrenState {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<ChildrenState>) : null;
    cache = parsed && Array.isArray(parsed.list) ? { ...EMPTY, ...parsed } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: ChildrenState) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode: profiles last for this visit */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
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

/** All profiles + the active one; null before hydration. Combine with useSession: profiles are account data. */
export function useChildren(): ChildrenState | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export const readChildren = () => (isSignedIn() ? read() : EMPTY);

/** The active child (falls back to the first), or null. */
export function activeOf(s: ChildrenState | null): ChildProfile | null {
  if (!s?.list.length) return null;
  return s.list.find((c) => c.id === s.active) ?? s.list[0];
}
export const activeChild = () => activeOf(readChildren());
export const childById = (id: string | null) => (id ? readChildren().list.find((c) => c.id === id) ?? null : null);

/** Another child in the account already uses this name (box rows are filed by name). */
export function nameTaken(name: string, exceptId?: string) {
  const n = norm(name);
  return Boolean(n) && read().list.some((c) => c.id !== exceptId && norm(c.name) === n);
}

export const canAddChild = () => read().list.length < MAX_CHILDREN;

/* -------------------------------- Actions -------------------------------- */

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);

/** A book character no other child has picked yet (answers.avatar holds the picture's id). */
export function freeAvatar(exceptId?: string): string {
  const used = new Set(read().list.filter((c) => c.id !== exceptId).map((c) => c.answers.avatar));
  return (AVATARS.find((a) => !used.has(a.id)) ?? AVATARS[0]).id;
}

/** Adds a child and makes them the active one. Null when the name is taken or the account is full. */
export function addChild(answers: ChildAnswers): ChildProfile | null {
  const s = read();
  const name = typeof answers.name === "string" ? answers.name.trim() : "";
  if (!name || nameTaken(name) || s.list.length >= MAX_CHILDREN) return null;
  const child: ChildProfile = { id: newId(), name, answers: { ...answers, avatar: answers.avatar || freeAvatar() }, createdAt: Date.now() };
  write({ list: [...s.list, child], active: child.id });
  return child;
}

/** Saves edited answers; a new name takes the child's books in the box along. */
export function updateChild(id: string, answers: ChildAnswers) {
  const s = read();
  const cur = s.list.find((c) => c.id === id);
  if (!cur) return;
  const name = typeof answers.name === "string" && answers.name.trim() ? answers.name.trim() : cur.name;
  const before = displayName(cur.name);
  const after = displayName(name);
  write({ ...s, list: s.list.map((c) => (c.id === id ? { ...c, name, answers: { ...answers, name } } : c)) });
  if (before !== after) moveChildInBox(before, after);
}

/** Removes a child; their books stay in the box under "Just browsing". */
export function removeChild(id: string) {
  const s = read();
  const cur = s.list.find((c) => c.id === id);
  if (!cur) return;
  const list = s.list.filter((c) => c.id !== id);
  write({ list, active: s.active === id ? list[0]?.id ?? null : s.active });
  moveChildInBox(displayName(cur.name), null);
}

export function setActiveChild(id: string) {
  const s = read();
  if (s.active !== id && s.list.some((c) => c.id === id)) write({ ...s, active: id });
}

/**
 * Signed in with first-child answers still in the draft (they were given before signing in):
 * save them as a profile. Same name as an existing child → update that child instead.
 */
export function commitDraft(): ChildProfile | null {
  if (!isSignedIn()) return null;
  let draft: ChildAnswers | null = null;
  try {
    draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null");
  } catch {
    return null;
  }
  if (!draft || typeof draft.name !== "string" || !draft.name.trim() || ageOf(draft) === null) return null;
  const same = read().list.find((c) => norm(c.name) === norm(draft.name as string));
  let child: ChildProfile | null;
  if (same) {
    updateChild(same.id, draft);
    setActiveChild(same.id);
    child = same;
  } else child = addChild(draft);
  if (child) {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  }
  return child;
}

/* ------------------------- Who books are added for ------------------------ */
// B1: "Who's this for?" is asked once per visit and remembered (sessionStorage).
// Switching child in the header (B6) changes the remembered answer too.

const FOR_KEY = "kb:box-for"; // "" = just browsing; missing = not asked yet this visit

/** This visit's answer: a child's display name, null (just browsing), or undefined (not asked yet). */
export function readFor(): string | null | undefined {
  try {
    const v = sessionStorage.getItem(FOR_KEY);
    return v === null ? undefined : v || null;
  } catch {
    return undefined;
  }
}

export function setFor(name: string | null) {
  try {
    sessionStorage.setItem(FOR_KEY, name ?? "");
  } catch {
    /* ignore */
  }
}

/** Header switch (B6): this child becomes active, and books added from now on go to them. */
export function switchChild(id: string) {
  const c = read().list.find((x) => x.id === id);
  if (!c) return;
  setActiveChild(id);
  setFor(displayName(c.name));
}
