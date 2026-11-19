"use client";

import { useSyncExternalStore } from "react";

export type Session = { name: string; email: string; since: number };

const KEY = "kb:session";
const LEGACY_KEY = "kb:signed-in";
const MERGED_KEY = "kb:box-merged";

const SAMPLE_ACCOUNT = { name: "Sample Parent", email: "parent@example.com" };

let cache: Session | null | undefined;
const listeners = new Set<() => void>();

function read(): Session | null {
  if (cache !== undefined) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Session) : null;
    if (!cache && sessionStorage.getItem(LEGACY_KEY) === "1") cache = { ...SAMPLE_ACCOUNT, since: Date.now() };
  } catch {
    cache = null;
  }
  return cache;
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = undefined;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSession(): Session | null | undefined {
  return useSyncExternalStore(subscribe, read, () => undefined);
}

export const isSignedIn = () => read() !== null;

export function signIn(): Session {
  const s: Session = { ...SAMPLE_ACCOUNT, since: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    sessionStorage.setItem(LEGACY_KEY, "1");
  } catch {}
  cache = s;
  emit();
  return s;
}

let signedOutAt = 0;
export const lastSignOut = () => signedOutAt;

export function signOut() {
  signedOutAt = Date.now();
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(LEGACY_KEY);
    sessionStorage.removeItem(MERGED_KEY);
  } catch {}
  cache = null;
  emit();
}

export function safeNext(raw: string | null | undefined, fallback = "/") {
  return raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/sign-in") ? raw : fallback;
}
