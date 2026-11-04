"use client";

// "Who's choosing books today?" (C8): Netflix-style reader picker.
// Tap a reader → their books. "+ Add child" → the questions for a new reader.
// "Manage" → each tile opens that child's answers (edit, rename, remove).

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MAX_CHILDREN, commitDraft, displayName, switchChild, useChildren, type ChildProfile } from "../_lib/children";
import { useSession } from "../_lib/session";
import { useBox } from "../_lib/box";
import { ReaderAvatar } from "../_components/ReaderAvatar";

const FOCUS = "focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#1d2838]";

export function ChildPicker() {
  const router = useRouter();
  const session = useSession();
  const children = useChildren();
  const box = useBox();
  const [manage, setManage] = useState(false);

  useEffect(() => {
    if (session === undefined) return;
    if (session === null) {
      router.replace("/sign-in?next=/children");
      return;
    }
    commitDraft(); // answers given before signing in become the first reader
    if (new URLSearchParams(window.location.search).get("manage") === "1") setManage(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, [session, router]);

  if (!session || !children) return <div className="flex-1" aria-busy />;

  const list = children.list;
  const full = list.length >= MAX_CHILDREN;
  const booksFor = (c: ChildProfile) => box?.items.filter((i) => i.child === displayName(c.name)).length ?? 0;

  if (!list.length) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <h1 className="type-display">Let&apos;s meet your first reader</h1>
        <p className="mt-4 max-w-xl type-body-lg text-[#1d2838]/70">A few quick questions and we&apos;ll pick books just for them.</p>
        <Link href="/reading-preferences" className={`mt-10 inline-flex h-14 items-center rounded-full bg-[#1d2838] px-7 type-button text-white ${FOCUS}`}>
          Start the questions
        </Link>
      </main>
    );
  }

  const open = (c: ChildProfile) => {
    if (manage) return router.push(`/reading-preferences?child=${c.id}`);
    switchChild(c.id);
    router.push("/curation");
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-5 pb-16 pt-10 text-center sm:pt-16">
      <h1 className="type-display">{manage ? "Manage readers" : "Who's choosing books today?"}</h1>
      <p className="mt-3 type-body-lg text-[#1d2838]/70">
        {manage ? "Tap a reader to change their answers, rename or remove them." : "Each reader gets their own books. One box for the whole family."}
      </p>

      <ul className="mt-10 grid w-full grid-cols-2 justify-items-center gap-x-4 gap-y-8 sm:mt-14 sm:grid-cols-3 lg:flex lg:flex-wrap lg:justify-center lg:gap-10">
        {list.map((c, i) => {
          const n = booksFor(c);
          const name = displayName(c.name);
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => open(c)}
                aria-label={manage ? `Edit ${name}` : `${name}${n ? `, ${n} in the box` : ""}`}
                className={`group flex w-[132px] flex-col items-center gap-3 rounded-[32px] sm:w-[150px] ${FOCUS}`}
              >
                <span className="relative transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1 group-hover:scale-105 motion-reduce:transition-none">
                  <ReaderAvatar child={c} index={i} size={132} />
                  {manage ? (
                    <span aria-hidden className="absolute inset-0 grid place-items-center rounded-[28%] bg-[#1d2838]/55 text-white">
                      <svg viewBox="0 0 24 24" className="size-9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" />
                      </svg>
                    </span>
                  ) : n ? (
                    <span aria-hidden className="absolute -right-2 -top-2 grid h-8 min-w-8 place-items-center rounded-full bg-[#1d2838] px-2 text-sm font-bold text-white">
                      {n}
                    </span>
                  ) : null}
                </span>
                <span className="max-w-full truncate type-option">{name}</span>
              </button>
            </li>
          );
        })}

        <li>
          {full ? (
            <p className="flex h-[132px] w-[132px] items-center rounded-[28%] border-2 border-dashed border-[#1d2838]/25 p-4 text-sm font-semibold text-[#1d2838]/60 sm:w-[150px]">
              {MAX_CHILDREN} readers is the most for one account
            </p>
          ) : (
            <Link href="/reading-preferences?new=1" className={`group flex w-[132px] flex-col items-center gap-3 rounded-[32px] sm:w-[150px] ${FOCUS}`}>
              <span className="grid size-[132px] place-items-center rounded-[28%] border-2 border-dashed border-[#1d2838]/35 transition-colors group-hover:border-[#1d2838] group-hover:bg-white/40">
                <svg viewBox="0 0 24 24" className="size-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <span className="type-option">Add child</span>
            </Link>
          )}
        </li>
      </ul>

      <button
        type="button"
        onClick={() => setManage((m) => !m)}
        aria-pressed={manage}
        className={`mt-12 h-12 rounded-full border-2 border-[#1d2838]/25 px-6 type-label transition-colors hover:border-[#1d2838] ${manage ? "bg-[#1d2838] text-white" : ""} ${FOCUS}`}
      >
        {manage ? "Done" : "Manage readers"}
      </button>
    </main>
  );
}
