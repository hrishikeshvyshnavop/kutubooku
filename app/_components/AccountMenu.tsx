"use client";

// The one profile control in the header once signed in (Netflix-style, B6):
// the active child's picture and name. Its menu holds everything account-related:
// who books are being added for, switching child, adding / managing readers, the box,
// and the Google account with Sign out.
// Before any child exists it shows the parent's initial and "Account".
// Phones: the same button, picture only.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { signOut, type Session } from "../_lib/session";
import { useBox } from "../_lib/box";
import { MAX_CHILDREN, activeOf, displayName, switchChild, useChildren } from "../_lib/children";
import { ReaderAvatar } from "./ReaderAvatar";

/** Menu close animation length; signing out waits for it so nothing swaps under a fading menu. */
const CLOSE_MS = 200;
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";
const ITEM = `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-lg font-semibold tracking-[-0.01em] hover:bg-[#fff3d6] ${FOCUS}`;

function Initial({ session, size }: { session: Session; size: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      className="grid shrink-0 place-items-center rounded-full bg-black font-bold leading-none text-white"
    >
      {session.email.charAt(0).toUpperCase()}
    </span>
  );
}

export function AccountMenu({ session }: { session: Session }) {
  const router = useRouter();
  const box = useBox();
  const kids = useChildren();
  const [open, setOpen] = useState(false);
  const [said, setSaid] = useState("");
  const [confirming, setConfirming] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const stayRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Keyboard: the question takes focus on its safe answer ("Stay signed in").
  useEffect(() => {
    if (confirming) stayRef.current?.focus();
  }, [confirming]);

  useEffect(() => {
    if (!open) {
      setConfirming(false); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const list = kids?.list ?? [];
  const active = activeOf(kids);
  const name = active ? displayName(active.name) : "";
  const n = box?.items.length ?? 0;
  const done = () => setOpen(false);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={active ? `Adding books for ${name}. Profile and account` : "Account"}
        // Fixed width: switching child (names of any length) never shifts the header.
        className={`flex h-12 items-center gap-2 rounded-full bg-[#fbbe63] p-1 text-xl font-semibold tracking-[-0.16px] text-black transition-colors hover:bg-[#f9a220] sm:w-[184px] sm:pr-4 xl:h-14 xl:py-2 xl:pl-2 ${FOCUS}`}
      >
        {active ? <ReaderAvatar child={active} index={list.indexOf(active)} size={40} round /> : <Initial session={session} size={40} />}
        <span className="min-w-0 flex-1 truncate text-left max-sm:hidden">{active ? name : "Account"}</span>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`shrink-0 transition-transform max-sm:hidden ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <p role="status" aria-live="polite" className="sr-only">{said}</p>

      {/* Opens and closes with a short fade + drop (not an instant show/hide). Closed: invisible
          once the fade ends, and inert, so nothing in it can be reached. */}
      <div
        id={menuId}
        inert={!open}
        className={`absolute right-0 top-[calc(100%+8px)] z-50 max-h-[calc(100dvh-120px)] w-[300px] origin-top-right overflow-y-auto rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 transition-[opacity,scale,translate,visibility] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? "visible translate-y-0 scale-100 opacity-100" : "invisible -translate-y-1 scale-[0.98] opacity-0"
        }`}
      >
        {active ? (
          <>
            <Link href="/curation" onClick={done} className={`${ITEM} pb-3`}>
              <ReaderAvatar child={active} index={list.indexOf(active)} size={44} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-black/50">Adding books for</span>
                <span className="block truncate leading-tight">{name}</span>
              </span>
            </Link>
            <div className="border-t border-black/8 pt-1.5">
              {list
                .filter((c) => c.id !== active.id)
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      switchChild(c.id);
                      setSaid(`Now adding books for ${displayName(c.name)}`);
                      done();
                    }}
                    className={ITEM}
                  >
                    <ReaderAvatar child={c} index={list.indexOf(c)} size={32} round />
                    <span className="truncate">Switch to {displayName(c.name)}</span>
                  </button>
                ))}
              {list.length < MAX_CHILDREN && (
                <Link href="/reading-preferences?new=1" onClick={done} className={ITEM}>
                  <span aria-hidden className="grid size-8 place-items-center rounded-full border-2 border-dashed border-black/30 text-lg leading-none">+</span>
                  Add child
                </Link>
              )}
              <Link href="/children?manage=1" onClick={done} className={ITEM}>
                <span aria-hidden className="grid size-8 place-items-center">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" />
                  </svg>
                </span>
                Manage readers
              </Link>
            </div>
          </>
        ) : (
          <>
            <Link href="/curation" onClick={done} className={ITEM}>
              My child&apos;s books
            </Link>
            <Link href="/reading-preferences" onClick={done} className={ITEM}>
              Edit reading answers
            </Link>
          </>
        )}

        <div className="mt-1.5 border-t border-black/8 pt-1.5">
          <Link href="/box" onClick={done} className={`${ITEM} justify-between`}>
            My box
            {n > 0 && <span className="rounded-full bg-black px-2 py-0.5 text-sm text-white">{n}</span>}
          </Link>
          {/* The parent's Google account (real name and photo come from Google once sign-in is real). */}
          <div className="px-3 pb-1 pt-2">
            <p className="text-sm font-semibold text-black/50">Signed in with Google</p>
            <p className="truncate text-[15px]">{session.email}</p>
          </div>
          {/* Sign out asks first, in place (no dialog over a menu): the row turns into a short
              question with Sign out / Stay signed in. Leaving the menu cancels it. */}
          {/* Both stay mounted and swap with a height animation (grid rows 1fr <-> 0fr), so the
              menu grows smoothly instead of jumping. The hidden one is inert. */}
          <div
            inert={confirming}
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              confirming ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <button type="button" onClick={() => setConfirming(true)} className={`${ITEM} text-black/65`}>
                Sign out
              </button>
            </div>
          </div>
          <div
            inert={!confirming}
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              confirming ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <div role="group" aria-labelledby={`${menuId}-q`} className="mt-1 rounded-xl bg-[#fff3d6] p-3">
                <p id={`${menuId}-q`} className="text-lg font-semibold leading-tight tracking-[-0.01em]">
                  Sign out of KutuBooku?
                </p>
                <p className="mt-1 text-[15px] leading-snug text-black/65">
                  Your box and readers stay saved to your account for next time.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Let the menu fade away first, then sign out: the header's profile button
                      // then fades over to "Log-in / Sign-up" and a toast confirms it.
                      done();
                      setTimeout(() => {
                        signOut(); // account-only pages send you home
                        router.refresh();
                      }, CLOSE_MS);
                    }}
                    className={`h-11 flex-auto whitespace-nowrap rounded-full bg-black px-4 text-[15px] font-semibold text-white transition-colors hover:bg-black/80 ${FOCUS}`}
                  >
                    Sign out
                  </button>
                  <button
                    ref={stayRef}
                    type="button"
                    onClick={() => setConfirming(false)}
                    className={`h-11 flex-auto whitespace-nowrap rounded-full border-2 border-black/15 px-4 text-[15px] font-semibold transition-colors hover:border-black ${FOCUS}`}
                  >
                    Stay signed in
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
