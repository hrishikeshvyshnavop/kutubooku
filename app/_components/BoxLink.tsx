"use client";

// Header box icon with a count badge (C20). It's also the landing spot for books added to the
// box (app/_lib/fly.ts): the lid opens when a book takes off, snaps shut when it lands, and the
// count only goes up on landing.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useBox } from "../_lib/box";
import { useSession } from "../_lib/session";

export function BoxLink({ className = "" }: { className?: string }) {
  const box = useBox();
  const ref = useRef<HTMLAnchorElement>(null);
  const [incoming, setIncoming] = useState(0); // books still in the air
  const [pop, setPop] = useState(0); // bumps on each landing (restarts the badge pop)

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onIncoming = () => setIncoming((n) => n + 1);
    const onCatch = () => {
      setIncoming((n) => Math.max(0, n - 1));
      setPop((p) => p + 1);
    };
    el.addEventListener("kb:box-incoming", onIncoming);
    el.addEventListener("kb:box-catch", onCatch);
    return () => {
      el.removeEventListener("kb:box-incoming", onIncoming);
      el.removeEventListener("kb:box-catch", onCatch);
    };
  }, []);

  // Signed out: one plain list (no children), so count each book once.
  const signedIn = Boolean(useSession());
  const total = signedIn ? box?.items.length ?? 0 : new Set(box?.items.map((i) => i.bookId)).size;
  const n = Math.max(0, total - incoming); // hold the count until the book lands
  const open = incoming > 0;

  return (
    <Link
      ref={ref}
      href="/box"
      data-box-target="header"
      aria-label={total ? `Box, ${total} ${total === 1 ? "book" : "books"}` : "Box, empty"}
      className={`relative grid size-12 shrink-0 place-items-center rounded-full bg-[#fbbe63] text-black transition-[background-color,scale] duration-200 hover:bg-[#f9a220] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black xl:size-14 ${className}`}
    >
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="overflow-visible">
        {/* box body */}
        <path d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
        <path d="M10 14h4" />
        {/* lid: hinged at the back-left corner, swings open while a book is on its way */}
        <g
          style={{ transformOrigin: "3px 10px", transformBox: "view-box" }}
          className={`transition-transform ${open ? "-rotate-[38deg] -translate-y-px duration-200 ease-out" : "rotate-0 duration-300 ease-[cubic-bezier(0.34,1.8,0.64,1)]"}`}
        >
          <path d="M3 6.5h18v3.5H3z" />
        </g>
      </svg>
      {n > 0 && (
        <span
          key={pop}
          aria-hidden
          className={`absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-black px-1.5 text-xs font-bold text-white ${pop ? "animate-[badge-pop_420ms_cubic-bezier(0.34,1.56,0.64,1)]" : ""}`}
        >
          {n > 99 ? "99+" : n}
        </span>
      )}
    </Link>
  );
}
