"use client";

// Saved KutuBooku AI chats (home hero, app/_components/HeroAsk.tsx).
// - Signed in: one thread per child in the account (and one for "no child yet"), kept in
//   localStorage, so a parent can come back to it after a reload, on another visit, or after
//   switching child and back. Signing out keeps it for the next sign-in.
// - Signed out: one thread for this tab only (sessionStorage), so a shared computer doesn't
//   keep a stranger's questions.
// ⚠️ SIMULATED: account data lives in this browser until real accounts exist (Payload, dev-team
// task); then the thread belongs on the server, keyed the same way (account → child).

import type { AskAnswer } from "../_data/ask-mock";

/** `question` is what the bubble shows; `query` is the full question the answer was built from. */
export type AskTurn = { id: number; question: string; query: string; answer: AskAnswer };

/** Keeps storage small; older turns drop off the top. */
const MAX_TURNS = 20;
const PREFIX = "kb:ask:";

/** Which thread: the signed-in account + child, or this tab's guest thread. */
export function threadKey(email: string | null, childId: string | null): string {
  return email ? `${PREFIX}${email}:${childId ?? "none"}` : `${PREFIX}guest`;
}

const store = (key: string) => (key.endsWith(":guest") ? sessionStorage : localStorage);

export function loadThread(key: string): AskTurn[] {
  try {
    const raw = store(key).getItem(key);
    const turns = raw ? (JSON.parse(raw) as AskTurn[]) : [];
    return Array.isArray(turns) ? turns : [];
  } catch {
    return [];
  }
}

export function saveThread(key: string, turns: AskTurn[]) {
  try {
    if (turns.length) store(key).setItem(key, JSON.stringify(turns.slice(-MAX_TURNS)));
    else store(key).removeItem(key);
  } catch {
    /* private mode / full: the chat lasts for this page only */
  }
}

/** A child profile was removed: its chat goes with it. */
export function dropChildThreads(childId: string) {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX) && k.endsWith(`:${childId}`)) localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}
