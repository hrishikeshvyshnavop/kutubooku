"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { askMock } from "../_data/ask-mock";
import { loadThread, saveThread, threadKey, type AskTurn } from "../_lib/ask-history";
import { activeOf, displayName, useChildren } from "../_lib/children";
import { useSession } from "../_lib/session";
import { AddToBoxButton } from "./AddToBoxButton";
import { AiAvatar } from "./AiAvatar";
import { ChildAvatar } from "./ChildAvatar";
import { useAddToBox } from "./useAddToBox";

const SETTLE_MS = 450;
const noop = () => () => {};

export function AiChat({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const client = useSyncExternalStore(noop, () => true, () => false);
  const slotRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const [docked, setDocked] = useState(false);
  const openRef = useRef(false);

  const handleOpen = useCallback(
    (o: boolean) => {
      openRef.current = o;
      onOpenChange?.(o);
    },
    [onOpenChange],
  );

  useEffect(() => {
    const slot = slotRef.current;
    const dock = dockRef.current;
    if (!client || !slot || !dock) return;
    const bar = dock.firstElementChild as HTMLElement;
    const ro = new ResizeObserver(() => {
      if (!dock.hasAttribute("data-docked")) slot.style.height = `${bar.offsetHeight}px`;
    });
    ro.observe(bar);

    const cover = document.querySelector<HTMLElement>("[data-covers-hero]");
    const main = dock.ownerDocument.querySelector("main");
    let raf = 0;
    let settle = 0;
    let wasDocked = false;
    const engaged = () => openRef.current || dock.matches(":focus-within") || !!dock.querySelector<HTMLInputElement>("input")?.value;
    const setHidden = (h: boolean) => {
      if (h) dock.dataset.hidden = "";
      else delete dock.dataset.hidden;
    };
    const update = (scrolling: boolean) => {
      const vh = window.innerHeight;
      const isDocked = !!cover && cover.getBoundingClientRect().top < vh - 4;
      if (isDocked !== wasDocked) {
        wasDocked = isDocked;
        if (isDocked) dock.dataset.docked = "";
        else delete dock.dataset.docked;
        setDocked(isDocked);
      }
      const atFooter = !!main && main.getBoundingClientRect().bottom < vh - 4;
      setHidden(atFooter || (isDocked && scrolling && !engaged()));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => update(true));
      clearTimeout(settle);
      settle = window.setTimeout(() => update(false), SETTLE_MS);
    };
    update(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(settle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [client]);

  const ask = <HeroAsk onOpenChange={handleOpen} docked={docked} />;

  return (
    <>
      <div ref={slotRef} className="relative z-20 flex-none px-page pb-6 sm:pb-10">
        {!client && ask}
      </div>
      {client &&
        createPortal(
          <div
            ref={dockRef}
            data-toast-avoid
            className="pointer-events-none fixed inset-x-0 bottom-0 z-30 [&:not([data-docked])]:bottom-[calc(100dvh-100svh)] px-page pb-6 transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[hidden]:pointer-events-none data-[hidden]:translate-y-[calc(100%+16px)] data-[hidden]:opacity-0 motion-reduce:transition-none sm:pb-10 [&[data-hidden]_*]:!pointer-events-none"
          >
            <div className="pointer-events-auto mx-auto w-full max-w-[760px]">{ask}</div>
          </div>,
          document.body,
        )}
    </>
  );
}

const SUGGESTIONS = ["My 6-year-old loves animals", "A brave book for a shy 5-year-old", "Something funny for bedtime"];
const EXAMPLES = [
  "A book for my 5-year-old who loves space",
  "Something calming for a worried 4-year-old",
  "My daughter wants to be an artist",
  "A funny read-aloud for bedtime",
];

const SUGGEST_PILL =
  "flex h-10 items-center whitespace-nowrap rounded-full bg-[#fbbe63] px-4 text-base font-semibold leading-none tracking-[-0.01em] text-black transition-[background-color,scale] duration-200 hover:bg-[#f9a220] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:h-11 sm:text-lg";
const PICK_TONES = ["bg-[#ffe75e]", "bg-[#b6beff]", "bg-[#ffd0b2]"];

const THINK_MS = 1200;
const CHARS_PER_MS = 0.1;
const CLOSE_MS = 240;
const TILTS = [-2.5, 1.5, -1];

type Turn = AskTurn;
type Stage = "thinking" | "typing" | "done";

function HeroAsk({ onOpenChange, docked = false }: { onOpenChange?: (open: boolean) => void; docked?: boolean }) {
  const [value, setValue] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [shown, setShown] = useState(false);
  const session = useSession();
  const kids = useChildren();
  const child = session ? activeOf(kids) : null;
  const childName = child ? displayName(child.name) : "";
  const key = session === undefined ? undefined : threadKey(session?.email ?? null, child?.id ?? null);
  const [loadedKey, setLoadedKey] = useState<string | undefined>(undefined);
  const [stage, setStage] = useState<Stage>("done");
  const [typed, setTyped] = useState(0);
  const [closing, setClosing] = useState(false);
  const [focused, setFocused] = useState(false);
  const { whoseBox, cardProps, toastEl } = useAddToBox();
  const pickBox = (id: string) => {
    const { selected, onToggle } = cardProps(id);
    return { selected, onToggle };
  };
  const [example, setExample] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduced = useRef(false);

  if (key !== loadedKey) {
    setLoadedKey(key);
    const saved = key ? loadThread(key) : [];
    setTurns(saved);
    setShown(false);
    setStage("done");
  }
  useEffect(() => {
    if (key && key === loadedKey) saveThread(key, turns);
  }, [key, loadedKey, turns]);

  const open = shown && turns.length > 0;
  const latest = turns[turns.length - 1];

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => onOpenChange?.(open && !closing), [open, closing, onOpenChange]);

  useEffect(() => {
    if (focused || value || reduced.current) return;
    const t = setInterval(() => setExample((i) => (i + 1) % EXAMPLES.length), 3200);
    return () => clearInterval(t);
  }, [focused, value]);

  const ask = (q: string, context?: Turn, extra?: string) => {
    const question = q.trim();
    if (!question || stage !== "done") return;
    const shown = turns.flatMap((t) => t.answer.picks.map((p) => p.book.id));
    const query = context ? `${context.query} ${extra ?? question}`.trim() : question;
    const answer = askMock(query, context ? shown : [], context ? question : undefined);
    setTurns((ts) => [...ts, { id: ts.reduce((m, t) => Math.max(m, t.id), 0) + 1, question, query, answer }]);
    setShown(true);
    setValue("");
    setTyped(0);
    setStage(reduced.current ? "done" : "thinking");
  };

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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const followUps = latest
    ? [
        latest.answer.picks.length > 0 && "Show me 3 more",
        !latest.answer.interests.includes("funny") && "Something funnier",
        !/bed|calm/i.test(latest.question) && "Calm, for bedtime",
        latest.answer.age !== undefined && latest.answer.age > 2 && `For a ${latest.answer.age - 2}-year-old`,
      ].filter(Boolean) as string[]
    : [];
  const followUpExtra = (f: string) => (f === "Show me 3 more" ? "" : f === "Calm, for bedtime" ? "calm bedtime feelings" : f);

  const thinkingNow = stage === "thinking";

  return (
    <div className="relative mx-auto w-full max-w-[760px]">
      <ul
        aria-label="Try asking"
        className={`mb-3 flex flex-wrap items-center justify-center gap-1.5 transition-[opacity,translate] duration-300 ${docked ? "hidden" : open ? "pointer-events-none translate-y-2 opacity-0" : ""}`}
        aria-hidden={open || docked || undefined}
      >
        {turns.length > 0 && (
          <li className="animate-[ask-ph-in_500ms_cubic-bezier(0.22,1,0.36,1)_both]">
            <button type="button" tabIndex={open ? -1 : 0} onClick={() => setShown(true)} className={`${SUGGEST_PILL} gap-2 !bg-black !text-white hover:!bg-black/80 ${child ? "!pl-1 sm:!pl-1.5" : ""}`}>
              {child ? (
                <ChildAvatar child={child} index={kids?.list.indexOf(child) ?? 0} size={32} round />
              ) : (
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z" />
              </svg>
              )}
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

      <div className="relative">
        {open && (
          <section
            aria-label="Chat with KutuBooku AI"
            className={`absolute inset-x-0 bottom-full mb-2 origin-bottom overflow-hidden rounded-[32px] bg-[#fffdf8] text-black shadow-[0_24px_48px_-28px_rgba(0,0,0,0.45)] ${
              closing ? "animate-[ask-pop-out_240ms_cubic-bezier(0.4,0,1,1)_both]" : "animate-[ask-pop-in_520ms_cubic-bezier(0.22,1.2,0.36,1)_both]"
            }`}
          >
            <div className="flex items-center justify-between gap-3 px-5 pb-1 pt-4 sm:px-7 sm:pt-5">
              <p className="flex items-center gap-2.5 text-lg font-bold leading-none tracking-[-0.02em]">
                <AiAvatar size={40} thinking={thinkingNow} />
                KutuBooku AI
                <span className="-rotate-3 font-[family-name:var(--font-caveat)] text-[22px] font-normal text-[#3b308f]">{childName ? `for ${childName}` : "book finder"}</span>
              </p>
              <div className="flex items-center gap-1.5">
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

            <ChatScrollArea
              followKey={`${turns.length}-${stage}`}
              className="max-h-[min(480px,calc(100dvh-380px))] space-y-6 px-5 py-5 sm:px-7"
            >
              {turns.map((t) => {
                const isLatest = t === latest;
                const st: Stage = isLatest ? stage : "done";
                return (
                  <div key={t.id} className="space-y-3">
                    <p className="ml-auto w-fit max-w-[85%] origin-bottom-right animate-[ask-bubble-in_420ms_cubic-bezier(0.34,1.56,0.64,1)_both] rounded-[20px] rounded-br-md bg-[#3f309b] px-4 py-2.5 text-base font-semibold leading-snug tracking-[-0.01em] text-white sm:text-lg">
                      {t.question}
                    </p>

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

                    {st === "done" && t.answer.picks.length > 0 && (
                      <ul className="grid grid-cols-3 gap-2 pt-1 sm:gap-3">
                        {t.answer.picks.map((p, i) => (
                          <li
                            key={p.book.id}
                            style={{ "--r": `${TILTS[i % TILTS.length]}deg`, animationDelay: `${isLatest ? i * 110 : 0}ms` } as React.CSSProperties}
                            className="animate-[ask-card-in_560ms_cubic-bezier(0.34,1.4,0.64,1)_both]"
                          >
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
                              <AddToBoxButton
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(value, open ? latest : undefined);
          }}
          className={`relative flex h-16 items-stretch transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            focused ? "-translate-y-0.5" : ""
          }`}
        >
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-x-8 -bottom-2.5 top-1/2 rounded-full bg-[image:var(--ai-gradient-line)] blur-[14px] transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${focused || thinkingNow ? "opacity-50" : "opacity-0"}`}
          />
          <span
            aria-hidden
            className={`pointer-events-none absolute -inset-[3px] rounded-[35px] bg-[image:var(--ai-gradient-line)] transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${focused || thinkingNow ? "opacity-100" : "opacity-0"}`}
          />
          <div className={`relative flex min-w-0 flex-1 items-center gap-3 overflow-hidden rounded-[32px] bg-white pl-[14px] pr-2 transition-shadow duration-300 ${docked ? "shadow-[0_18px_40px_-16px_rgba(29,40,56,0.45),0_0_0_1px_rgba(29,40,56,0.06)]" : ""}`}>
            <span aria-hidden className={`absolute inset-x-0 bottom-0 h-1 overflow-hidden transition-opacity duration-300 ${thinkingNow ? "opacity-100" : "opacity-0"}`}>
              <span
                className={`absolute inset-y-0 left-0 w-[250%] animate-[ai-sweep_1.2s_linear_infinite] bg-[linear-gradient(90deg,transparent_0%,transparent_30%,#7c5cff_40%,#4f8bff_47%,#22c7d6_53%,#ff6ac1_60%,transparent_70%,transparent_100%)] ${thinkingNow ? "" : "[animation-play-state:paused]"}`}
              />
            </span>
            <AiAvatar size={48} thinking={thinkingNow} className={`-ml-1.5 transition-transform duration-500 ${focused ? "scale-105" : ""}`} />
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
                  if (e.key === "Tab" && !e.shiftKey && !value && !open) {
                    e.preventDefault();
                    setValue(EXAMPLES[example]);
                  }
                }}
                aria-describedby={!value && !open ? "hero-ask-tab" : undefined}
                autoComplete="off"
                className="w-full bg-transparent text-lg font-semibold tracking-[-0.02em] text-black outline-none sm:text-xl"
              />
              {!value && (
                <span aria-hidden className={`pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center overflow-hidden text-lg font-semibold tracking-[-0.02em] transition-colors duration-300 sm:text-xl ${focused ? "text-black/25" : "text-black/40"}`}>
                  {open && <span className="shrink-0">Ask a follow-up…</span>}
                  {!open && (
                    <span key={example} className="truncate animate-[ask-ph-in_420ms_cubic-bezier(0.22,1,0.36,1)_both]">
                      {EXAMPLES[example]}
                    </span>
                  )}
                  {!open && (
                    <kbd className="ml-auto hidden shrink-0 rounded-md border border-black/15 bg-white/60 px-1.5 py-0.5 font-sans text-[12px] font-semibold leading-none tracking-normal text-black/45 [@media(hover:hover)]:sm:inline-block">
                      Tab
                    </kbd>
                  )}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={!value.trim() || stage !== "done"}
              aria-label="Ask"
              className="group grid size-12 shrink-0 place-items-center rounded-full bg-[#f9a220] text-black transition-[background-color,opacity,scale] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:bg-[#e8900c] active:scale-[0.94] disabled:scale-90 disabled:bg-[#fbbe63] disabled:opacity-70 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-black"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/arrow-right.svg" alt="" width={18.6562} height={16} className="transition-transform duration-300 group-enabled:group-hover:translate-x-0.5" />
            </button>
          </div>
        </form>
      </div>
      {toastEl}
    </div>
  );
}

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

const INSET = 12;
const MIN_THUMB = 36;
const FADE = 28;

type Geo = { top: number; height: number; scrollable: boolean; atTop: boolean; atBottom: boolean };

function ChatScrollArea({
  className = "",
  followKey,

  children,
}: {
  className?: string;
  followKey: string | number;

  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geo>({ top: 0, height: 0, scrollable: false, atTop: true, atBottom: true });
  const [awake, setAwake] = useState(false);
  const [dragging, setDragging] = useState(false);
  const sleepTimer = useRef(0);
  const drag = useRef<{ y: number; scrollTop: number } | null>(null);

  const measure = () => {
    const el = ref.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const max = scrollHeight - clientHeight;
    const rail = clientHeight - INSET * 2;
    const height = Math.max(MIN_THUMB, (clientHeight / scrollHeight) * rail);
    setGeo({
      scrollable: max > 1,
      height,
      top: INSET + (max > 0 ? (scrollTop / max) * (rail - height) : 0),
      atTop: scrollTop <= 1,
      atBottom: scrollTop >= max - 1,
    });
  };
  const measureRef = useRef(measure);
  useEffect(() => {
    measureRef.current = measure;
  });

  const sleepSoon = () => {
    window.clearTimeout(sleepTimer.current);
    sleepTimer.current = window.setTimeout(() => setAwake(false), 1000);
  };
  const wake = () => {
    window.clearTimeout(sleepTimer.current);
    setAwake(true);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const run = () => measureRef.current();
    const ro = new ResizeObserver(run);
    ro.observe(el);
    const mo = new MutationObserver(run);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
      window.clearTimeout(sleepTimer.current);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [followKey]);

  const onThumbDown = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, scrollTop: el.scrollTop };
    setDragging(true);
  };
  const onThumbMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || !drag.current) return;
    const rail = el.clientHeight - INSET * 2 - geo.height;
    const ratio = (el.scrollHeight - el.clientHeight) / Math.max(1, rail);
    el.scrollTop = drag.current.scrollTop + (e.clientY - drag.current.y) * ratio;
  };
  const onThumbUp = () => {
    drag.current = null;
    setDragging(false);
    sleepSoon();
  };

  const mask = geo.scrollable
    ? `linear-gradient(to bottom, ${geo.atTop ? "#000" : "transparent"} 0, #000 ${FADE}px, #000 calc(100% - ${FADE}px), ${geo.atBottom ? "#000" : "transparent"} 100%)`
    : undefined;
  const shown = awake || dragging;

  return (
    <div className="relative">
      <div
        ref={ref}
        data-lenis-prevent
        onScroll={() => {
          measure();
          wake();
          sleepSoon();
        }}
        onPointerEnter={wake}
        onPointerLeave={sleepSoon}
        className={`no-scrollbar overflow-y-auto overscroll-contain ${className}`}
        style={{ maskImage: mask, WebkitMaskImage: mask, scrollbarWidth: "none" }}
      >
        {children}
      </div>

      {geo.scrollable && (
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-2 w-3">
          <div
            onPointerDown={onThumbDown}
            onPointerMove={onThumbMove}
            onPointerUp={onThumbUp}
            onPointerCancel={onThumbUp}
            onPointerEnter={wake}
            onPointerLeave={() => !dragging && sleepSoon()}
            className={`group pointer-events-auto absolute inset-x-0 flex cursor-grab touch-none justify-center transition-opacity duration-300 active:cursor-grabbing ${
              shown ? "opacity-100" : "opacity-0"
            }`}
            style={{ top: geo.top, height: geo.height }}
          >
            <span
              className={`h-full rounded-full transition-[width,background-color] duration-200 ${
                dragging ? "w-2 bg-[#f9a220]" : "w-1 bg-black/25 group-hover:w-2 group-hover:bg-[#f9a220]"
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
