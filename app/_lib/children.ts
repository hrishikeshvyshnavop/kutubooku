"use client";

import { useSyncExternalStore } from "react";
import { AVATARS } from "../_data/avatars";
import { ageOf } from "../_data/questions";
import { moveChildInBox } from "./box";
import { isSignedIn } from "./session";
import { dropChildThreads } from "./ask-history";

export type ChildAnswers = Record<string, string | string[]>;
export type ChildProfile = { id: string; name: string; answers: ChildAnswers; createdAt: number };
export type ChildrenState = { list: ChildProfile[]; active: string | null };

export const MAX_CHILDREN = 6;

const KEY = "kb:children";
export const DRAFT_KEY = "kb:reading-preferences";
export const NEW_DRAFT_KEY = "kb:new-child";

const EMPTY: ChildrenState = { list: [], active: null };

export function displayName(raw: unknown): string {
  return typeof raw === "string" && raw.trim()
    ? raw.trim().replace(/(^|[\s'-])([a-z])/g, (_m: string, p: string, c: string) => p + c.toUpperCase())
    : "";
}
const norm = (n: string) => n.trim().toLowerCase();

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
  } catch {}
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

export function useChildren(): ChildrenState | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export const readChildren = () => (isSignedIn() ? read() : EMPTY);

export function activeOf(s: ChildrenState | null): ChildProfile | null {
  if (!s?.list.length) return null;
  return s.list.find((c) => c.id === s.active) ?? s.list[0];
}
export const activeChild = () => activeOf(readChildren());
export const childById = (id: string | null) => (id ? readChildren().list.find((c) => c.id === id) ?? null : null);

export function nameTaken(name: string, exceptId?: string) {
  const n = norm(name);
  return Boolean(n) && read().list.some((c) => c.id !== exceptId && norm(c.name) === n);
}

export const canAddChild = () => read().list.length < MAX_CHILDREN;

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);

export function freeAvatar(exceptId?: string): string {
  const used = new Set(read().list.filter((c) => c.id !== exceptId).map((c) => c.answers.avatar));
  return (AVATARS.find((a) => !used.has(a.id)) ?? AVATARS[0]).id;
}

export function addChild(answers: ChildAnswers): ChildProfile | null {
  const s = read();
  const name = typeof answers.name === "string" ? answers.name.trim() : "";
  if (!name || nameTaken(name) || s.list.length >= MAX_CHILDREN) return null;
  const child: ChildProfile = { id: newId(), name, answers: { ...answers, avatar: answers.avatar || freeAvatar() }, createdAt: Date.now() };
  write({ list: [...s.list, child], active: child.id });
  return child;
}

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

export function removeChild(id: string) {
  const s = read();
  const cur = s.list.find((c) => c.id === id);
  if (!cur) return;
  const list = s.list.filter((c) => c.id !== id);
  write({ list, active: s.active === id ? list[0]?.id ?? null : s.active });
  moveChildInBox(displayName(cur.name), null);
  dropChildThreads(id);
}

export function setActiveChild(id: string) {
  const s = read();
  if (s.active !== id && s.list.some((c) => c.id === id)) write({ ...s, active: id });
}

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
    } catch {}
  }
  return child;
}

const FOR_KEY = "kb:box-for";

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
  } catch {}
}

export function switchChild(id: string) {
  const c = read().list.find((x) => x.id === id);
  if (!c) return;
  setActiveChild(id);
  setFor(displayName(c.name));
}
