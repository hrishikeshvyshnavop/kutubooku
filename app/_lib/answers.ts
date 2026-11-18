import { activeChild, displayName } from "./children";

export type Answers = Record<string, string | string[]>;

export const ANSWERS_KEY = "kb:reading-preferences";

export function readAnswers(): Answers | null {
  const active = activeChild();
  if (active) return active.answers;
  try {
    const raw = sessionStorage.getItem(ANSWERS_KEY);
    if (!raw) return null;
    const a = JSON.parse(raw) as Answers;
    return a && typeof a === "object" ? a : null;
  } catch {
    return null;
  }
}

export const childNameOf = (a: Answers | null): string => displayName(a?.name);
