"use client";

import { useSyncExternalStore } from "react";

const KEY = "kb:gift-basket";
const EMPTY: string[] = [];

let cache: string[] | null = null;
const listeners = new Set<() => void>();

function read(): string[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: string[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    l();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useGiftBasket(): string[] | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function toggleGift(bookId: string) {
  const cur = read();
  write(cur.includes(bookId) ? cur.filter((id) => id !== bookId) : [...cur, bookId]);
}

export function clearGiftBasket() {
  write([]);
}
