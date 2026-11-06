"use client";

// Signed-in session, shared by the header, sign-in, curation and box pages.
// ⚠️ SIMULATED: real "Sign in with Google" (OAuth via Payload + Google provider) is a dev-team task.
// Until then, "Continue with Google" signs in a sample parent account, kept in localStorage so it
// survives reloads and new tabs, and signing out really signs out.

import { useSyncExternalStore } from "react";

export type Session = { name: string; email: string; since: number };

const KEY = "kb:session";
/** Older flag the first screens used (sessionStorage). Still read so nobody gets signed out by this change. */
const LEGACY_KEY = "kb:signed-in";
/** Box page: "we've added this browser's books to your account" was shown (see app/box/Box.tsx). */
const MERGED_KEY = "kb:box-merged";

/** The sample account "Continue with Google" signs in as, until real Google sign-in exists. */
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

/** The session; null when signed out; undefined during server render / before hydration. */
export function useSession(): Session | null | undefined {
  return useSyncExternalStore(subscribe, read, () => undefined);
}

export const isSignedIn = () => read() !== null;

export function signIn(): Session {
  const s: Session = { ...SAMPLE_ACCOUNT, since: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    sessionStorage.setItem(LEGACY_KEY, "1");
  } catch {
    /* private mode: signed in for this page only */
  }
  cache = s;
  emit();
  return s;
}

/** When the last sign-out happened (this tab), so the header can say "You've signed out" even if the page changes. */
let signedOutAt = 0;
export const lastSignOut = () => signedOutAt;

export function signOut() {
  signedOutAt = Date.now();
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(LEGACY_KEY);
    sessionStorage.removeItem(MERGED_KEY);
  } catch {
    /* ignore */
  }
  cache = null;
  emit();
}

/** Only same-site relative paths are allowed as the place to go after signing in. */
export function safeNext(raw: string | null | undefined, fallback = "/") {
  return raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/sign-in") ? raw : fallback;
}
