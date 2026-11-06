"use client";

// The one toast for the whole site (box adds, sign-out, curation changes, box notes).
// - Where: top-right, just under the header's box and account buttons (what most toasts are
//   about: the box, signing out), lined up with the header's right edge. Same on phones.
// - Look: a light card, a round icon (tick for done, info otherwise), the message, an optional
//   action ("View box"). Drops in from the header; lifts back out. Reduced motion: just appears/disappears.
// - Rendered into <body>, so a transformed parent (sticky/pinned sections) can't trap it.
// - Announced politely to screen readers (role="status").

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckIcon } from "./CheckIcon";

export type ToastData = {
  text: React.ReactNode;
  /** Bump to replay the entrance for a new message with the same text. */
  n?: number;
  tone?: "done" | "info";
  action?: { label: string; href?: string; onClick?: () => void };
};

const OUT_MS = 220;

export function Toast({ toast }: { toast: ToastData | null }) {
  // Keep the last toast on screen while it fades out.
  const [shown, setShown] = useState<ToastData | null>(toast);
  const [leaving, setLeaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Bottom-centre, but above any bar pinned to the bottom of the screen (marked data-toast-avoid:
  // curation's summary bar, the box's phone total bar), measured when a toast appears.
  const [lift, setLift] = useState(0);
  useEffect(() => setMounted(true), []); // eslint-disable-line react-hooks/set-state-in-effect -- portal target exists only after hydration

  useEffect(() => {
    if (toast) {
      setShown(toast); // eslint-disable-line react-hooks/set-state-in-effect
      setLeaving(false);
      const vh = window.innerHeight;
      let h = 0;
      document.querySelectorAll<HTMLElement>("[data-toast-avoid]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.height && r.bottom >= vh - 2 && r.top < vh) h = Math.max(h, vh - r.top);
      });
      setLift(h ? h + 12 : 0);
      return;
    }
    setLeaving(true);
    const t = setTimeout(() => setShown(null), OUT_MS);
    return () => clearTimeout(t);
  }, [toast]);

  if (!mounted) return null;
  const tone = shown?.tone ?? "done";
  const a = shown?.action;
  const actionClass =
    "pointer-events-auto shrink-0 rounded-full bg-[#1d2838] px-3.5 py-2 text-[14px] font-semibold leading-none text-white transition-colors hover:bg-[#1d2838]/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]";

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[max(24px,env(safe-area-inset-bottom))] z-[60] flex justify-center px-page sm:bottom-8"
      style={lift ? { bottom: lift } : undefined}
    >
      {shown ? (
        <div
          key={shown.n}
          className={`flex w-full max-w-[400px] origin-bottom items-center gap-3 rounded-2xl bg-white py-2.5 pl-2.5 pr-3 text-[#1d2838] shadow-[0_18px_44px_-14px_rgba(29,40,56,0.45)] ring-1 ring-[#1d2838]/8 sm:w-auto ${
            leaving ? "animate-[toast-out_220ms_ease-in_forwards]" : "animate-[toast-in_420ms_cubic-bezier(0.22,1,0.36,1)]"
          } motion-reduce:animate-none`}
        >
          <span
            aria-hidden
            className={`grid size-9 shrink-0 place-items-center rounded-full ${tone === "done" ? "bg-[#dcefe4] text-[#2e7a58]" : "bg-[#f4efe6] text-[#1d2838]"}`}
          >
            {tone === "done" ? (
              <CheckIcon className="size-[18px]" />
            ) : (
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M12 11v6M12 7.5v.01" />
              </svg>
            )}
          </span>
          <p className="min-w-0 flex-1 text-[15px] font-semibold leading-snug">{shown.text}</p>
          {a ? (
            a.href ? (
              <Link href={a.href} className={actionClass}>
                {a.label}
              </Link>
            ) : (
              <button type="button" onClick={a.onClick} className={actionClass}>
                {a.label}
              </button>
            )
          ) : null}
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
