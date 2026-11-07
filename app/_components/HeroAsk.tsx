"use client";

// "Ask KutuBooku AI" at the bottom of the home hero: a small chat.
//
// Flow: ask (type or tap a suggestion) → the reply card grows up out of the box →
// your question pops in as a bubble → thinking (bouncing dots, shimmering cover
// placeholders) → the answer types out → three picks are dealt in, each with why it
// matched → follow-up chips continue the thread ("Show me 3 more", "Something funnier"…).
// Close (×, Escape) shrinks the card back into the box.
//
// While open, the hero carousel pauses and dims (onOpenChange).
// Look: the box is one white pill with the amber send button inline at its right end;
// suggestions and follow-ups are amber pills like the header nav; picks use the book page colours.
// Focus: the box lifts 2px, the field gets a 3px AI-gradient ring + soft gradient glow, the sparkle
// turns, the placeholder dims; the arrow stays pale until there is text to send;
// while the AI is "thinking" an AI-gradient bar sweeps along the bottom of the field.
// Answers are MOCK for now (app/_data/ask-mock.ts).
// Reduced motion: no shimmer, typing or entrance animations; answers show at once.

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { askMock } from "../_data/ask-mock";
import { ChatScrollArea } from "./ChatScrollArea";
import { KutuAvatar } from "./KutuAvatar";
import { useCardBox } from "./useCardBox";
import { BoxToggleButton } from "./BoxToggleButton";
import { useSession } from "../_lib/session";
import { activeOf, displayName, useChildren } from "../_lib/children";
import { loadThread, saveThread, threadKey, type AskTurn } from "../_lib/ask-history";

const SUGGESTIONS = ["My 6-year-old loves animals", "A brave book for a shy 5-year-old", "Something funny for bedtime"];
// Cycling placeholder examples
// Sentence case. Tab puts the one showing into the field.
const EXAMPLES = [
  "A book for my 5-year-old who loves space",
  "Something calming for a worried 4-year-old",
  "My daughter wants to be an artist",
  "A funny read-aloud for bedtime",
];

// Design language: flat solid colours, bold black type, amber pills (header nav),
// split blocks with an arrow square (header CTA), and the book page's chip colours.
const SUGGEST_PILL =
  "flex h-10 items-center whitespace-nowrap rounded-full bg-[#fbbe63] px-4 text-base font-semibold leading-none tracking-[-0.01em] text-black transition-[background-color,scale] duration-200 hover:bg-[#f9a220] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:h-11 sm:text-lg";
// Pick cards and question bubble use the book page's colours (BookPdp CHIP_TONES / GLANCE_TONES).
const PICK_TONES = ["bg-[#ffe75e]", "bg-[#b6beff]", "bg-[#ffd0b2]"];

const THINK_MS = 1200;
const CHARS_PER_MS = 0.1;
const CLOSE_MS = 240;
const TILTS = [-2.5, 1.5, -1]; // resting tilt (deg) of the three picks

type Turn = AskTurn;
type Stage = "thinking" | "typing" | "done";

/** `docked`: floating over the page below the hero (AskDock): just the pill, with a shadow. */
export function HeroAsk({ onOpenChange, docked = false }: { onOpenChange?: (open: boolean) => void; docked?: boolean }) {
  const [value, setValue] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  // The chat is saved per account + child (app/_lib/ask-history.ts). Closing the card only hides
  // it; "Clear" ends it. `shown`: the card is open.
  const [shown, setShown] = useState(false);
  const session = useSession();
  const kids = useChildren();
  const child = session ? activeOf(kids) : null;
  const childName = child ? displayName(child.name) : "";
  // undefined until we know who's signed in (server render / hydration)
  const key = session === undefined ? undefined : threadKey(session?.email ?? null, child?.id ?? null);
  const [loadedKey, setLoadedKey] = useState<string | undefined>(undefined);
  const [stage, setStage] = useState<Stage>("done");
  const [typed, setTyped] = useState(0);
  const [closing, setClosing] = useState(false);
  const [focused, setFocused] = useState(false);
  // "Add to box" on the picks: same box, toast and fly-to-box as the book cards.
  const { whoseBox, cardProps, toastEl } = useCardBox();
  const pickBox = (id: string) => {
    const { selected, onToggle } = cardProps(id);
    return { selected, onToggle };
  };
  const [example, setExample] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduced = useRef(false);

  // Who's asking changed (first load, sign in/out, another child picked): show that thread, closed.
  if (key !== loadedKey) {
    setLoadedKey(key);
    const saved = key ? loadThread(key) : [];
    setTurns(saved);
    setShown(false);
    setStage("done");
  }
  // Save every change to the thread it belongs to.
  useEffect(() => {
    if (key && key === loadedKey) saveThread(key, turns);
  }, [key, loadedKey, turns]);

  const open = shown && turns.length > 0;
  const latest = turns[turns.length - 1];

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => onOpenChange?.(open && !closing), [open, closing, onOpenChange]);

  // Cycle the placeholder while the box is empty and not focused.
  useEffect(() => {
    if (focused || value || reduced.current) return;
    const t = setInterval(() => setExample((i) => (i + 1) % EXAMPLES.length), 3200);
    return () => clearInterval(t);
  }, [focused, value]);

  /** `extra`: what a follow-up adds to the earlier query (defaults to the question). */
  const ask = (q: string, context?: Turn, extra?: string) => {
    const question = q.trim();
    if (!question || stage !== "done") return;
    // Follow-ups build on the earlier query and skip books already shown.
    const shown = turns.flatMap((t) => t.answer.picks.map((p) => p.book.id));
    const query = context ? `${context.query} ${extra ?? question}`.trim() : question;
    const answer = askMock(query, context ? shown : [], context ? question : undefined);
    setTurns((ts) => [...ts, { id: ts.reduce((m, t) => Math.max(m, t.id), 0) + 1, question, query, answer }]);
    setShown(true);
    setValue("");
    setTyped(0);
    setStage(reduced.current ? "done" : "thinking");
  };

  /** Close the card; the chat stays saved. `clear` also ends it. */
  const close = useCallback((clear = false) => {
    const finish = () => {
      setShown(false);
      setClosing(false);
      setStage("done");
      if (clear) setTurns([]);
    };
    inputRef.current?.focus();
    if (reduced.current) return finish();
    setClosing(true);
    setTimeout(finish, CLOSE_MS);
  }, []);

  // thinking → typing → done (latest turn only)
  useEffect(() => {
    if (stage === "thinking") {
      const t = setTimeout(() => setStage("typing"), THINK_MS);
      return () => clearTimeout(t);
    }
    if (stage !== "typing" || !latest) return;
    const text = latest.answer.text;
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const n = Math.floor((now - t0) * CHARS_PER_MS);
      if (n >= text.length) {
        setTyped(text.length);
        setStage("done");
        return;
      }
      setTyped(n);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [stage, latest]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Follow-ups for the latest answer
  const followUps = latest
    ? [
        latest.answer.picks.length > 0 && "Show me 3 more",
        !latest.answer.interests.includes("funny") && "Something funnier",
        !/bed|calm/i.test(latest.question) && "Calm, for bedtime",
        latest.answer.age !== undefined && latest.answer.age > 2 && `For a ${latest.answer.age - 2}-year-old`,
      ].filter(Boolean) as string[]
    : [];
  // What each follow-up adds to the query ("Show me 3 more" adds nothing: same ask, new books).
  const followUpExtra = (f: string) => (f === "Show me 3 more" ? "" : f === "Calm, for bedtime" ? "calm bedtime feelings" : f);

  const thinkingNow = stage === "thinking";

  return (
    <div className="relative mx-auto w-full max-w-[760px]">
      {/* ------------------------------ Suggestions ------------------------------ */}
      {/* Amber pills, like the header nav (smaller). The last one or two hide on phones to keep one row. */}
      <ul
        aria-label="Try asking"
        className={`mb-3 flex flex-wrap items-center justify-center gap-1.5 transition-[opacity,translate] duration-300 ${docked ? "hidden" : open ? "pointer-events-none translate-y-2 opacity-0" : ""}`}
        aria-hidden={open || docked || undefined}
      >
        {/* A saved chat: pick up where you left off (first, so it's the one phones keep). */}
        {turns.length > 0 && (
          <li className="animate-[ask-ph-in_500ms_cubic-bezier(0.22,1,0.36,1)_both]">
            <button type="button" tabIndex={open ? -1 : 0} onClick={() => setShown(true)} className={`${SUGGEST_PILL} gap-2 !bg-black !text-white hover:!bg-black/80`}>
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z" />
              </svg>
              {childName ? `Continue ${childName}'s chat` : "Continue your chat"}
            </button>
          </li>
        )}
        {SUGGESTIONS.map((s, i) => (
          <li
            key={s}
            style={{ animationDelay: `${i * 80}ms` }}
            className={`animate-[ask-ph-in_500ms_cubic-bezier(0.22,1,0.36,1)_both] ${i > (turns.length > 0 ? -1 : 0) ? "max-sm:hidden" : ""}`}
          >
            <button
              type="button"
              tabIndex={open ? -1 : 0}
              onClick={() => ask(s)}
              className={SUGGEST_PILL}
            >
              {s}
            </button>
          </li>
        ))}
      </ul>

      {/* Card + box share one anchor and read as one stacked unit: the reply card opens 8px above the ask box
          (law of proximity: same gap as field to arrow). One large radius for all three pieces: card,
          field (a pill) and arrow (a circle) all use 32px. Not above the suggestions, which stay hidden behind it. */}
      <div className="relative">
        {/* ------------------------------ Reply card ------------------------------ */}
        {open && (
          <section
            aria-label="Chat with KutuBooku AI"
            className={`absolute inset-x-0 bottom-full mb-2 origin-bottom overflow-hidden rounded-[32px] bg-[#fffdf8] text-black shadow-[0_24px_48px_-28px_rgba(0,0,0,0.45)] ${
              closing ? "animate-[ask-pop-out_240ms_cubic-bezier(0.4,0,1,1)_both]" : "animate-[ask-pop-in_520ms_cubic-bezier(0.22,1.2,0.36,1)_both]"
            }`}
          >
            {/* top bar */}
            <div className="flex items-center justify-between gap-3 px-5 pb-1 pt-4 sm:px-7 sm:pt-5">
              <p className="flex items-center gap-2.5 text-lg font-bold leading-none tracking-[-0.02em]">
                {/* the assistant's face: the KutuBooku mascot (wiggles while it reads) */}
                <KutuAvatar size={40} thinking={thinkingNow} />
                KutuBooku AI
                <span className="-rotate-3 font-[family-name:var(--font-caveat)] text-[22px] font-normal text-[#3b308f]">{childName ? `for ${childName}` : "book finder"}</span>
              </p>
              <div className="flex items-center gap-1.5">
              {/* Ends the saved chat (closing only hides it). */}
              <button
                type="button"
                onClick={() => close(true)}
                disabled={stage !== "done"}
                className="h-10 rounded-full px-3.5 text-base font-semibold text-black/60 transition-colors hover:bg-black/5 hover:text-black disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-black"
              >
                Clear chat
              </button>
              <button
                type="button"
                onClick={() => close()}
                aria-label="Close chat"
                className="grid size-10 place-items-center rounded-full bg-[#fbbe63] text-black transition-[background-color,rotate] duration-300 hover:rotate-90 hover:bg-[#f9a220] focus-visible:outline-2 focus-visible:outline-black"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              </div>
            </div>

            {/* thread: our own scrollbar (inset pill + edge fades); follows the newest message */}
            <ChatScrollArea
              followKey={`${turns.length}-${stage}`}
              className="max-h-[min(480px,calc(100dvh-380px))] space-y-6 px-5 py-5 sm:px-7"
            >
              {turns.map((t) => {
                const isLatest = t === latest;
                const st: Stage = isLatest ? stage : "done";
                return (
                  <div key={t.id} className="space-y-3">
                    {/* question bubble */}
                    <p className="ml-auto w-fit max-w-[85%] origin-bottom-right animate-[ask-bubble-in_420ms_cubic-bezier(0.34,1.56,0.64,1)_both] rounded-[20px] rounded-br-md bg-[#3f309b] px-4 py-2.5 text-base font-semibold leading-snug tracking-[-0.01em] text-white sm:text-lg">
                      {t.question}
                    </p>

                    {/* answer */}
                    <div aria-live={isLatest ? "polite" : undefined}>
                      {st === "thinking" ? (
                        <Thinking />
                      ) : (
                        <p className="text-lg font-medium leading-[1.25] tracking-[-0.01em] sm:text-xl">
                          <span className="sr-only">{st === "done" ? t.answer.text : ""}</span>
                          <span aria-hidden>
                            {t.answer.text.slice(0, st === "done" ? undefined : typed)}
                            {st === "typing" && <span className="ml-0.5 inline-block h-[0.95em] w-[2px] translate-y-[3px] animate-[caret_0.9s_steps(1)_infinite] bg-current" />}
                            <span className="text-transparent">{st === "done" ? "" : t.answer.text.slice(typed)}</span>
                          </span>
                        </p>
                      )}
                    </div>

                    {/* picks */}
                    {st === "done" && t.answer.picks.length > 0 && (
                      <ul className="grid grid-cols-3 gap-2 pt-1 sm:gap-3">
                        {t.answer.picks.map((p, i) => (
                          <li
                            key={p.book.id}
                            style={{ "--r": `${TILTS[i % TILTS.length]}deg`, animationDelay: `${isLatest ? i * 110 : 0}ms` } as React.CSSProperties}
                            className="animate-[ask-card-in_560ms_cubic-bezier(0.34,1.4,0.64,1)_both]"
                          >
                            {/* The card: the book link on top, "Add to box" underneath (a button can't sit inside a link). */}
                            <div
                              className={`group flex h-full rotate-[var(--r)] flex-col rounded-[20px] p-2 text-black transition-[rotate,translate] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1.5 hover:rotate-0 focus-within:rotate-0 sm:p-2.5 ${PICK_TONES[i % PICK_TONES.length]}`}
                            >
                              <Link href={`/books/${p.book.id}`} className="block flex-1 rounded-[12px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
                                <span data-book-cover={p.book.id} className="relative block aspect-square overflow-hidden rounded-r-[8px] rounded-l-[3px]">
                                  <Image src={p.book.cover} alt="" fill sizes="180px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                                </span>
                                <span className="mt-2 block w-fit rounded-full bg-black px-2.5 py-1 text-xs font-semibold leading-none text-white">{p.reason}</span>
                                <span className="mt-1.5 line-clamp-2 block text-sm font-bold leading-tight tracking-[-0.01em] sm:text-base">{p.book.title}</span>
                                <span className="flex items-center gap-1 text-xs font-semibold opacity-60">
                                  Ages {p.book.ageMin}–{p.book.ageMax}
                                  <span aria-hidden className="ml-auto -translate-x-1 opacity-0 transition-[opacity,translate] duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                                    →
                                  </span>
                                </span>
                              </Link>
                              <BoxToggleButton
                                {...pickBox(p.book.id)}
                                title={p.book.title}
                                whoseBox={whoseBox}
                                addLabel="Add to box"
                                inLabel="In box"
                                fill={{ bg: "#000", fg: "#fff" }}
                                size="sm"
                                className="mt-2 w-full"
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}

              {/* next steps for the latest answer */}
              {stage === "done" && latest && (
                <div className="animate-[ask-pop-in_420ms_cubic-bezier(0.22,1,0.36,1)_both] space-y-3 [animation-delay:250ms]">
                  {followUps.length > 0 && (
                    <ul aria-label="Follow-up questions" className="flex flex-wrap gap-1.5">
                      {followUps.map((f) => (
                        <li key={f}>
                          <button
                            type="button"
                            onClick={() => ask(f, latest, followUpExtra(f))}
                            className={SUGGEST_PILL}
                          >
                            {f}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {/* Split CTA, same as the header's (label block + arrow square); the label may wrap on phones. */}
                  <Link
                    href="/reading-preferences"
                    className="group flex min-h-14 items-stretch gap-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                  >
                    <span className="flex flex-1 items-center rounded-lg bg-[#f9a220] px-5 py-3 text-lg font-bold leading-tight tracking-[-0.02em] text-black transition-colors group-hover:bg-[#e8900c] sm:text-xl">
                      {latest.answer.age !== undefined ? `Get a full curation for a ${latest.answer.age}-year-old` : "Get a full curation for my child"}
                    </span>
                    <span className="grid w-14 shrink-0 place-items-center rounded-lg bg-[#f9a220] transition-colors group-hover:bg-[#e8900c]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/icons/arrow-right.svg" alt="" width={18.6562} height={16} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </div>
              )}
            </ChatScrollArea>
          </section>
        )}

        {/* ------------------------------ Ask box ------------------------------ */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(value, open ? latest : undefined);
          }}
          // One pill: sparkle, field, and the send button inline at its right end.
          // Focus: the whole box lifts 2px.
          className={`relative flex h-16 items-stretch transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            focused ? "-translate-y-0.5" : ""
          }`}
        >
          {/* Focus (and while thinking): the field's usual focus pattern, a still 3px ring with a soft
              glow just under it, in the AI gradient instead of brand amber (--ai-gradient-line,
              globals.css). Both are layers behind the pill that only fade in and out (opacity). */}
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-x-8 -bottom-2.5 top-1/2 rounded-full bg-[image:var(--ai-gradient-line)] blur-[14px] transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${focused || thinkingNow ? "opacity-50" : "opacity-0"}`}
          />
          <span
            aria-hidden
            className={`pointer-events-none absolute -inset-[3px] rounded-[35px] bg-[image:var(--ai-gradient-line)] transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${focused || thinkingNow ? "opacity-100" : "opacity-0"}`}
          />
          <div className={`relative flex min-w-0 flex-1 items-center gap-3 overflow-hidden rounded-[32px] bg-white pl-[14px] pr-2 transition-shadow duration-300 ${docked ? "shadow-[0_18px_40px_-16px_rgba(29,40,56,0.45),0_0_0_1px_rgba(29,40,56,0.06)]" : ""}`}>
            {/* while the AI is thinking, an AI-gradient bar sweeps along the bottom of the field */}
            {/* Moves with transform (GPU, no repaint) and only runs while thinking: it used to animate
                background-position forever, repainting every frame even while invisible. */}
            <span aria-hidden className={`absolute inset-x-0 bottom-0 h-1 overflow-hidden transition-opacity duration-300 ${thinkingNow ? "opacity-100" : "opacity-0"}`}>
              <span
                className={`absolute inset-y-0 left-0 w-[250%] animate-[ai-sweep_1.2s_linear_infinite] bg-[linear-gradient(90deg,transparent_0%,transparent_30%,#7c5cff_40%,#4f8bff_47%,#22c7d6_53%,#ff6ac1_60%,transparent_70%,transparent_100%)] ${thinkingNow ? "" : "[animation-play-state:paused]"}`}
              />
            </span>
            {/* who you're asking: the mascot, concentric in the pill's round end (48px in a 64px pill) */}
            <KutuAvatar size={48} thinking={thinkingNow} className={`-ml-1.5 transition-transform duration-500 ${focused ? "scale-105" : ""}`} />
            <label htmlFor="hero-ask" className="sr-only">
              Ask KutuBooku AI for a book
            </label>
            <span id="hero-ask-tab" className="sr-only">
              Suggestion: {EXAMPLES[example]}. Press Tab to use it.
            </span>
            <div className="relative min-w-0 flex-1">
              <input
                ref={inputRef}
                id="hero-ask"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => {
                  // Tab on an empty field takes the suggestion showing (then Tab moves on as usual).
                  if (e.key === "Tab" && !e.shiftKey && !value && !open) {
                    e.preventDefault();
                    setValue(EXAMPLES[example]);
                  }
                }}
                aria-describedby={!value && !open ? "hero-ask-tab" : undefined}
                autoComplete="off"
                // No outline on the input itself: the field around it shows the AI gradient focus ring.
                className="w-full bg-transparent text-lg font-semibold tracking-[-0.02em] text-black outline-none sm:text-xl"
              />
              {/* animated placeholder */}
              {!value && (
                // Dims a little more on focus, so the caret reads as "your turn".
                <span aria-hidden className={`pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center overflow-hidden text-lg font-semibold tracking-[-0.02em] transition-colors duration-300 sm:text-xl ${focused ? "text-black/25" : "text-black/40"}`}>
                  {/* (The visible "Ask KutuBooku AI:" prefix was removed on 2026-11-05; the examples speak for themselves.) */}
                  {open && <span className="shrink-0">Ask a follow-up…</span>}
                  {!open && (
                    <span key={example} className="truncate animate-[ask-ph-in_420ms_cubic-bezier(0.22,1,0.36,1)_both]">
                      {EXAMPLES[example]}
                    </span>
                  )}
                  {/* Tab hint (keyboards only, so not on touch screens) */}
                  {!open && (
                    <kbd className="ml-auto hidden shrink-0 rounded-md border border-black/15 bg-white/60 px-1.5 py-0.5 font-sans text-[12px] font-semibold leading-none tracking-normal text-black/45 [@media(hover:hover)]:sm:inline-block">
                      Tab
                    </kbd>
                  )}
                </span>
              )}
            </div>
            {/* Inline send button: a 48px circle inside the pill, 8px from its top, bottom and right
                edge, so it sits concentric in the pill's round end (32px radius outside, 24px inside). */}
            <button
              type="submit"
              disabled={!value.trim() || stage !== "done"}
              aria-label="Ask"
              // Pale and slightly smaller until there's something to send; springs to full amber once you type.
              className="group grid size-12 shrink-0 place-items-center rounded-full bg-[#f9a220] text-black transition-[background-color,opacity,scale] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:bg-[#e8900c] active:scale-[0.94] disabled:scale-90 disabled:bg-[#fbbe63] disabled:opacity-70 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-black"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/arrow-right.svg" alt="" width={18.6562} height={16} className="transition-transform duration-300 group-enabled:group-hover:translate-x-0.5" />
            </button>
          </div>
        </form>
      </div>
      {/* "Added to box" toast for the picks */}
      {toastEl}
    </div>
  );
}

/** Thinking: bouncing dots + shimmering placeholders shaped like the answer and three covers. */
function Thinking() {
  const bar = "animate-[ai-shimmer_1.4s_linear_infinite] rounded-md bg-[linear-gradient(90deg,#efede8_0%,#efede8_40%,#faf8f4_50%,#efede8_60%,#efede8_100%)] bg-[length:250%_100%]";
  return (
    <div aria-label="KutuBooku AI is thinking" role="status" className="space-y-3">
      <p className="flex items-center gap-2 text-base font-semibold tracking-[-0.01em]">
        <span className="flex gap-1" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ animationDelay: `${i * 140}ms` }} className="size-1.5 animate-[ask-dot_1s_ease-in-out_infinite] rounded-full bg-black" />
          ))}
        </span>
        <span className="animate-[ai-shimmer_1.6s_linear_infinite] bg-[linear-gradient(90deg,#000_0%,#000_35%,#f9a220_50%,#000_65%,#000_100%)] bg-[length:250%_100%] bg-clip-text text-transparent">
          Looking through the shelf…
        </span>
      </p>
      <div className="space-y-2" aria-hidden>
        <div className={`h-4 w-[92%] ${bar}`} />
        <div className={`h-4 w-[70%] ${bar}`} />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ animationDelay: `${i * 120}ms` }} className={`aspect-square rounded-[18px] ${bar}`} />
        ))}
      </div>
    </div>
  );
}
