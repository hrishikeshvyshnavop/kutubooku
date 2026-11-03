"use client";

import { startTransition, useEffect, useRef, useState, ViewTransition } from "react";
import { AGE_ASKED_AT_KEY, NAME_TOKEN, type Option, type Question } from "../_data/questions";
import { answerArt } from "../_components/AnswerArt";
import { ArrowIcon, BTN_PRIMARY, Button, OutlineButton } from "../_components/Button";

type Answers = Record<string, string | string[]>;

// Answers are kept in sessionStorage so they survive the sign-in step that
// comes after the questionnaire (CONTEXT.md Q7).
const STORAGE_KEY = "kb:reading-preferences";
const LETTERS = "abcdefghijklmnopqrstuvwxyz";

// Palette — warm and playful (one place to tweak).
const ACCENT = "bg-[#f26b4f]"; // coral: selected tile, Continue
// Left panel takes a different soft colour per question and fades between them.
const PANEL_COLOURS = ["#f6c453", "#9fcbf2", "#a9dfc0", "#f7ab95", "#c9b7f1", "#d8e88a"];



function load(): Answers {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function save(a: Answers) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(a));
  } catch {
    /* private mode etc. — answers still live in memory */
  }
}

/* -------------------------------------------------------------------------- */

export function Questionnaire({ questions }: { questions: Question[] }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  // True when a question was opened from the summary: finishing it returns there.
  const [editing, setEditing] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const saved = load();
    if (Object.keys(saved).length) setAnswers(saved); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

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
  const answered =
    (q.kind === "multi" ? Array.isArray(value) && value.length > 0 : typeof value === "string" && value.trim() !== "") &&
    !followUpPending;
  const canContinue = !followUpPending && (answered || q.optional);

  // The child's name (question 1) personalises every later question.
  // Capitalised for display; the saved answer stays exactly as typed.
  const childName = typeof answers.name === "string" ? answers.name.trim().replace(/(^|[\s'-])([a-z])/g, (_m: string, p: string, c: string) => p + c.toUpperCase()) : "";
  const fill = (t: string) => t.split(NAME_TOKEN).join(childName || "your child");

  const update = (id: string, v: string | string[]) =>
    setAnswers((prev) => {
      const next = { ...prev, [id]: v };
      save(next);
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
      if (q.id === "age") update(AGE_ASKED_AT_KEY, new Date().toISOString().slice(0, 10));
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


  return (
    <div className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col p-2.5 sm:p-3">

      <div className="grid flex-1 gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-3">
        {/* ---------------- Left column: context + back ---------------- */}
        <aside className="flex flex-col gap-2.5 lg:gap-3">
          <div style={{ backgroundColor: done ? PANEL_COLOURS[0] : PANEL_COLOURS[step % PANEL_COLOURS.length] }}
            className="relative flex flex-col rounded-[28px] p-5 transition-colors sm:rounded-[36px] sm:p-6 duration-700 ease-out sm:rounded-[48px] sm:p-8 lg:min-h-[min(560px,calc(100dvh-14rem))]">
            <p className="type-label text-[#1d2838]/80">
              {done ? "Summary" : editing ? "Editing" : q.optional ? "Optional" : "Required"}
            </p>

            <ViewTransition key={done ? "why-done" : `why-${step}`} name="q-why" share="q-swap" enter="q-swap" exit="q-swap" default="none">
            <p className="mt-4 type-lead sm:mt-6">
              {done ? "That's everything we need." : fill(q.why)}
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
            <Summary questions={questions} answers={answers} childName={childName} onEdit={editFromSummary} onBack={() => go(() => total - 1)} headingRef={headingRef} />
          ) : (
            <form
              className="flex flex-1 flex-col"
              onSubmit={(e) => {
                e.preventDefault();
                if (canContinue) next();
              }}
            >
              <fieldset className="flex flex-1 flex-col">
                <legend className="sr-only">{fill(q.question)}</legend>
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  className="max-w-[16ch] type-display outline-none"
                >
                  {fill(q.question)}
                </h1>
                <p className={`mt-4 type-caption text-[#1d2838]/60`}>
                  {q.kind === "multi" ? "Choose all that apply" : q.kind === "single" ? "Choose one" : "Type your answer"}
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
                  </div>
                ) : q.kind === "single" && q.layout === "grid" ? (
                  <TileGrid
                    label={fill(q.question)}
                    options={q.options}
                    value={typeof value === "string" ? value : undefined}
                    onChoose={choose}
                  />
                ) : (
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
  onEdit,
  onBack,
  headingRef,
  childName,
}: {
  childName: string;
  questions: Question[];
  answers: Answers;
  onEdit: (step: number) => void;
  onBack: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const display = (q: Question): string | null => {
    const v = answers[q.id];
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
      <h1 ref={headingRef} tabIndex={-1} className="type-display outline-none">
        All set for {who}
      </h1>
      <p className="mt-3 type-body-lg text-[#1d2838]/70">
        Check your answers, then sign in with Google to see {childName ? `${childName}'s` : "your"} books.
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

      {/* Pinned to the bottom of the viewport so the main CTA is always visible. */}
      <div className="sticky bottom-0 z-10 -mx-2 mt-auto flex items-center justify-end gap-1.5 rounded-t-[24px] bg-[#fffdf8]/90 px-2 pb-3 pt-6 backdrop-blur">
        <OutlineButton onClick={onBack} label="Previous question">
          <ArrowIcon dir="left" />
          Back
        </OutlineButton>
        <Button href="/sign-in?next=/curation" variant="primary" arrow="right">
          {childName ? `See ${childName}'s books` : "See the books"}
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
}: {
  label: string;
  options: Option[];
  value?: string;
  onChoose: (v: string) => void;
}) {
  return (
    <ul role="radiogroup" aria-label={label} className="mt-8 grid grid-cols-5 gap-1.5 sm:grid-cols-8 sm:gap-2">
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <li key={o.value}>
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={o.label}
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
              className={`relative grid aspect-square w-full place-items-center overflow-hidden rounded-[18px] bg-[#f4eee3] transition-[background-color,scale] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838] active:scale-[0.95] sm:rounded-[22px] ${
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

function PickedArt({ questions, answers }: { questions: Question[]; answers: Answers }) {
  const items: { key: string; art: React.ReactNode; dislike: boolean }[] = [];
  for (const q of questions) {
    if (q.kind === "text") continue;
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
