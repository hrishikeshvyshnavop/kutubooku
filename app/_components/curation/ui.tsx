"use client";

// Shared UI for the screens after the questionnaire (sign-in, curation).
// Copied from app/reading-preferences/Questionnaire.tsx so the two can evolve
// separately for now — consolidate into one shared module later.

import Image from "next/image";
import type { MockBook } from "../../_data/curation-mock";

export const INK = "#1d2838";
export const CORAL = "#f26b4f";

/* -------------------------------- Buttons -------------------------------- */

export {
  ArrowIcon,
  BTN_BASE,
  BTN_GOOGLE,
  BTN_PRIMARY,
  BTN_SECONDARY,
  Button,
  GoogleButton,
  OutlineButton,
  SplitButton,
  ThumbButton,
} from "../Button";
export type { ButtonProps, ButtonVariant } from "../Button";

/* ---------------------------- Answers storage ---------------------------- */

export type Answers = Record<string, string | string[]>;
export const ANSWERS_KEY = "kb:reading-preferences";
export const SIGNED_IN_KEY = "kb:signed-in";

export function readAnswers(): Answers | null {
  try {
    const raw = sessionStorage.getItem(ANSWERS_KEY);
    if (!raw) return null;
    const a = JSON.parse(raw) as Answers;
    return a && typeof a === "object" ? a : null;
  } catch {
    return null;
  }
}

export function childNameOf(a: Answers | null): string {
  const n = a?.name;
  // Capitalised for display; the saved answer stays exactly as typed.
  return typeof n === "string" && n.trim() ? n.trim().replace(/(^|[\s'-])([a-z])/g, (_m: string, p: string, c: string) => p + c.toUpperCase()) : "";
}

/* ------------------------------ Book cover ------------------------------- */

export function BookCover({ book, className = "" }: { book: MockBook; className?: string }) {
  return (
    <div className={`relative aspect-square overflow-hidden rounded-r-[10px] rounded-l-[3px] bg-white shadow-[0_10px_20px_-12px_rgba(29,40,56,0.6)] ${className}`}>
      <Image src={book.cover} alt={`Cover of ${book.title}`} fill sizes="(max-width: 640px) 90vw, (max-width: 1280px) 30vw, 360px" className="object-cover" />
    </div>
  );
}

export const rupeesFmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
