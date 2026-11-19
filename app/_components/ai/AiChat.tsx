"use client";

import { BrandArrow, Button } from "../ui/Button";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { askMock } from "../../_data/ask-mock";
import { loadThread, saveThread, threadKey, type AskTurn } from "../../_lib/ask-history";
import { MAX_CHILDREN, activeOf, displayName, switchChild, useChildren, type ChildProfile, type ChildrenState } from "../../_lib/children";
import { useSession } from "../../_lib/session";
import { AddToBoxButton } from "../ui/AddToBoxButton";
import { AiAvatar } from "./AiAvatar";
import { ChildAvatar } from "../child/ChildAvatar";
import { ScrollThumb } from "../ui/ScrollThumb";
import { useAddToBox } from "../useAddToBox";

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
const TILTS = [-1, 0.75, -0.5];

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [openOnSwitch, setOpenOnSwitch] = useState(false);
  const [showEarlier, setShowEarlier] = useState(false);
  const skipFocusOpen = useRef(false);
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
    setShown((shown || openOnSwitch) && saved.length > 0);
    setOpenOnSwitch(false);
    setShowEarlier(false);
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
    skipFocusOpen.current = true;
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
        {SUGGESTIONS.map((s, i) => (
          <li
            key={s}
            style={{ animationDelay: `${i * 80}ms` }}
            className={`animate-[ask-ph-in_500ms_cubic-bezier(0.22,1,0.36,1)_both] ${i > 0 ? "max-sm:hidden" : ""}`}
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
            <div className="flex items-center justify-between gap-3 border-b border-black/5 px-5 pb-3 pt-4 sm:px-7">
              <p className="flex items-center gap-2 text-base font-bold tracking-[-0.01em]">
                <AiAvatar size={32} thinking={thinkingNow} />
                Book finder
              </p>
              <div className="flex items-center gap-2">
                <Button variant="link" tone="outline" size="sm" onClick={() => close(true)} disabled={stage !== "done"}>
                  Clear chat
                </Button>
                <Button variant="icon" tone="amber" onClick={() => close()} label="Close chat" className="bg-[#fbbe63] transition-[background-color,rotate] duration-300 hover:rotate-90">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </Button>
              </div>
            </div>

            <ChatScrollArea
              followKey={`${turns.length}-${stage}`}
              className="max-h-[min(480px,calc(100dvh-380px))] space-y-6 px-5 py-5 sm:px-7"
            >
              {!showEarlier && turns.length > 1 && (
                <Button variant="link" tone="outline" size="sm" onClick={() => setShowEarlier(true)} className="mx-auto flex">
                  Show {turns.length - 1} earlier {turns.length === 2 ? "question" : "questions"}
                </Button>
              )}
              {(showEarlier ? turns : turns.slice(-1)).map((t) => {
                const isLatest = t === latest;
                const st: Stage = isLatest ? stage : "done";
                return (
                  <div key={t.id} className="space-y-3">
                    <p className="ml-auto w-fit max-w-[85%] origin-bottom-right animate-[ask-bubble-in_420ms_cubic-bezier(0.34,1.56,0.64,1)_both] rounded-[20px] rounded-br-md bg-[#1d2838] px-4 py-2.5 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-white sm:text-base">
                      {t.question}
                    </p>

                    <div aria-live={isLatest ? "polite" : undefined}>
                      {st === "thinking" ? (
                        <Thinking />
                      ) : (
                        <p className="text-base font-medium leading-snug tracking-[-0.01em] text-[#1d2838] sm:text-lg">
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
                      <ul
                        data-lenis-prevent-horizontal
                        className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 pt-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0"
                      >
                        {t.answer.picks.map((p, i) => (
                          <li
                            key={p.book.id}
                            style={{ "--r": `${TILTS[i % TILTS.length]}deg`, animationDelay: `${isLatest ? i * 110 : 0}ms` } as React.CSSProperties}
                            className="w-[58%] shrink-0 snap-start animate-[ask-card-in_560ms_cubic-bezier(0.34,1.4,0.64,1)_both] sm:w-auto"
                          >
                            <div
                              className={`group flex h-full rotate-[var(--r)] flex-col rounded-[20px] p-2 text-black transition-[rotate,translate] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1.5 hover:rotate-0 focus-within:rotate-0 sm:p-2.5 ${PICK_TONES[i % PICK_TONES.length]}`}
                            >
                              <Link href={`/books/${p.book.id}`} className="block flex-1 rounded-[12px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
                                <span data-book-cover={p.book.id} className="relative block aspect-square overflow-hidden rounded-r-[8px] rounded-l-[3px]">
                                  <Image src={p.book.cover} alt="" fill sizes="180px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                                </span>
                                <span className="mt-2.5 line-clamp-2 block text-[15px] font-bold leading-tight tracking-[-0.01em] sm:text-base">{p.book.title}</span>
                                <span className="mt-1 line-clamp-2 block text-[13px] font-semibold leading-snug opacity-75">{p.reason}</span>
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
                  <div className="border-t border-[#1d2838]/10 pt-4">
                    {child ? (
                      <Button variant="split" tone="ink" size="md" href="/curation" className="max-w-full [&>span:first-child]:min-w-0 [&>span:first-child]:pl-1.5">
                        <span aria-hidden className="shrink-0">
                          <ChildAvatar child={child} index={kids?.list.indexOf(child) ?? 0} size={34} round />
                        </span>
                        <span className="truncate">See {childName}&apos;s full curation</span>
                      </Button>
                    ) : (
                      <Button variant="split" tone="ink" size="md" href="/reading-preferences" className="max-w-full [&>span:first-child]:min-w-0">
                        <span className="truncate">
                          {latest.answer.age !== undefined ? `Get a full curation for a ${latest.answer.age}-year-old` : "Get a full curation for my child"}
                        </span>
                      </Button>
                    )}
                  </div>
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
          className="relative flex h-16 items-stretch"
        >
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-x-8 -bottom-2.5 top-1/2 rounded-full bg-[image:var(--ai-gradient-line)] blur-[14px] transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${focused || thinkingNow ? "opacity-50" : "opacity-0"}`}
          />
          <span
            aria-hidden
            className={`pointer-events-none absolute -inset-[3px] rounded-[35px] bg-[image:var(--ai-gradient-line)] transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${focused || thinkingNow ? "opacity-100" : "opacity-0"}`}
          />
          <div className={`relative flex min-w-0 flex-1 items-center gap-3 overflow-hidden rounded-[32px] bg-white ${child ? "pl-2" : "pl-6"} pr-2 transition-shadow duration-300 ${docked ? "shadow-[0_18px_40px_-16px_rgba(29,40,56,0.45),0_0_0_1px_rgba(29,40,56,0.06)]" : ""}`}>
            <span aria-hidden className={`absolute inset-x-0 bottom-0 h-1 overflow-hidden transition-opacity duration-300 ${thinkingNow ? "opacity-100" : "opacity-0"}`}>
              <span
                className={`absolute inset-y-0 left-0 w-[250%] animate-[ai-sweep_1.2s_linear_infinite] bg-[linear-gradient(90deg,transparent_0%,transparent_30%,#7c5cff_40%,#4f8bff_47%,#22c7d6_53%,#ff6ac1_60%,transparent_70%,transparent_100%)] ${thinkingNow ? "" : "[animation-play-state:paused]"}`}
              />
            </span>
            {child && kids && <ChildChip child={child} index={kids.list.indexOf(child)} open={pickerOpen} onToggle={() => setPickerOpen((o) => !o)} />}
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
                onFocus={() => {
                  setFocused(true);
                  if (skipFocusOpen.current) {
                    skipFocusOpen.current = false;
                    return;
                  }
                  if (!value && turns.length > 0) setShown(true);
                }}
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
            <Button variant="icon" tone="amber" size="md" type="submit" disabled={!value.trim() || stage !== "done"} label="Ask" className="disabled:!opacity-70 disabled:scale-90">
              <BrandArrow className="h-4 w-[18.66px]" />
            </Button>
          </div>
          {pickerOpen && child && kids && (
            <ChildMenu
              kids={kids}
              activeId={child.id}
              onPick={(id) => {
                setPickerOpen(false);
                if (id === child.id) {
                  if (turns.length > 0) setShown(true);
                } else {
                  setOpenOnSwitch(true);
                  switchChild(id);
                }
                skipFocusOpen.current = true;
                inputRef.current?.focus();
              }}
              onClose={() => setPickerOpen(false)}
            />
          )}
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

const FADE = 28;

type Edges = { scrollable: boolean; atTop: boolean; atBottom: boolean };

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
  const [edges, setEdges] = useState<Edges>({ scrollable: false, atTop: true, atBottom: true });

  const measure = () => {
    const el = ref.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const max = scrollHeight - clientHeight;
    setEdges({ scrollable: max > 1, atTop: scrollTop <= 1, atBottom: scrollTop >= max - 1 });
  };
  const measureRef = useRef(measure);
  useEffect(() => {
    measureRef.current = measure;
  });

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
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [followKey]);

  const mask = edges.scrollable
    ? `linear-gradient(to bottom, ${edges.atTop ? "#000" : "transparent"} 0, #000 ${FADE}px, #000 calc(100% - ${FADE}px), ${edges.atBottom ? "#000" : "transparent"} 100%)`
    : undefined;

  return (
    <div className="relative">
      <div
        ref={ref}
        data-lenis-prevent
        onScroll={measure}
        className={`no-scrollbar overflow-y-auto overscroll-contain ${className}`}
        style={{ maskImage: mask, WebkitMaskImage: mask, scrollbarWidth: "none" }}
      >
        {children}
      </div>
      <ScrollThumb scroller={ref} className="absolute inset-y-0 right-1.5" />
    </div>
  );
}

const PICKER_ID = "hero-ask-child-menu";

function ChildChip({ child, index, open, onToggle }: { child: ChildProfile; index: number; open: boolean; onToggle: () => void }) {
  const name = displayName(child.name);
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? PICKER_ID : undefined}
      aria-label={`Asking for ${name}. Change child`}
      className={`group flex h-11 max-w-[40%] shrink-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-3 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:max-w-[200px] ${
        open ? "bg-[#1d2838] text-white" : "bg-[#f4eee3] text-[#1d2838] hover:bg-[#ece3d3]"
      }`}
    >
      <ChildAvatar child={child} index={index} size={36} round />
      <span className="min-w-0 truncate text-[15px] font-semibold tracking-[-0.01em]">{name}</span>
      <svg
        viewBox="0 0 24 24"
        className={`size-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${open ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M6 15l6-6 6 6" />
      </svg>
    </button>
  );
}

function ChildMenu({ kids, activeId, onPick, onClose }: { kids: ChildrenState; activeId: string; onPick: (id: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const canAdd = kids.list.length < MAX_CHILDREN;

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!el.parentElement?.contains(e.target as Node)) closeRef.current();
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const items = [...(ref.current?.querySelectorAll<HTMLElement>("[role^=menuitem]") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    }
  };

  return (
    <div
      ref={ref}
      id={PICKER_ID}
      role="menu"
      aria-label="Who is this chat for?"
      onKeyDown={onKeyDown}
      className="absolute bottom-[calc(100%+12px)] left-2 z-30 w-[min(300px,calc(100vw-2.5rem))] origin-bottom-left animate-q-in rounded-[24px] bg-[#fffdf8] p-2 text-[#1d2838] shadow-[0_24px_48px_-20px_rgba(29,40,56,0.45)] ring-1 ring-[#1d2838]/10"
    >
      <p className="px-3 pb-2 pt-1.5 font-[family-name:var(--font-caveat)] text-[22px] leading-none text-[#3b308f]">who&apos;s this for?</p>
      {kids.list.map((c, i) => {
        const active = c.id === activeId;
        return (
          <button
            key={c.id}
            type="button"
            role="menuitemradio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onPick(c.id)}
            className={`flex w-full items-center gap-3 rounded-[16px] p-1.5 pr-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#1d2838] ${
              active ? "bg-[#f4eee3]" : "hover:bg-[#f4eee3]"
            }`}
          >
            <ChildAvatar child={c} index={i} size={40} round />
            <span className="min-w-0 flex-1 truncate text-[17px] font-semibold tracking-[-0.01em]">{displayName(c.name)}</span>
            {active && (
              <span aria-hidden className="grid size-6 place-items-center rounded-full bg-[#f26b4f]">
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="#1d2838" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
      {canAdd && (
        <Link
          href="/reading-preferences?new=1&next=/"
          role="menuitem"
          tabIndex={-1}
          className="mt-1 flex items-center gap-3 rounded-[16px] border-t border-[#1d2838]/10 p-1.5 pr-3 pt-2.5 text-[15px] font-semibold transition-colors hover:bg-[#f4eee3] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#1d2838]"
        >
          <span aria-hidden className="grid size-10 place-items-center rounded-full border-2 border-dashed border-[#1d2838]/30 text-xl leading-none">
            +
          </span>
          Add a child
        </Link>
      )}
    </div>
  );
}
