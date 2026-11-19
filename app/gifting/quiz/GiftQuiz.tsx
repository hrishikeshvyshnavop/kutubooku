"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AddToBoxButton } from "../../_components/ui/AddToBoxButton";
import { ArrowIcon, Button } from "../../_components/ui/Button";
import { rupeesFmt } from "../../_lib/format";
import { MOCK_BOOKS } from "../../_data/curation-mock";
import {
  EMPTY_GIFT_ANSWERS,
  GIFT_AGES,
  GIFT_BUDGETS,
  GIFT_INTERESTS,
  MAX_GIFT_INTERESTS,
  OCCASIONS,
  budgetOf,
  giftName,
  giftPicks,
  type GiftAnswers,
  type GiftPick,
  type QuizOption,
} from "../../_data/gifting";
import { clearGiftBasket, toggleGift, useGiftBasket } from "../../_lib/gift-basket";

const DRAFT_KEY = "kb:gift-quiz";
const PANEL_COLOURS = ["#f6c453", "#9fcbf2", "#a9dfc0", "#f7ab95", "#c9b7f1"];
const LETTERS = "abcdefghijklmnopqrstuvwxyz";
const ADVANCE_MS = 520;
const PRICE_BY_ID = new Map(MOCK_BOOKS.map((b) => [b.id, b.price]));

type StepId = "name" | "age" | "occasion" | "interests" | "budget";

const STEPS: { id: StepId; question: (who: string) => string; why: (who: string) => string; hint: string }[] = [
  {
    id: "name",
    question: () => "Who's the gift for?",
    why: () => "We'll put their name on the gift tag. Leave it blank if it's a surprise for someone you don't know well.",
    hint: "Their first name or a nickname (optional)",
  },
  {
    id: "age",
    question: (who) => (who === "them" ? "How old are they?" : `How old is ${who}?`),
    why: () => "So every book suits their age. You don't need to know their reading level.",
    hint: "Choose one",
  },
  {
    id: "occasion",
    question: () => "What's the occasion?",
    why: () => "Birthdays, festivals and new siblings each have their own kind of story.",
    hint: "Choose one",
  },
  {
    id: "interests",
    question: (who) => (who === "them" ? "What are they into?" : `What's ${who} into?`),
    why: () => `Pick up to ${MAX_GIFT_INTERESTS}. Not sure? Skip it and we'll suggest books children their age love.`,
    hint: `Choose up to ${MAX_GIFT_INTERESTS}`,
  },
  {
    id: "budget",
    question: () => "What would you like to spend?",
    why: () => "For the whole gift. You pay book prices only: wrapping and delivery are on us.",
    hint: "Choose one",
  },
];

function loadDraft(): GiftAnswers | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY_GIFT_ANSWERS, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

function saveDraft(a: GiftAnswers) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(a));
  } catch {}
}

export function GiftQuiz() {
  const params = useSearchParams();
  const presetOccasion = OCCASIONS.some((o) => o.value === params.get("occasion")) ? (params.get("occasion") as string) : "";
  const [answers, setAnswers] = useState<GiftAnswers>({ ...EMPTY_GIFT_ANSWERS, occasion: presetOccasion });
  const [step, setStep] = useState(0);
  const advanceTimer = useRef<number | undefined>(undefined);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const draft = loadDraft();
    if (!draft) return;
    const restore = window.setTimeout(() => setAnswers(presetOccasion ? { ...draft, occasion: presetOccasion } : draft));
    return () => window.clearTimeout(restore);
  }, [presetOccasion]);

  useEffect(() => () => window.clearTimeout(advanceTimer.current), []);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const total = STEPS.length;
  const done = step >= total;
  const who = giftName(answers.name);

  const update = <K extends keyof GiftAnswers>(key: K, value: GiftAnswers[K]) =>
    setAnswers((prev) => {
      const next = { ...prev, [key]: value };
      saveDraft(next);
      return next;
    });

  const goTo = (s: number) => {
    window.clearTimeout(advanceTimer.current);
    setStep(Math.max(0, Math.min(s, total)));
  };

  const chooseAndAdvance = (key: "age" | "occasion" | "budget", value: string) => {
    update(key, value);
    window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => setStep((s) => Math.min(s + 1, total)), ADVANCE_MS);
  };

  const toggleInterest = (value: string) => {
    const cur = answers.interests;
    if (cur.includes(value)) update("interests", cur.filter((v) => v !== value));
    else if (cur.length < MAX_GIFT_INTERESTS) update("interests", [...cur, value]);
  };

  if (done) return <GiftPicks answers={answers} onEdit={() => goTo(0)} headingRef={headingRef} />;

  const s = STEPS[step];
  const showContinue = s.id === "name" || s.id === "interests";
  const skippable = (s.id === "name" && !answers.name.trim()) || (s.id === "interests" && !answers.interests.length);

  return (
    <div className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col p-2.5 sm:p-3">
      <div className="grid flex-1 grid-rows-[auto_1fr] gap-2.5 lg:grid-rows-none lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-3">
        <aside
          style={{ backgroundColor: PANEL_COLOURS[step % PANEL_COLOURS.length] }}
          className="flex flex-col rounded-[28px] p-5 transition-colors duration-700 ease-out sm:rounded-[48px] sm:p-8 lg:min-h-[min(560px,calc(100dvh-14rem))]"
        >
          <p className="type-label text-[#1d2838]/80">{who === "them" ? "Finding a gift" : `A gift for ${who}`}</p>
          <p key={step} className="mt-4 animate-q-in type-lead sm:mt-6">
            {s.why(who)}
          </p>
          <div
            className="mt-5 sm:mt-8 lg:mt-auto"
            role="progressbar"
            aria-label="Gift quiz progress"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={step}
            aria-valuetext={`Question ${step + 1} of ${total}`}
          >
            <div className="flex items-baseline justify-between type-label tabular-nums text-[#1d2838]/80">
              <span>{`Question ${step + 1} of ${total}`}</span>
              <span>{Math.round((step / total) * 100)}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#1d2838]/15">
              <div
                className="h-full rounded-full bg-[#1d2838] transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                style={{ width: `${Math.max((step / total) * 100, 3)}%` }}
              />
            </div>
          </div>
        </aside>

        <main className="flex flex-col rounded-[36px] bg-[#fffdf8] px-page-inset pb-6 pt-8 sm:rounded-[56px] sm:pt-12 lg:rounded-b-none lg:rounded-t-[64px] lg:pt-16">
          <form
            key={step}
            className="flex flex-1 animate-q-in flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              goTo(step + 1);
            }}
          >
            <fieldset className="flex flex-1 flex-col">
              <legend className="sr-only">{s.question(who)}</legend>
              <h1 ref={headingRef} tabIndex={-1} className="max-w-[16ch] type-display outline-none">
                {s.question(who)}
              </h1>
              <p className="mt-4 type-caption text-[#1d2838]/60">{s.hint}</p>

              {s.id === "name" && (
                <div className="mt-8">
                  <label htmlFor="gift-name" className="sr-only">
                    Child&apos;s first name
                  </label>
                  <input
                    id="gift-name"
                    type="text"
                    autoComplete="off"
                    maxLength={40}
                    value={answers.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="e.g. Meera"
                    className="h-[76px] w-full rounded-[28px] bg-[#f4eee3] px-6 type-value outline-none placeholder:text-[#1d2838]/35 focus:ring-2 focus:ring-[#1d2838]"
                  />
                </div>
              )}

              {s.id === "age" && (
                <ul role="radiogroup" aria-label={s.question(who)} className="mt-8 grid grid-cols-5 gap-1.5 sm:grid-cols-8 sm:gap-2">
                  {GIFT_AGES.map((o) => (
                    <li key={o.value}>
                      <AgeTile option={o} selected={answers.age === o.value} onChoose={() => chooseAndAdvance("age", o.value)} />
                    </li>
                  ))}
                </ul>
              )}

              {s.id === "occasion" && (
                <OptionList
                  label={s.question(who)}
                  kind="single"
                  options={OCCASIONS}
                  isSelected={(v) => answers.occasion === v}
                  onChoose={(v) => chooseAndAdvance("occasion", v)}
                />
              )}

              {s.id === "interests" && (
                <OptionList
                  label={s.question(who)}
                  kind="multi"
                  options={GIFT_INTERESTS}
                  isSelected={(v) => answers.interests.includes(v)}
                  isDisabled={(v) => answers.interests.length >= MAX_GIFT_INTERESTS && !answers.interests.includes(v)}
                  onChoose={toggleInterest}
                />
              )}

              {s.id === "budget" && (
                <OptionList
                  label={s.question(who)}
                  kind="single"
                  options={GIFT_BUDGETS}
                  isSelected={(v) => answers.budget === v}
                  onChoose={(v) => chooseAndAdvance("budget", v)}
                />
              )}
            </fieldset>

            <div className="sticky bottom-0 z-10 -mx-2 mt-10 flex min-h-[80px] items-center justify-end gap-1.5 rounded-t-[24px] bg-[#fffdf8]/90 px-2 pb-3 pt-3 backdrop-blur">
              {step > 0 && (
                <Button variant="secondary" onClick={() => goTo(step - 1)} label="Previous question">
                  <ArrowIcon dir="left" />
                  Back
                </Button>
              )}
              {showContinue && (
                <Button type="submit" variant="primary" arrow="right">
                  {skippable ? "Skip" : "Continue"}
                </Button>
              )}
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

function pressOrigin(e: React.PointerEvent<HTMLButtonElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
}

function centreOrigin(e: React.KeyboardEvent<HTMLButtonElement>) {
  e.currentTarget.style.removeProperty("--x");
  e.currentTarget.style.removeProperty("--y");
}

function SelectionFill({ selected, rounded }: { selected: boolean; rounded: string }) {
  return (
    <span
      aria-hidden
      className={`absolute inset-0 bg-[#1d2838] transition-[clip-path] duration-[520ms] motion-reduce:transition-none ${rounded} ${
        selected ? "ease-[cubic-bezier(0.22,1,0.36,1)]" : "ease-[cubic-bezier(0.64,0,0.78,0)]"
      }`}
      style={{ clipPath: `circle(${selected ? "150%" : "0%"} at var(--x, 50%) var(--y, 50%))` }}
    />
  );
}

function AgeTile({ option, selected, onChoose }: { option: QuizOption; selected: boolean; onChoose: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={option.value === "0" ? "Under 1 year old" : `${option.value} years old`}
      onPointerDown={pressOrigin}
      onKeyDown={centreOrigin}
      onClick={onChoose}
      className={`relative grid aspect-square w-full place-items-center overflow-hidden rounded-[18px] bg-[#f4eee3] transition-[background-color,scale] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838] active:scale-[0.95] sm:rounded-[22px] ${
        selected ? "" : "hover:bg-[#ece3d3]"
      }`}
    >
      <SelectionFill selected={selected} rounded="" />
      <span
        aria-hidden
        className={`relative font-medium tabular-nums tracking-[-0.02em] transition-[color,scale,rotate] duration-[450ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          option.label.length > 2 ? "text-base sm:text-lg" : "text-2xl sm:text-3xl"
        } ${selected ? "rotate-[-8deg] scale-110 text-[#f26b4f] delay-[60ms]" : "text-[#1d2838] delay-[330ms]"}`}
      >
        {option.label}
      </span>
    </button>
  );
}

function OptionList({
  label,
  kind,
  options,
  isSelected,
  isDisabled,
  onChoose,
}: {
  label: string;
  kind: "single" | "multi";
  options: QuizOption[];
  isSelected: (v: string) => boolean;
  isDisabled?: (v: string) => boolean;
  onChoose: (v: string) => void;
}) {
  return (
    <ul role={kind === "single" ? "radiogroup" : "group"} aria-label={label} className={`mt-8 grid gap-2 ${options.length > 5 ? "sm:grid-cols-2" : ""}`}>
      {options.map((o, i) => {
        const selected = isSelected(o.value);
        const disabled = isDisabled?.(o.value) ?? false;
        return (
          <li key={o.value}>
            <button
              type="button"
              role={kind === "single" ? "radio" : "checkbox"}
              aria-checked={selected}
              disabled={disabled}
              onPointerDown={pressOrigin}
              onKeyDown={centreOrigin}
              onClick={() => onChoose(o.value)}
              className={`group relative flex h-[68px] w-full items-center gap-4 overflow-hidden rounded-[24px] bg-[#f4eee3] pl-3 pr-5 text-left type-option transition-[background-color,scale,opacity] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838] active:scale-[0.98] disabled:opacity-40 ${
                selected ? "" : "hover:bg-[#ece3d3]"
              }`}
            >
              <SelectionFill selected={selected} rounded="rounded-[24px]" />
              <span
                aria-hidden
                className={`relative grid size-11 shrink-0 place-items-center rounded-[14px] type-button transition-[background-color,color,rotate,scale] duration-[450ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none ${
                  selected ? "rotate-[-8deg] scale-105 bg-[#f26b4f] text-[#1d2838]" : "bg-[#1d2838] text-white delay-[80ms]"
                }`}
              >
                {LETTERS[i]}
              </span>
              <span className={`relative flex-1 transition-colors duration-[260ms] ease-out ${selected ? "text-white delay-[90ms]" : "text-[#1d2838] delay-[330ms]"}`}>
                {o.label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function GiftPicks({
  answers,
  onEdit,
  headingRef,
}: {
  answers: GiftAnswers;
  onEdit: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const picks = useMemo(() => giftPicks(answers), [answers]);
  const basket = useGiftBasket();
  const who = giftName(answers.name);

  return (
    <div className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col p-2.5 sm:p-3">
      <section
        aria-labelledby="gift-picks-title"
        className="flex flex-1 animate-q-in flex-col rounded-[36px] bg-[#fffdf8] px-page-inset pb-32 pt-8 sm:rounded-[56px] sm:pt-12 lg:pt-16"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="w-fit origin-bottom-left -rotate-3 font-[family-name:var(--font-caveat)] text-[28px] leading-none text-[#3b308f] sm:text-[32px]">
              gift ideas
            </p>
            <h1 id="gift-picks-title" ref={headingRef} tabIndex={-1} className="mt-3 max-w-[20ch] type-display outline-none">
              {who === "them" ? "Books they'll love to unwrap" : `Books ${who} will love to unwrap`}
            </h1>
            <p className="mt-4 max-w-[52ch] type-body-lg text-[#1d2838]/70">
              Each one suits their age, with the reason we picked it. Add the ones you like to your gift basket.
            </p>
          </div>
          <Button variant="secondary" arrow="left" onClick={onEdit} label="Change your answers">
            Change answers
          </Button>
        </div>

        <ul className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {picks.map((pick) => (
            <li key={pick.book.id}>
              <GiftCard pick={pick} inBasket={!!basket?.includes(pick.book.id)} />
            </li>
          ))}
        </ul>
      </section>

      <BasketBar basket={basket ?? []} budget={answers.budget} />
    </div>
  );
}

function GiftCard({ pick, inBasket }: { pick: GiftPick; inBasket: boolean }) {
  const { book, reason, delivery } = pick;
  return (
    <article className="flex h-full flex-col rounded-[28px] p-4 sm:p-5" style={{ backgroundColor: book.tone }}>
      <div className="relative aspect-square overflow-hidden rounded-[20px] bg-[#fffdf8]/40">
        <Image src={book.cover} alt="" fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw" className="object-contain p-6" />
      </div>
      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="type-title-sm">{book.title}</h2>
          <p className="mt-1 type-body-sm text-[#1d2838]/70">by {book.author}</p>
        </div>
        <p className="shrink-0 type-title-sm tabular-nums">{rupeesFmt(book.price)}</p>
      </div>
      <p className="mt-4 rounded-[16px] bg-[#fffdf8]/70 px-4 py-3 type-body">{reason}</p>
      <p className="mt-3 flex items-center gap-2 type-body-sm text-[#1d2838]/75">
        <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
          <circle cx="7" cy="17.5" r="1.8" />
          <circle cx="17" cy="17.5" r="1.8" />
        </svg>
        {delivery}
      </p>
      <AddToBoxButton
        selected={inBasket}
        onToggle={() => toggleGift(book.id)}
        title={book.title}
        whoseBox="gift basket"
        addLabel="Gift this book"
        inLabel="In gift basket"
        fill={{ bg: "#1d2838", fg: "#fffdf8" }}
        className="mt-auto w-full pt-5"
      />
    </article>
  );
}

function BasketBar({ basket, budget }: { basket: string[]; budget: string }) {
  const count = basket.length;
  const total = basket.reduce((sum, id) => sum + (PRICE_BY_ID.get(id) ?? 0), 0);
  const limit = budgetOf(budget)?.max ?? null;
  const budgetLine =
    limit === null ? null : total <= limit ? `Within your ${rupeesFmt(limit)} budget` : `${rupeesFmt(total - limit)} over your ${rupeesFmt(limit)} budget`;

  if (!count) return null;

  return (
    <div data-toast-avoid className="fixed inset-x-2.5 bottom-2.5 z-40 animate-q-in sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:w-[min(720px,calc(100vw-2rem))] sm:-translate-x-1/2">
      <div role="region" aria-label="Gift basket" className="flex items-center justify-between gap-4 rounded-[28px] bg-[#1d2838] p-3 pl-5 text-[#fffdf8] shadow-[0_24px_48px_-24px_rgba(29,40,56,0.7)] sm:pl-6">
        <div>
          <p className="type-title-sm tabular-nums">
            {count} {count === 1 ? "book" : "books"} · {rupeesFmt(total)}
          </p>
          <p className={`type-body-sm ${limit !== null && total > limit ? "text-[#ffb59f]" : "text-[#fffdf8]/70"}`}>
            {budgetLine ?? "Wrapping and delivery are on us"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button variant="ghost" tone="light" size="lg" onClick={clearGiftBasket} className="hidden sm:inline-flex">
            Clear
          </Button>
          <Button variant="split" size="md" href="/gifting/checkout">
            Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
