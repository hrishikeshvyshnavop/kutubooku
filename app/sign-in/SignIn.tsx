"use client";

// Sign-in page. Works from anywhere: ?next= says where to go afterwards (the header passes the
// current page; the questionnaire passes /curation; the box passes /box). Copy follows the reason.
// Already signed in → "You're signed in" with Continue and Sign out.
// ⚠️ Google sign-in is simulated (app/_lib/session.ts); real OAuth is a dev-team task.

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowIcon, Button, GoogleButton, OutlineButton, childNameOf, readAnswers } from "../_components/curation/ui";
import { safeNext, signIn, signOut, useSession } from "../_lib/session";

type Reason = "curation" | "box" | "general";

const reasonOf = (next: string): Reason => (next.startsWith("/curation") ? "curation" : next.startsWith("/box") ? "box" : "general");

export function SignIn() {
  const router = useRouter();
  const session = useSession();
  const [name, setName] = useState("");
  const [next, setNext] = useState("/");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Client-only reads (sessionStorage + query string).
    const n = childNameOf(readAnswers());
    setName(n); // eslint-disable-line react-hooks/set-state-in-effect
    setNext(safeNext(new URLSearchParams(window.location.search).get("next"), n ? "/curation" : "/"));
  }, []);

  const reason = reasonOf(next);
  const who = name || "your child";

  const doSignIn = () => {
    setBusy(true);
    signIn();
    router.push(next);
  };

  const title =
    reason === "curation" ? `Sign in to see ${name ? `${name}'s` : "your"} books` : reason === "box" ? "Sign in to save your box" : "Sign in to KutuBooku";

  const perks = [
    name ? `Save ${who}'s answers and books` : "Save your child's answers and books",
    "Keep your box on your phone and laptop",
    "Get a fresh curation every month",
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col p-2.5 sm:p-3">
      <div className="grid flex-1 gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-3">
        {/* Left panel: why sign in */}
        <aside className="rounded-[28px] bg-[#9fcbf2] p-5 sm:rounded-[48px] sm:p-8 lg:min-h-[min(560px,calc(100dvh-14rem))]">
          <p className="type-label text-[#1d2838]/80">{reason === "curation" ? "Almost there" : "Why sign in"}</p>
          <p className="mt-4 type-lead sm:mt-6">Signing in keeps your family&apos;s books safe so we can:</p>
          <ul className="mt-5 space-y-3 type-body sm:mt-8">
            {perks.map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span aria-hidden className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-[#1d2838] text-white">
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Right panel: the action */}
        <main className="flex flex-col rounded-[36px] bg-[#fffdf8] px-page-inset pb-6 pt-8 sm:rounded-[56px] sm:pt-12 lg:rounded-b-none lg:rounded-t-[64px] lg:pt-16">
          {session ? (
            <>
              <h1 className="max-w-[16ch] type-display">You&apos;re signed in</h1>
              <p className="mt-4 max-w-xl type-body-lg text-[#1d2838]/70">
                Signed in with Google as <span className="font-semibold text-[#1d2838]">{session.email}</span>.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Button variant="primary" onClick={() => router.push(next)} arrow="right">
                  Continue
                </Button>
                <OutlineButton onClick={signOut} label="Sign out">
                  Sign out
                </OutlineButton>
              </div>
            </>
          ) : (
            <>
              <h1 className="max-w-[16ch] type-display">{title}</h1>
              <p className="mt-4 max-w-xl type-body-lg text-[#1d2838]/70">One tap with your Google account. No new password to remember.</p>

              <div className="mt-10 flex flex-col items-start gap-3">
                {/* Google sign-in button — follows Google's Sign-In branding guidelines */}
                <GoogleButton onClick={doSignIn} busy={busy || session === undefined} />
                <p className="max-w-md type-caption text-[#1d2838]/60">
                  We only use your Google name and email to save your family&apos;s books and send the monthly picks. We never post anything or
                  share {name ? `${name}'s` : "your child's"} details.
                </p>
              </div>
            </>
          )}

          <div className="sticky bottom-0 z-10 -mx-2 mt-auto flex items-center justify-start rounded-t-[24px] bg-[#fffdf8]/90 px-2 pb-3 pt-6 backdrop-blur">
            {reason === "curation" ? (
              <OutlineButton onClick={() => router.push("/reading-preferences")} label="Back to your answers">
                <ArrowIcon dir="left" />
                Back to answers
              </OutlineButton>
            ) : (
              <OutlineButton onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))} label="Go back">
                <ArrowIcon dir="left" />
                Back
              </OutlineButton>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
