"use client";

import type { AskAnswer } from "../_data/ask-mock";

export type AskTurn = { id: number; question: string; query: string; answer: AskAnswer };

const MAX_TURNS = 20;
const PREFIX = "kb:ask:";

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
  } catch {}
}

export function dropChildThreads(childId: string) {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX) && k.endsWith(`:${childId}`)) localStorage.removeItem(k);
    }
  } catch {}
}
