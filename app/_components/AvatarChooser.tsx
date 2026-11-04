"use client";

// "Pick a character": a child's profile picture from the books' characters (Netflix-style icon picker).

import Image from "next/image";
import { useEffect, useRef } from "react";
import { AVATARS, avatarSrc } from "../_data/avatars";

const FOCUS = "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]";

export function AvatarChooser({
  open,
  name,
  value,
  taken,
  onPick,
  onClose,
}: {
  open: boolean;
  name: string;
  value: string;
  /** Characters other children already have: avatar id → child's name. */
  taken: Record<string, string>;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="avatar-title"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto w-[min(640px,calc(100vw-32px))] rounded-[32px] bg-[#fffdf8] p-0 text-[#1d2838] backdrop:bg-black/50"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="avatar-title" className="type-display-sm">Pick a character for {name || "your child"}</h2>
            <p className="mt-2 type-body text-[#1d2838]/65">Friends from the books we love.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className={`grid size-11 shrink-0 place-items-center rounded-full bg-[#f4eee3] hover:bg-[#ece3d3] ${FOCUS}`}>
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <ul role="radiogroup" aria-labelledby="avatar-title" className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {AVATARS.map((a) => {
            const on = a.id === value;
            const owner = taken[a.id];
            return (
              <li key={a.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={`${a.label}, from ${a.book}${owner ? ` (${owner} has this one)` : ""}`}
                  title={`${a.label} · ${a.book}`}
                  onClick={() => onPick(a.id)}
                  className={`group relative block aspect-square w-full rounded-[28%] transition-transform duration-200 hover:scale-105 ${on ? "ring-4 ring-[#f26b4f] ring-offset-2" : ""} ${FOCUS}`}
                >
                  <Image src={avatarSrc(a.id)} alt="" width={256} height={256} sizes="120px" loading="eager" className="size-full rounded-[28%] object-cover" />
                  {owner && !on ? (
                    <span className="absolute inset-x-1 bottom-1 truncate rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold">{owner}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </dialog>
  );
}
