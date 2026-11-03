"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowIcon,
  GoogleButton,
  OutlineButton,
  SIGNED_IN_KEY,
  childNameOf,
  readAnswers,
} from "../_components/curation/ui";

/** Only allow same-site relative paths as the post-sign-in destination. */
function safeNext(raw: string | null) {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/curation";
}

export function SignIn() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [next, setNext] = useState("/curation");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Client-only reads (sessionStorage + query string).
    setName(childNameOf(readAnswers())); // eslint-disable-line react-hooks/set-state-in-effect
    setNext(safeNext(new URLSearchParams(window.location.search).get("next")));
  }, []);

  const who = name || "your child";

  const signIn = () => {
    // ⚠️ PLACEHOLDER: real "Sign in with Google" (OAuth) is a dev-team task
    // (Payload auth + Google provider). This only simulates a signed-in session
    // so the curation screens can be designed and tested.
    setBusy(true);
    try {
      sessionStorage.setItem(SIGNED_IN_KEY, "1");
    } catch {
      /* ignore */
    }
    router.push(next);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col p-2.5 sm:p-3">
      <div className="grid flex-1 gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-3">
        {/* Left panel: why sign in */}
        <aside className="rounded-[28px] bg-[#9fcbf2] p-5 sm:rounded-[48px] sm:p-8 lg:min-h-[min(560px,calc(100dvh-14rem))]">
          <p className="type-label text-[#1d2838]/80">Almost there</p>
          <p className="mt-4 type-lead sm:mt-6">
            Signing in keeps {who}&apos;s profile safe so we can:
          </p>
          <ul className="mt-5 space-y-3 type-body sm:mt-8">
            {[
              `Save ${who}'s answers and books`,
              "Send a fresh curation every month",
              "Put every child's books in one Amazon cart",
            ].map((t) => (
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
        <main className="flex flex-col rounded-[36px] bg-[#fffdf8] px-5 pb-6 pt-8 sm:rounded-[56px] sm:px-10 sm:pt-12 lg:rounded-b-none lg:rounded-t-[64px] lg:px-[6%] lg:pt-16">
          <h1 className="max-w-[16ch] type-display">
            Sign in to see {name ? `${name}'s` : "your"} books
          </h1>
          <p className="mt-4 max-w-xl type-body-lg text-[#1d2838]/70">
            One tap with your Google account. No new password to remember.
          </p>

          <div className="mt-10 flex flex-col items-start gap-3">
            {/* Google sign-in button — follows Google's Sign-In branding guidelines */}
            <GoogleButton onClick={signIn} busy={busy} />
            <p className="max-w-md type-caption text-[#1d2838]/60">
              We only use your Google name and email to save {who}&apos;s profile and send their monthly books. We never post
              anything or share {who}&apos;s details.
            </p>
          </div>

          <div className="sticky bottom-0 z-10 -mx-2 mt-auto flex items-center justify-start rounded-t-[24px] bg-[#fffdf8]/90 px-2 pb-3 pt-6 backdrop-blur">
            <OutlineButton onClick={() => router.push("/")} label="Back to your answers">
              <ArrowIcon dir="left" />
              Back to answers
            </OutlineButton>
          </div>
        </main>
      </div>
    </div>
  );
}
