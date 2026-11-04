"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState, ViewTransition } from "react";
import { MAX_AGE, MONTHS, NAME_TOKEN, ageFromDob, ageInWords, dobParts, dobProblem, formatDob, type Option, type Question } from "../_data/questions";
import { answerArt } from "../_components/AnswerArt";
import { ArrowIcon, BTN_PRIMARY, Button, OutlineButton } from "../_components/Button";
import {
  DRAFT_KEY,
  MAX_CHILDREN,
  NEW_DRAFT_KEY,
  addChild,
  canAddChild,
  childById,
  freeAvatar,
  commitDraft,
  displayName,
  nameTaken,
  readChildren,
  removeChild,
  setActiveChild,
  setFor,
  updateChild,
  type ChildProfile,
} from "../_lib/children";
import { addToBox } from "../_lib/box";
import { ReaderAvatar } from "../_components/ReaderAvatar";
import { AvatarChooser } from "../_components/AvatarChooser";
import { isSignedIn, safeNext } from "../_lib/session";

type Answers = Record<string, string | string[]>;

// Three modes (see app/_lib/children.ts):
// - first child (no query): answers kept in sessionStorage so they survive the sign-in step
//   that comes after the questionnaire (CONTEXT.md Q7); saved as a profile once signed in.
// - another child (?new=1, signed in): same questions, then straight to their books.
//   ?add=<bookId> puts that book in their box at the end ("+ Someone new" on a book page),
//   ?next=<path> is where to go afterwards.
// - edit a child (?child=<id>): opens on the summary; Save changes, or Remove the child.
type Mode =
  | { kind: "first" }
  | { kind: "new"; add: string | null; next: string | null }
  | { kind: "edit"; child: ChildProfile; next: string | null };

const storageKey = (m: Mode) => (m.kind === "first" ? DRAFT_KEY : m.kind === "new" ? NEW_DRAFT_KEY : null);

/** Questions where a brother or sister's answers make a good start (age, stage and books read never carry over). */
const COPYABLE = new Set(["interests", "avoid"]);

const hasAnswer = (a: Answers, id: string) => (Array.isArray(a[id]) ? a[id].length > 0 : Boolean(a[id]));

/** "Aarav", "Aarav and Meera", "Aarav, Meera and Kabir". */
export function listOf(names: string[]) {
  return names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
const LETTERS = "abcdefghijklmnopqrstuvwxyz";

// Palette — warm and playful (one place to tweak).
const ACCENT = "bg-[#f26b4f]"; // coral: selected tile, Continue
// Left panel takes a different soft colour per question and fades between them.
const PANEL_COLOURS = ["#f6c453", "#9fcbf2", "#a9dfc0", "#f7ab95", "#c9b7f1", "#d8e88a"];



function load(key: string | null): Answers {
  if (!key) return {};
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? "{}");
  } catch {
    return {};
  }
}

function save(key: string | null, a: Answers) {
  if (!key) return; // editing a child: nothing is saved until "Save changes"
  try {
    sessionStorage.setItem(key, JSON.stringify(a));
  } catch {
    /* private mode etc. — answers still live in memory */
  }
}

function clear(key: string | null) {
  try {
    if (key) sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Reads the mode from the URL, or where to go instead when that mode can't be used. */
function modeFromUrl(): Mode | { redirect: string } {
  const q = new URLSearchParams(window.location.search);
  const next = q.get("next") ? safeNext(q.get("next")) : null;
  const here = window.location.pathname + window.location.search;
  if (q.get("new") === "1" || q.has("child")) {
    // Children belong to the account: sign in first (C8). A first child's draft is saved now.
    if (!isSignedIn()) return { redirect: `/sign-in?next=${encodeURIComponent(here)}` };
    commitDraft();
  }
  if (q.has("child")) {
    const child = childById(q.get("child"));
    return child ? { kind: "edit", child, next } : { redirect: "/children" };
  }
  if (q.get("new") === "1") {
    if (!canAddChild()) return { redirect: "/children" };
    return { kind: "new", add: q.get("add"), next };
  }
  return { kind: "first" };
}

/* -------------------------------------------------------------------------- */

export function Questionnaire({ questions }: { questions: Question[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [siblings, setSiblings] = useState<ChildProfile[]>([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  // True when a question was opened from the summary: finishing it returns there.
  const [editing, setEditing] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Set up from the URL; again on Back/Forward and when "Add another child" switches mode here.
  const init = () => {
    const m = modeFromUrl();
    if ("redirect" in m) {
      router.replace(m.redirect);
      return;
    }
    setMode(m);
    setSiblings(m.kind === "first" ? [] : readChildren().list.filter((c) => m.kind !== "edit" || c.id !== m.child.id));
    setEditing(false);
    if (m.kind === "edit") {
      setAnswers(m.child.answers);
      setStep(questions.length); // open on the summary
    } else {
      setAnswers(load(storageKey(m)));
      setStep(0);
    }
  };
  const initRef = useRef(init);
  useEffect(() => {
    initRef.current = init;
  });

  useEffect(() => {
    initRef.current();
    const onPop = () => initRef.current();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /** Same page, another mode (e.g. ?new=1): no reload, and Back returns here. */
  const switchTo = (url: string) => {
    window.history.pushState(null, "", url);
    init();
  };

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  // On phones the on-screen keyboard resizes the viewport, which makes the
  // browser abort an in-flight view transition. The content still updates; the
  // browser just reports the skipped animation as an unhandled rejection, so we
  // swallow only that specific case.
  useEffect(() => {
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason as { name?: string; message?: string } | undefined;
      if (/transition was aborted/i.test(r?.message ?? "")) e.preventDefault();
    };
    // React may also surface it via reportError() → window "error" event.
    const onError = (e: ErrorEvent) => {
      const r = e.error as { name?: string; message?: string } | undefined;
      if (/transition was aborted/i.test(r?.message ?? e.message ?? "")) e.preventDefault();
    };
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  const total = questions.length;
  const done = step >= total;
  const q = questions[Math.min(step, total - 1)];
  const value = answers[q.id];
  const followUp = q.kind === "single" || q.kind === "multi" ? q.followUp : undefined;
  const followUpOpen =
    !!followUp && (Array.isArray(value) ? value.includes(followUp.whenValue) : value === followUp.whenValue);
  const followUpItems = followUp && Array.isArray(answers[followUp.id]) ? (answers[followUp.id] as string[]) : [];
  // A revealed follow-up (e.g. "Something else…" or "Yes, I'll add some")
  // must be filled in or switched off before moving on — even on optional questions.
  const followUpPending = followUpOpen && followUpItems.length === 0;
  const key = mode ? storageKey(mode) : null;
  // Another child in the account already has this name: their boxes would get mixed up.
  const editId = mode?.kind === "edit" ? mode.child.id : undefined;
  const nameClash = mode !== null && mode.kind !== "first" && q.id === "name" && typeof value === "string" && nameTaken(value, editId);
  // A brother or sister's picks as a starting point (interests, no-go topics): editable afterwards.
  const copyFrom = mode?.kind === "new" && COPYABLE.has(q.id) ? siblings.filter((c) => hasAnswer(c.answers, q.id)) : [];

  const answered =
    (q.kind === "multi"
      ? Array.isArray(value) && value.length > 0
      : q.kind === "date"
        ? ageFromDob(value) !== null && !dobProblem(value)
        : typeof value === "string" && value.trim() !== "") && !followUpPending;
  const canContinue = !followUpPending && (answered || q.optional) && !nameClash;

  // The child's name (question 1) personalises every later question.
  // Capitalised for display; the saved answer stays exactly as typed.
  const childName = displayName(answers.name);
  const fill = (t: string) => t.split(NAME_TOKEN).join(childName || "your child");
  const others = siblings.map((c) => displayName(c.name));
  // A new child's first question speaks to the family.
  const newName = mode?.kind === "new" && q.id === "name";
  const questionText = newName ? "Who's the next reader?" : fill(q.question);
  const whyText = newName ? `A first name or nickname. They'll get their own books, next to ${listOf(others)}'s.` : fill(q.why);

  /** Start from a brother or sister's answer (and its "something else" extras). */
  const copyAnswer = (c: ChildProfile) => {
    const v = c.answers[q.id];
    update(q.id, Array.isArray(v) ? [...v] : v);
    if (followUp) update(followUp.id, Array.isArray(c.answers[followUp.id]) ? [...(c.answers[followUp.id] as string[])] : []);
  };

  const update = (id: string, v: string | string[]) =>
    setAnswers((prev) => {
      const next = { ...prev, [id]: v };
      save(key, next);
      return next;
    });

  // Step changes run inside a transition so <ViewTransition> can crossfade
  // the outgoing and incoming question instead of swapping them abruptly.
  const go = (fn: (s: number) => number) => startTransition(() => setStep(fn));
  const toSummary = () => {
    setEditing(false);
    go(() => total);
  };
  const next = () => (editing ? toSummary() : go((s) => Math.min(s + 1, total)));
  const editFromSummary = (i: number) => {
    setEditing(true);
    go(() => i);
  };
  // /editions is on hold, so there is nowhere to go back to from question 1;
  // the back buttons are hidden on the first step.
  const back = () => (editing ? toSummary() : go((s) => Math.max(s - 1, 0)));

  const choose = (opt: string) => {
    if (q.kind === "single") {
      update(q.id, opt);
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      if (q.followUp) {
        if (opt === q.followUp.whenValue) return; // stay: reveal the follow-up input
        update(q.followUp.id, []); // switching away clears it
      }
      // Let the selection sweep finish before the next question rises in.
      advanceTimer.current = setTimeout(next, 520);
    } else if (q.kind === "multi") {
      const cur = Array.isArray(value) ? value : [];
      const removing = cur.includes(opt);
      update(q.id, removing ? cur.filter((v) => v !== opt) : [...cur, opt]);
      // Unticking the follow-up option clears what was typed for it.
      if (removing && q.followUp && opt === q.followUp.whenValue) update(q.followUp.id, []);
    }
  };


  /* ------------------------------- Summary ------------------------------- */

  /** Saves this child, or returns false (name now taken / account full). */
  const saveChild = (): boolean => {
    if (!mode || mode.kind === "first") return true;
    if (mode.kind === "edit") {
      updateChild(mode.child.id, answers);
      setActiveChild(mode.child.id);
      return true;
    }
    const child = addChild(answers);
    if (!child) return false;
    clear(key);
    setFor(displayName(child.name)); // the new child is the one books go to now (B1)
    if (mode.add) addToBox(mode.add, displayName(child.name), "book");
    return true;
  };

  const finish = () => {
    if (!mode) return;
    if (mode.kind === "first") {
      if (!isSignedIn()) return router.push("/sign-in?next=/curation");
      commitDraft();
      return router.push("/curation");
    }
    if (!saveChild()) return editFromSummary(0); // back to the name
    router.push(mode.next ?? "/curation");
  };

  /** "Got another reader?": keep this one, then start the next. */
  const addAnother = () => {
    if (!mode) return;
    const url = "/reading-preferences?new=1";
    if (mode.kind === "first") {
      if (!isSignedIn()) return router.push(`/sign-in?next=${encodeURIComponent(url)}`);
      commitDraft();
    } else if (!saveChild()) return editFromSummary(0);
    switchTo(url);
  };

  const remove = () => {
    if (mode?.kind !== "edit") return;
    removeChild(mode.child.id);
    router.push("/children");
  };

  return (
    <div className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col p-2.5 sm:p-3">

      <div className="grid flex-1 gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-3">
        {/* ---------------- Left column: context + back ---------------- */}
        <aside className="flex flex-col gap-2.5 lg:gap-3">
          <div style={{ backgroundColor: done ? PANEL_COLOURS[0] : PANEL_COLOURS[step % PANEL_COLOURS.length] }}
            className="relative flex flex-col rounded-[28px] p-5 transition-colors sm:rounded-[36px] sm:p-6 duration-700 ease-out sm:rounded-[48px] sm:p-8 lg:min-h-[min(560px,calc(100dvh-14rem))]">
            <p className="type-label text-[#1d2838]/80">
              {done ? (mode?.kind === "edit" ? "Reader" : "Summary") : editing ? "Editing" : mode?.kind === "new" && step === 0 ? "New reader" : q.optional ? "Optional" : "Required"}
            </p>

            <ViewTransition key={done ? "why-done" : `why-${step}`} name="q-why" share="q-swap" enter="q-swap" exit="q-swap" default="none">
            <p className="mt-4 type-lead sm:mt-6">
              {done ? (mode?.kind === "edit" ? `Change anything about ${childName || "your child"}, or add another reader.` : "That's everything we need.") : whyText}
            </p>
            </ViewTransition>

            <div className="mt-5 sm:mt-8 lg:mt-auto">
              <PickedArt questions={questions} answers={answers} />
              {/* Progress: counter + bar. The bar shows questions completed (3/7 on question 4). */}
              <div
                role="progressbar"
                aria-label="Questionnaire progress"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={done ? total : step}
                aria-valuetext={done ? `All ${total} questions answered` : `Question ${step + 1} of ${total}`}
              >
                <div className="flex items-baseline justify-between type-label tabular-nums text-[#1d2838]/80">
                  <span>{done ? "All done" : `Question ${step + 1} of ${total}`}</span>
                  <span>{Math.round(((done ? total : step) / total) * 100)}%</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#1d2838]/15">
                  <div
                    className="h-full rounded-full bg-[#1d2838] transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                    style={{ width: `${Math.max(((done ? total : step) / total) * 100, 3)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

        </aside>

        {/* ---------------- Right panel: the question ---------------- */}
        <main className="flex flex-col rounded-[36px] bg-[#fffdf8] px-5 pb-6 pt-8 sm:rounded-[56px] sm:px-10 sm:pt-12 lg:rounded-b-none lg:rounded-t-[64px] lg:px-[6%] lg:pt-16">
          <ViewTransition key={done ? "done" : step} name="q-content" share="q-swap" enter="q-swap" exit="q-swap" default="none">
          <div className="flex flex-1 flex-col">
          {done ? (
            <Summary
              questions={questions}
              answers={answers}
              childName={childName}
              mode={mode}
              onEdit={editFromSummary}
              onBack={() => go(() => total - 1)}
              onFinish={finish}
              onAddAnother={addAnother}
              onRemove={remove}
              onAvatar={(id) => update("avatar", id)}
              siblings={siblings}
              headingRef={headingRef}
            />
          ) : (
            <form
              className="flex flex-1 flex-col"
              onSubmit={(e) => {
                e.preventDefault();
                if (canContinue) next();
              }}
            >
              <fieldset className="flex flex-1 flex-col">
                <legend className="sr-only">{questionText}</legend>
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  className="max-w-[16ch] type-display outline-none"
                >
                  {questionText}
                </h1>
                <p className={`mt-4 type-caption text-[#1d2838]/60`}>
                  {q.kind === "multi" ? "Choose all that apply" : q.kind === "single" ? "Choose one" : q.kind === "date" ? "Year, then month · the day is optional" : "Type your answer"}
                </p>

                {q.kind === "text" ? (
                  <div className="mt-8">
                    <label htmlFor={`q-${q.id}`} className="sr-only">
                      {fill(q.question)}
                    </label>
                    {q.singleLine ? (
                      <input
                        id={`q-${q.id}`}
                        type="text"
                        autoComplete="off"
                        maxLength={q.maxLength}
                        value={typeof value === "string" ? value : ""}
                        onChange={(e) => update(q.id, e.target.value)}
                        placeholder={q.placeholder}
                        aria-invalid={nameClash || undefined}
                        aria-describedby={nameClash ? "name-clash" : undefined}
                        className="h-[76px] w-full rounded-[28px] bg-[#f4eee3] px-6 type-value outline-none placeholder:text-[#1d2838]/35 focus:ring-2 focus:ring-[#1d2838]"
                      />
                    ) : (
                    <textarea
                      id={`q-${q.id}`}
                      rows={4}
                      value={typeof value === "string" ? value : ""}
                      onChange={(e) => update(q.id, e.target.value)}
                      placeholder={q.placeholder}
                      className="w-full resize-none rounded-[28px] bg-[#f4eee3] px-6 py-5 type-value outline-none placeholder:text-[#1d2838]/35 focus:ring-2 focus:ring-[#1d2838]"
                    />
                    )}
                    {nameClash ? (
                      <p id="name-clash" role="alert" className="mt-3 type-body text-[#b3402a]">
                        You already have a reader called {childName}. Add an initial or a nickname so their books don&apos;t get mixed up.
                      </p>
                    ) : null}
                  </div>
                ) : q.kind === "date" ? (
                  <DobPicker
                    value={typeof value === "string" ? value : ""}
                    name={childName}
                    onChange={(v) => update(q.id, v)}
                  />
                ) : q.kind === "single" && q.layout === "grid" ? (
                  <TileGrid
                    label={fill(q.question)}
                    options={q.options}
                    value={typeof value === "string" ? value : undefined}
                    onChoose={choose}
                  />
                ) : (
                  <>
                  {copyFrom.length ? (
                    <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Start from a brother or sister's answers">
                      <span className="type-caption text-[#1d2838]/60">Start from</span>
                      {copyFrom.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => copyAnswer(c)}
                          className="h-10 rounded-full border-2 border-[#1d2838]/15 px-4 type-label transition-colors hover:border-[#1d2838] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]"
                        >
                          {displayName(c.name)}&apos;s picks
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <ul
                    role={q.kind === "single" ? "radiogroup" : "group"}
                    aria-label={fill(q.question)}
                    className={`mt-8 grid gap-2 ${q.options.length > 6 ? "sm:grid-cols-2" : ""}`}
                  >
                    {q.options.map((o, i) => {
                      const selected =
                        q.kind === "single" ? value === o.value : Array.isArray(value) && value.includes(o.value);
                      return (
                        <li key={o.value}>
                          <button
                            type="button"
                            role={q.kind === "single" ? "radio" : "checkbox"}
                            aria-checked={selected}
                            onPointerDown={(e) => {
                              const r = e.currentTarget.getBoundingClientRect();
                              e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
                              e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
                            }}
                            onKeyDown={(e) => {
                              // keyboard selection grows from the centre
                              e.currentTarget.style.removeProperty("--x");
                              e.currentTarget.style.removeProperty("--y");
                            }}
                            onClick={() => choose(o.value)}
                            className={`group relative flex h-[68px] w-full items-center gap-4 overflow-hidden rounded-[24px] bg-[#f4eee3] pl-3 pr-5 text-left type-option transition-[background-color,scale] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838] active:scale-[0.98] ${
                              selected ? "" : "hover:bg-[#ece3d3]"
                            }`}
                          >
                            {/* Selection fill: grows as a circle from where the option was pressed */}
                            <span
                              aria-hidden
                              className={`absolute inset-0 rounded-[24px] bg-[#1d2838] transition-[clip-path] duration-[520ms] motion-reduce:transition-none ${selected ? "ease-[cubic-bezier(0.22,1,0.36,1)]" : "ease-[cubic-bezier(0.64,0,0.78,0)]"}`}
                              style={{
                                clipPath: selected
                                  ? "circle(150% at var(--x, 50%) var(--y, 50%))"
                                  : "circle(0% at var(--x, 50%) var(--y, 50%))",
                              }}
                            />
                            <span
                              aria-hidden
                              className={`relative grid size-11 shrink-0 place-items-center rounded-[14px] type-button transition-[background-color,color,rotate,scale] duration-[450ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none ${
                                selected ? `${ACCENT} rotate-[-8deg] scale-105 text-[#1d2838]` : "rotate-0 scale-100 bg-[#1d2838] text-white delay-[80ms]"
                              }`}
                            >
                              {LETTERS[i]}
                            </span>
                            <span
                              className={`relative flex-1 transition-colors duration-[260ms] ease-out ${selected ? "text-white delay-[90ms]" : "text-[#1d2838] delay-[330ms]"}`}
                            >
                              {o.label}
                            </span>
                            <span
                              aria-hidden
                              className={`relative grid size-7 place-items-center rounded-full transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${ACCENT} ${
                                selected ? "scale-100 opacity-100 delay-100" : "scale-50 opacity-0"
                              }`}
                            >
                              <svg viewBox="0 0 24 24" className="size-4 text-[#1d2838]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12l5 5L20 7" />
                              </svg>
                            </span>
                          </button>
                          {/* Follow-up field opens attached under the option that reveals it */}
                          {followUp && followUpOpen && o.value === followUp.whenValue ? (
                            <div className="mt-1.5 animate-q-in">
                              <ChipInput
                                label={followUp.label}
                                placeholder={followUp.placeholder}
                                items={followUpItems}
                                onChange={(items) => update(followUp.id, items)}
                              />
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                  </>
                )}
              </fieldset>

              {/* Actions */}
              {/* Actions: Back sits right beside Continue (bottom-right) so the
                  pointer travels the least distance between them (Fitts's law). */}
              <div className="sticky bottom-0 z-10 -mx-2 mt-10 flex min-h-[80px] items-center justify-end gap-1.5 rounded-t-[24px] bg-[#fffdf8]/90 px-2 pb-3 pt-3 backdrop-blur">
                {step > 0 || editing ? (
                  <OutlineButton onClick={back} label={editing ? "Back to summary" : "Previous question"}>
                    <ArrowIcon dir="left" />
                    {editing ? "Back to summary" : "Back"}
                  </OutlineButton>
                ) : mode?.kind === "new" ? (
                  <OutlineButton onClick={() => router.back()} label="Cancel adding a child">
                    Cancel
                  </OutlineButton>
                ) : null}

                {q.kind !== "single" || q.optional || followUpOpen ? (
                  <Button type="submit" disabled={!canContinue} variant="primary" arrow="right">
                    {editing ? "Save" : answered || !q.optional || followUpPending ? "Continue" : "Skip"}
                  </Button>
                ) : null}
              </div>
            </form>
          )}
          </div>
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Summary({
  questions,
  answers,
  mode,
  onEdit,
  onBack,
  onFinish,
  onAddAnother,
  onRemove,
  onAvatar,
  siblings,
  headingRef,
  childName,
}: {
  onAvatar: (id: string) => void;
  siblings: ChildProfile[];
  childName: string;
  questions: Question[];
  answers: Answers;
  mode: Mode | null;
  onEdit: (step: number) => void;
  onBack: () => void;
  onFinish: () => void;
  onAddAnother: () => void;
  onRemove: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [choosing, setChoosing] = useState(false);
  // Profile picture (C8, Netflix-style): a book character. A new child gets a free one to start.
  const editId = mode?.kind === "edit" ? mode.child.id : undefined;
  const avatar = typeof answers.avatar === "string" && answers.avatar ? answers.avatar : freeAvatar(editId);
  const taken = Object.fromEntries(siblings.map((c) => [c.answers.avatar as string, displayName(c.name)]));
  const kind = mode?.kind ?? "first";
  const signedIn = isSignedIn();
  // Room for one more after this child is saved (a new child takes a place too).
  const roomForAnother = readChildren().list.length + (kind === "new" ? 1 : 0) < MAX_CHILDREN;
  const display = (q: Question): string | null => {
    const v = answers[q.id];
    if (q.kind === "date") return formatDob(v);
    if (q.kind === "text") return typeof v === "string" && v.trim() ? v.trim() : null;
    if (q.kind === "single" && q.followUp && typeof v === "string") {
      if (v === q.followUp.whenValue) {
        const items = answers[q.followUp.id];
        return Array.isArray(items) && items.length ? items.join(", ") : null;
      }
      if (v === "no") return "None";
    }
    const vals = Array.isArray(v) ? v : v ? [v] : [];
    if (!vals.length) return null;
    const labels = vals
      .filter((x) => !(q.kind === "multi" && q.followUp && x === q.followUp.whenValue))
      .map((x) => q.options.find((o) => o.value === x)?.label ?? x);
    if (q.kind === "multi" && q.followUp && vals.includes(q.followUp.whenValue)) {
      const extra = answers[q.followUp.id];
      if (Array.isArray(extra)) labels.push(...extra);
    }
    return labels.length ? labels.join(", ") : null;
  };
  const who = childName || "your child";

  // Only answered questions are listed — skipped optional ones are left out.
  const rows = questions.map((q, i) => ({ q, i, text: display(q) })).filter((r) => r.text !== null);

  return (
    <div className="flex flex-1 flex-col">
      {kind !== "first" ? (
        <>
          <button
            type="button"
            onClick={() => setChoosing(true)}
            aria-label={`Change ${who}'s picture`}
            className="group relative mb-6 self-start rounded-[28%] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#1d2838]"
          >
            <ReaderAvatar child={{ name: childName, answers: { ...answers, avatar } }} size={104} />
            <span aria-hidden className="absolute -bottom-1 -right-1 grid size-10 place-items-center rounded-full bg-[#1d2838] text-white shadow-md transition-transform group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" />
              </svg>
            </span>
          </button>
          <AvatarChooser
            open={choosing}
            name={childName}
            value={avatar}
            taken={taken}
            onPick={(id) => {
              onAvatar(id);
              setChoosing(false);
            }}
            onClose={() => setChoosing(false)}
          />
        </>
      ) : null}
      <h1 ref={headingRef} tabIndex={-1} className="type-display outline-none">
        {kind === "edit" ? `${childName || "Your child"}'s answers` : `All set for ${who}`}
      </h1>
      <p className="mt-3 type-body-lg text-[#1d2838]/70">
        {kind === "edit"
          ? "Tap any answer to change it. New answers give a fresh set of books."
          : kind === "first" && !signedIn
            ? `Check your answers, then sign in with Google to see ${childName ? `${childName}'s` : "your"} books.`
            : `Check your answers, then see ${childName ? `${childName}'s` : "their"} books.`}
      </p>

      <ul className="mt-8 divide-y divide-[#1d2838]/10 border-y border-[#1d2838]/10">
        {rows.map(({ q, i, text }) => (
          <li key={q.id}>
            <button
              type="button"
              onClick={() => onEdit(i)}
              aria-label={`Edit ${q.summaryLabel}: ${text}`}
              className="group flex w-full items-baseline gap-4 py-4 text-left transition-colors hover:bg-[#f4eee3]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838] sm:px-2"
            >
              <span className="w-24 shrink-0 type-caption text-[#1d2838]/55 sm:w-40">{q.summaryLabel}</span>
              <span className="flex-1 type-body">{text}</span>
              <span className="type-label text-[#1d2838]/60 underline underline-offset-4 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-visible:opacity-100">
                Edit
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* Quiet secondary actions: another reader; removing this one (edit). */}
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        {roomForAnother ? (
          <button type="button" onClick={onAddAnother} className="type-label underline underline-offset-4 hover:text-[#1d2838]/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]">
            Got another reader? Add them
          </button>
        ) : null}
        {kind === "edit" && !confirmRemove ? (
          <button type="button" onClick={() => setConfirmRemove(true)} className="type-label text-[#b3402a] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]">
            Remove {who}
          </button>
        ) : null}
      </div>
      {kind === "edit" && confirmRemove ? (
        <div role="alertdialog" aria-labelledby="remove-title" className="mt-4 rounded-[24px] bg-[#fbe4dc] p-5">
          <p id="remove-title" className="type-body font-semibold">Remove {who} and their answers?</p>
          <p className="mt-1 type-body-sm text-[#1d2838]/70">Books already in your box stay there, under &ldquo;Just browsing&rdquo;.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={onRemove} className="h-11 rounded-full bg-[#b3402a] px-5 type-label text-white hover:bg-[#9a3522] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]">
              Remove {who}
            </button>
            <button type="button" onClick={() => setConfirmRemove(false)} className="h-11 rounded-full border-2 border-[#1d2838]/15 px-5 type-label hover:border-[#1d2838] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]">
              Keep
            </button>
          </div>
        </div>
      ) : null}

      {/* Pinned to the bottom of the viewport so the main CTA is always visible. */}
      <div className="sticky bottom-0 z-10 -mx-2 mt-auto flex items-center justify-end gap-1.5 rounded-t-[24px] bg-[#fffdf8]/90 px-2 pb-3 pt-6 backdrop-blur">
        {kind === "edit" ? (
          <Button variant="secondary" href="/children">
            Cancel
          </Button>
        ) : (
          <OutlineButton onClick={onBack} label="Previous question">
            <ArrowIcon dir="left" />
            Back
          </OutlineButton>
        )}
        <Button onClick={onFinish} variant="primary" arrow="right">
          {kind === "edit" ? "Save changes" : childName ? `See ${childName}'s books` : "See the books"}
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Number-tile grid (exact age). Same press + fill-from-tap as the list rows.  */
/* -------------------------------------------------------------------------- */

function TileGrid({
  label,
  options,
  value,
  onChoose,
  gridClass = "mt-8 grid grid-cols-5 gap-1.5 sm:grid-cols-8 sm:gap-2",
  tileClass = "aspect-square",
  isDisabled,
}: {
  label: string;
  options: Option[];
  value?: string;
  onChoose: (v: string) => void;
  /** Grid columns / spacing (default: the age-style 5 → 8 column grid). */
  gridClass?: string;
  /** Tile shape (default square). */
  tileClass?: string;
  /** Tiles that can't be picked (e.g. months still to come). */
  isDisabled?: (v: string) => boolean;
}) {
  return (
    <ul role="radiogroup" aria-label={label} className={gridClass}>
      {options.map((o) => {
        const selected = value === o.value;
        const disabled = isDisabled?.(o.value) ?? false;
        return (
          <li key={o.value}>
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={o.label}
              disabled={disabled}
              onPointerDown={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
                e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
              }}
              onKeyDown={(e) => {
                e.currentTarget.style.removeProperty("--x");
                e.currentTarget.style.removeProperty("--y");
              }}
              onClick={() => onChoose(o.value)}
              className={`relative grid w-full place-items-center overflow-hidden rounded-[18px] bg-[#f4eee3] transition-[background-color,scale,opacity] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838] active:scale-[0.95] disabled:pointer-events-none disabled:opacity-30 sm:rounded-[22px] ${tileClass} ${
                selected ? "" : "hover:bg-[#ece3d3]"
              }`}
            >
              <span
                aria-hidden
                className={`absolute inset-0 bg-[#1d2838] transition-[clip-path] duration-[520ms] motion-reduce:transition-none ${selected ? "ease-[cubic-bezier(0.22,1,0.36,1)]" : "ease-[cubic-bezier(0.64,0,0.78,0)]"}`}
                style={{
                  clipPath: selected
                    ? "circle(150% at var(--x, 50%) var(--y, 50%))"
                    : "circle(0% at var(--x, 50%) var(--y, 50%))",
                }}
              />
              <span
                aria-hidden
                className={`relative text-2xl font-medium tabular-nums tracking-[-0.02em] transition-[color,scale,rotate] duration-[450ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] sm:text-3xl ${
                  selected ? "rotate-[-8deg] scale-110 text-[#f26b4f] delay-[60ms]" : "text-[#1d2838] delay-[330ms]"
                } ${o.tile && o.tile.length > 2 ? "text-xl sm:text-2xl" : ""}`}
              >
                {o.tile ?? o.label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/* Chip input — type a title, press Enter (or Add) to turn it into a chip.     */
/* -------------------------------------------------------------------------- */

function ChipInput({
  label,
  placeholder,
  items,
  onChange,
}: {
  label: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // When revealed, bring the field fully into view (clear of the pinned
  // Back/Continue bar) and put the cursor in it.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      boxRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      inputRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const add = () => {
    const t = draft.trim();
    if (!t) return;
    if (!items.some((x) => x.toLowerCase() === t.toLowerCase())) onChange([...items, t]);
    setDraft("");
  };

  return (
    <div ref={boxRef} className="scroll-mb-28 rounded-[24px] bg-[#f4eee3] p-3 ring-2 ring-[#1d2838]/10">
      {items.length ? (
        <ul className="mb-2 flex flex-wrap gap-1.5" aria-label={`${label} added`}>
          {items.map((t) => (
            <li key={t} className="flex animate-q-in items-center gap-1 rounded-full bg-[#1d2838] py-1.5 pl-4 pr-1.5 text-white">
              <span className="type-body-sm">{t}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((x) => x !== t))}
                aria-label={`Remove ${t}`}
                className="grid size-7 place-items-center rounded-full transition-colors hover:bg-white/15"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex items-center gap-2">
        <label htmlFor="chip-input" className="sr-only">
          {label}
        </label>
        <input
          id="chip-input"
          ref={inputRef}
          type="text"
          value={draft}
          enterKeyHint="enter"
          autoComplete="off"
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault(); // don't submit the form
              add();
            } else if (e.key === "Backspace" && !draft && items.length) {
              onChange(items.slice(0, -1));
            }
          }}
          className="h-12 min-w-0 flex-1 rounded-[18px] bg-transparent px-3 type-body-lg tracking-[-0.02em] outline-none placeholder:text-[#1d2838]/35"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="h-12 shrink-0 rounded-[16px] bg-[#1d2838] px-4 font-medium text-white transition-opacity disabled:opacity-25"
        >
          Add
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Left-panel collection: illustrations for every answer picked so far, across */
/* all questions. Tiles are keyed by question+answer, so earlier picks stay put */
/* (no re-animation) and only new picks pop in. Dislikes get a no-sign badge.   */
/* -------------------------------------------------------------------------- */

const ART_TILTS = ["-rotate-6", "rotate-3", "-rotate-2", "rotate-6", "-rotate-3", "rotate-2"];
const MAX_TILES = 10;

/* -------------------------------------------------------------------------- */
/* Date of birth: month + year required, day optional ("birthday surprise").   */
/* -------------------------------------------------------------------------- */

const SHORT_MONTHS = MONTHS.map((m) => m.slice(0, 3));
const pad = (n: number) => String(n).padStart(2, "0");
const daysIn = (y: number, m: number) => new Date(y, m, 0).getDate();

/** Small label above each tile group. */
function Step({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <p className="mt-8 flex items-baseline gap-2 type-label first:mt-6">
      {children}
      {hint ? <span className="font-normal text-[#1d2838]/50">{hint}</span> : null}
    </p>
  );
}

/**
 * Date of birth as tiles, like the rest of the questions: year → month (appears once a year is
 * picked) → optional day ("Add the day for a birthday surprise"). Dates still to come are greyed.
 */
function DobPicker({ value, name, onChange }: { value: string; name: string; onChange: (v: string) => void }) {
  const { y, m, d } = dobParts(value);
  const [withDay, setWithDay] = useState(Boolean(d));
  const today = new Date();
  const thisYear = today.getFullYear();
  const who = name || "your child";

  const set = (next: { y: string; m: string; d: string }) => {
    // Keep the parts consistent: no month in the future, no 31st in a 30-day month.
    if (next.y && next.m && Number(next.y) === thisYear && Number(next.m) > today.getMonth() + 1) next.m = "";
    if (next.y && next.m && next.d && Number(next.d) > daysIn(Number(next.y), Number(next.m))) next.d = "";
    onChange(`${next.y}-${next.m}-${next.d}`);
  };

  const years: Option[] = Array.from({ length: MAX_AGE + 1 }, (_, i) => {
    const yr = String(thisYear - i);
    return { value: yr, label: yr, tile: yr };
  });
  const months: Option[] = SHORT_MONTHS.map((short, i) => ({ value: pad(i + 1), label: MONTHS[i], tile: short }));
  const dayCount = y && m ? daysIn(Number(y), Number(m)) : 31;
  const days: Option[] = Array.from({ length: dayCount }, (_, i) => ({ value: pad(i + 1), label: `${i + 1}`, tile: String(i + 1) }));
  const futureMonth = (v: string) => Number(y) === thisYear && Number(v) > today.getMonth() + 1;
  const futureDay = (v: string) => Number(y) === thisYear && Number(m) === today.getMonth() + 1 && Number(v) > today.getDate();

  const problem = dobProblem(value);
  const age = !problem ? ageInWords(value) : null;

  return (
    <div>
      <Step>Year</Step>
      <TileGrid label={`Year ${who} was born`} options={years} value={y} onChoose={(v) => set({ y: v, m, d })} gridClass="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-8 sm:gap-2" tileClass="h-14 sm:h-16 [&>span:last-child]:text-xl sm:[&>span:last-child]:text-2xl" />

      {y ? (
        <div className="animate-q-in">
          <Step>Month</Step>
          <TileGrid
            label={`Month ${who} was born`}
            options={months}
            value={m}
            onChoose={(v) => set({ y, m: v, d })}
            isDisabled={futureMonth}
            gridClass="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-6 sm:gap-2"
            tileClass="h-14 sm:h-16 [&>span:last-child]:text-xl sm:[&>span:last-child]:text-2xl"
          />
        </div>
      ) : null}

      {y && m ? (
        withDay ? (
          <div className="animate-q-in">
            <Step hint="optional · for a birthday surprise">Day</Step>
            <TileGrid
              label={`Day ${who} was born`}
              options={days}
              value={d}
              onChoose={(v) => set({ y, m, d: v === d ? "" : v })}
              isDisabled={futureDay}
              gridClass="mt-3 grid max-w-[440px] grid-cols-7 gap-1 sm:gap-1.5"
              tileClass="h-11 rounded-[14px]! sm:h-12 [&>span:last-child]:text-base sm:[&>span:last-child]:text-lg"
            />
            <button
              type="button"
              onClick={() => {
                setWithDay(false);
                set({ y, m, d: "" });
              }}
              className="mt-3 rounded type-caption text-[#1d2838]/60 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]"
            >
              Skip the day
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setWithDay(true)}
            className="mt-6 inline-flex animate-q-in items-center gap-2 rounded-full border-2 border-dashed border-[#1d2838]/25 px-4 py-2.5 type-label transition-colors hover:border-[#1d2838] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]"
          >
            <span aria-hidden>🎂</span> Add the day for a birthday surprise
          </button>
        )
      ) : null}

      <p aria-live="polite" className={`mt-6 min-h-7 type-body-lg ${problem ? "text-[#b3402a]" : "text-[#1d2838]/80"}`}>
        {problem ??
          (age
            ? `${who} is ${age} old${d ? ` · turns ${(ageFromDob(value) ?? 0) + 1} on ${Number(d)} ${MONTHS[Number(m) - 1]} 🎉` : "."}`
            : "")}
      </p>
    </div>
  );
}

function PickedArt({ questions, answers }: { questions: Question[]; answers: Answers }) {
  const items: { key: string; art: React.ReactNode; dislike: boolean }[] = [];
  for (const q of questions) {
    if (q.kind === "text" || q.kind === "date") continue;
    const v = answers[q.id];
    const values = Array.isArray(v) ? v : typeof v === "string" ? [v] : [];
    for (const value of values) {
      const art = answerArt(q.id, value);
      if (art) items.push({ key: `${q.id}-${value}`, art, dislike: q.id === "avoid" });
    }
  }
  if (!items.length) return null;
  const shown = items.slice(0, MAX_TILES);
  const extra = items.length - shown.length;

  return (
    <ul className="mb-4 flex flex-wrap items-end gap-1.5 sm:mb-6 sm:gap-2" aria-hidden>
      {shown.map(({ key, art, dislike }, i) => (
        <li
          key={key}
          className={`relative grid size-11 animate-[art-pop_520ms_cubic-bezier(0.34,1.56,0.64,1)_backwards] place-items-center rounded-[14px] bg-white p-1 shadow-[0_6px_14px_-10px_rgba(29,40,56,0.6)] motion-reduce:animate-none sm:size-16 sm:rounded-[20px] sm:p-1.5 ${
            ART_TILTS[i % ART_TILTS.length]
          }`}
        >
          {art}
          {dislike ? (
            <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-[#f26b4f] ring-2 ring-white sm:size-6">
              <svg viewBox="0 0 24 24" className="size-3 sm:size-3.5" fill="none" stroke="#1d2838" strokeWidth="2.6" strokeLinecap="round">
                <circle cx="12" cy="12" r="8" />
                <path d="M6.5 6.5l11 11" />
              </svg>
            </span>
          ) : null}
        </li>
      ))}
      {extra > 0 ? (
        <li className="grid size-9 place-items-center self-center rounded-full bg-[#1d2838] type-label text-white sm:size-11">+{extra}</li>
      ) : null}
    </ul>
  );
}
