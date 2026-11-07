"use client";

// Home: "How it works". Layout modelled on givingli.com's How it works carousel:
// one step at a time, a huge number on the left, the picture card in the centre,
// "Step 01 of 03" + title + text on the right, round prev/next arrows and the CTA below.
// Copy, colours and the code-drawn pictures are KutuBooku's own.
//
// Phones/tablets: number + tag, card, title and text stack in one column.
// Scroll-driven on lg+ when it fits the screen: the section pins and scrolling moves the steps
// (arrows then scroll the page to a step). Otherwise: arrows, Left/Right keys, swipe on the card.
// All three steps are laid out in the same grid cell, so the height never jumps;
// inactive ones are hidden from screen readers and can't be focused.
// Step change = a card deck: the card flicks off left with a tilt, the next rises from the
// stack behind, the number rolls like an odometer, the text lines slide up one by one.
// Reduced motion: steps swap instantly.

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MOCK_BOOKS } from "../_data/curation-mock";
import { rupees } from "../_lib/amazon";
import { SplitCta } from "./HomeHeader";
import { SectionTitle } from "./SectionTitle";
import { KutuAvatar } from "./KutuAvatar";

const STEPS = [
  {
    title: "Tell us about your child",
    text: "A few quick questions: their age, how they read, what they love and anything they just can't stand. No account needed to start.",
  },
  {
    title: "Get books picked for them",
    text: "KutuBooku AI picks books for your child and tells you why each one fits. Swap one, remove one, or ask for a fresh set any time.",
  },
  {
    title: "Add them all to your Amazon cart",
    text: "One tap puts every book you keep into your Amazon.in cart, and Amazon delivers. Fresh picks arrive every month.",
  },
];

const PICKS = MOCK_BOOKS.slice(0, 3);
// Book page colours (BookPdp GLANCE_TONES / CHIP_TONES)
const PICK_TONES = ["bg-[#ffe75e]", "bg-[#b6beff]", "bg-[#ffd0b2]"];
const PANEL_TONES = ["bg-[#b6beff]", "bg-[#ffe75e]", "bg-[#3f309b]"];

const pad = (n: number) => String(n).padStart(2, "0");

// ---- Step change animation: a card deck ----
// Cards before the active one have been flicked off to the left with a tilt.
// The active card sits on top; the ones after it wait in a stack behind it, each a
// little lower, smaller and turned, so their colours peek out. Going back flies the
// card back in. Positions follow from (index - active), so both directions just work.
const DECK_EASE = "cubic-bezier(0.22,1,0.36,1)";
const DECK_TILT = [0, 4, -3]; // stack tilt by depth
function deckStyle(i: number, active: number): React.CSSProperties {
  const d = i - active;
  if (d < 0)
    // flown off
    return { transform: "translate(-125%, -8%) rotate(-16deg)", opacity: 0, zIndex: 20 };
  return {
    transform: `translateY(${d * 18}px) scale(${1 - d * 0.06}) rotate(${DECK_TILT[d] ?? 0}deg)`,
    opacity: d > 2 ? 0 : 1,
    zIndex: 10 - d,
  };
}

/** Text lines slide up one after another as a step comes in; they leave together, at once. */
const lineClass = (on: boolean) =>
  `transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${on ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`;
const lineDelay = (on: boolean, k: number): React.CSSProperties => ({ transitionDelay: on ? `${180 + k * 90}ms` : "0ms" });

const ARROW_BTN =
  "grid size-12 place-items-center rounded-full border-2 border-black text-black transition-[background-color,color,scale,opacity] duration-200 hover:bg-black hover:text-[#FDDAA6] active:scale-95 disabled:pointer-events-none disabled:opacity-25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

export function HomeHowItWorks() {
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false); // scroll-driven mode (see below)
  const swipeX = useRef<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const stepPx = useRef(0); // page scroll per step while pinned
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([]); // progress bar fills (pinned)
  const last = STEPS.length - 1;
  const clampStep = (i: number) => Math.max(0, Math.min(last, i));

  // Scroll-driven (lg+, when the whole section fits on screen): the section pins and each
  // ~0.7 screen of scroll moves one step (same deck animation), with a short hold on the
  // last step before the page carries on. Like HomeBookList, the section is made taller
  // by the scroll distance and the content sticks inside it.
  // Phones / short screens: the content is taller than the screen, so it stays a normal
  // carousel driven by the arrows, swipe and keys.
  useEffect(() => {
    const section = sectionRef.current;
    const inner = innerRef.current;
    if (!section || !inner) return;
    const lg = window.matchMedia("(min-width: 64rem)");
    const PAD = 24; // breathing room above + below the pinned content (sizes below shrink with screen height)

    const sync = () => {
      if (!section.style.height || !stepPx.current) return;
      const s = Math.max(0, -section.getBoundingClientRect().top / stepPx.current); // steps scrolled
      setActive(clampStep(Math.round(s)));
      // Progress bar: segment i fills while step i is on screen (s from i-0.5 to i+0.5; the
      // first from 0), so the bar visibly tracks the scroll, not just the step. Written to the
      // DOM directly so scrolling doesn't re-render.
      fillRefs.current.forEach((el, i) => {
        if (!el) return;
        const f = i === 0 ? s / 0.5 : s - (i - 0.5);
        el.style.transform = `scaleX(${Math.max(0, Math.min(1, f))})`;
      });
    };
    const layout = () => {
      const fits = lg.matches && inner.offsetHeight + PAD <= window.innerHeight;
      stepPx.current = window.innerHeight * 0.7;
      section.style.height = fits ? `${window.innerHeight + (last + 0.5) * stepPx.current}px` : "";
      setPinned(fits);
      sync();
    };

    // Scroll: one sync per frame, and only while the section is on or near the screen (it used
    // to measure layout on every scroll event anywhere on the page).
    let raf = 0;
    let near = false;
    const onScroll = () => {
      if (!near) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(sync);
    };
    const io = new IntersectionObserver(([e]) => (near = e.isIntersecting), { rootMargin: "50% 0px" });
    io.observe(section);
    const ro = new ResizeObserver(layout); // its first callback also does the initial layout
    ro.observe(inner);
    lg.addEventListener("change", layout);
    window.addEventListener("resize", layout);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      lg.removeEventListener("change", layout);
      window.removeEventListener("resize", layout);
      window.removeEventListener("scroll", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Go to a step. Pinned: scroll the page to that step's spot (scroll stays the one source of truth). */
  const go = (i: number) => {
    const n = clampStep(i);
    const section = sectionRef.current;
    if (pinned && section) {
      const top = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + n * stepPx.current, behavior: "smooth" });
    } else {
      setActive(n);
    }
  };

  return (
    // relative z-10: covers the sticky hero, like the other home sections.
    // overflow-x-clip: cards flicked off the deck must not widen the page.
    <section ref={sectionRef} aria-labelledby="how-title" className="relative z-10 overflow-x-clip bg-[#FDDAA6] text-black">
      {/* pinned: sticks for the scroll distance and centres the content in the screen */}
      <div className={pinned ? "sticky top-0 flex h-dvh flex-col justify-center" : "pb-24 pt-20 sm:pb-32 sm:pt-28"}>
      <div ref={innerRef} className="mx-auto w-full max-w-[1920px] px-page">
        {/* Heading */}
        <SectionTitle id="how-title" eyebrow="How it works" align="center" className="mx-auto max-w-[1100px] lg:max-w-[1500px]">
          The right books for your child, in three steps.
        </SectionTitle>

        {/* Carousel */}
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="How it works, step by step"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(active + 1);
            if (e.key === "ArrowLeft") go(active - 1);
          }}
          className="mt-12 sm:mt-14 lg:mt-[clamp(20px,4.5vh,56px)]"
        >
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,min(640px,60vh))_minmax(0,1fr)] lg:gap-[4vw]">
            {/* Left: the big number (with the step tag beside it on phones) */}
            <div aria-hidden className="flex items-end justify-between gap-4 lg:justify-center">
              {/* Odometer: the numbers sit in a column inside a one-number window, which rolls to the active one. */}
              <span className="block h-[0.9em] overflow-hidden text-[clamp(96px,11vw,210px)] font-bold leading-[0.9] tracking-[-0.05em] tabular-nums">
                <span
                  className="block transition-transform duration-700 motion-reduce:transition-none"
                  style={{ transform: `translateY(${-active * 0.9}em)`, transitionTimingFunction: "cubic-bezier(0.34,1.4,0.64,1)" }}
                >
                  {STEPS.map((s, i) => (
                    <span key={s.title} className="block h-[0.9em]">
                      {pad(i + 1)}
                    </span>
                  ))}
                </span>
              </span>
              {/* phones: the step tag beside the number */}
              <span className="mb-2 grid text-sm font-bold uppercase tracking-[0.12em] text-black/60 lg:hidden">
                {STEPS.map((s, i) => (
                  <span key={s.title} className={`col-start-1 row-start-1 ${lineClass(i === active)}`} style={lineDelay(i === active, 0)}>
                    Step {pad(i + 1)} of {pad(STEPS.length)}
                  </span>
                ))}
              </span>
            </div>

            {/* Centre: the picture card (swipe to change step) */}
            <div
              aria-hidden
              // pb: room for the stack peeking out below the top card
              className="relative grid touch-pan-y pb-9 lg:pb-[clamp(24px,3.6vh,36px)]"
              onPointerDown={(e) => (swipeX.current = e.clientX)}
              onPointerUp={(e) => {
                if (swipeX.current === null) return;
                const dx = e.clientX - swipeX.current;
                swipeX.current = null;
                if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
              }}
            >
              {STEPS.map((s, i) => (
                <div
                  key={s.title}
                  className={`col-start-1 row-start-1 grid origin-bottom place-items-center rounded-[32px] p-6 shadow-[0_24px_48px_-30px_rgba(0,0,0,0.5)] transition-[transform,opacity] duration-700 motion-reduce:transition-none sm:p-10 lg:min-h-[min(420px,44vh)] lg:p-[clamp(20px,3.6vh,40px)] ${PANEL_TONES[i]} ${
                    i === active ? "" : "pointer-events-none"
                  }`}
                  style={{ ...deckStyle(i, active), transitionTimingFunction: DECK_EASE }}
                >
                  <div className="w-full max-w-[520px]">
                    <StepVisual step={i} />
                  </div>
                </div>
              ))}
            </div>

            {/* Right: tag, title, text */}
            <div className="grid" aria-live="polite">
              {STEPS.map((s, i) => (
                <div
                  key={s.title}
                  aria-hidden={i !== active}
                  inert={i !== active}
                  className={`col-start-1 row-start-1 ${i === active ? "" : "pointer-events-none"}`}
                >
                  <p className={`hidden text-sm font-bold uppercase tracking-[0.12em] text-black/60 lg:block ${lineClass(i === active)}`} style={lineDelay(i === active, 0)}>
                    Step {pad(i + 1)} of {pad(STEPS.length)}
                  </p>
                  <h3
                    className={`text-[clamp(32px,2.8vw,52px)] font-bold leading-[0.95] tracking-[-0.02em] lg:mt-4 ${lineClass(i === active)}`}
                    style={lineDelay(i === active, 1)}
                  >
                    {s.title}
                  </h3>
                  <p
                    className={`mt-4 max-w-[40ch] text-lg font-medium leading-[1.3] tracking-[-0.01em] text-black/80 sm:text-xl ${lineClass(i === active)}`}
                    style={lineDelay(i === active, 2)}
                  >
                    {s.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Controls, then the CTA below them (stacked, centred).
              Pinned (scroll-driven): a progress bar that fills as you scroll + a "scroll" hint;
              no arrows, since scrolling is the control.
              Otherwise (phones, short screens): arrows, the visible hint that this is a carousel. */}
          <div className="mt-8 flex flex-col items-center gap-6 sm:mt-10 lg:mt-[clamp(12px,2.8vh,40px)] lg:gap-[clamp(10px,2.2vh,24px)]">
          {pinned ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-4">
                {/* One segment per step, filling with the scroll. Each segment jumps to its step. */}
                <ol aria-label="Steps" className="flex items-center gap-2">
                  {STEPS.map((s, i) => (
                    <li key={s.title}>
                      <button
                        type="button"
                        onClick={() => go(i)}
                        aria-label={`Step ${i + 1}: ${s.title}`}
                        aria-current={i === active ? "step" : undefined}
                        // tall hit area, visible bar
                        className="group grid h-8 place-items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                      >
                        <span className="block h-2.5 w-20 overflow-hidden rounded-full bg-black/15 transition-colors group-hover:bg-black/25">
                          <span
                            ref={(el) => {
                              fillRefs.current[i] = el;
                            }}
                            className="block h-full origin-left rounded-full bg-black"
                            style={{ transform: "scaleX(0)" }}
                          />
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
                <span aria-hidden className="text-base font-bold tabular-nums">
                  {pad(active + 1)} / {pad(STEPS.length)}
                </span>
              </div>
            </div>
          ) : (
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous step" className={ARROW_BTN}>
              <Chevron dir="left" />
            </button>
            <span className="w-16 text-center text-base font-bold tabular-nums">
              {pad(active + 1)} / {pad(STEPS.length)}
            </span>
            <button type="button" onClick={() => go(active + 1)} disabled={active === last} aria-label="Next step" className={ARROW_BTN}>
              <Chevron dir="right" />
            </button>
          </div>
          )}
          <SplitCta href="/reading-preferences" label="Find books for my child" className="w-fit" />
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

/** Code-drawn mini screens, one per step. Decorative (the step text says it all). */
function StepVisual({ step }: { step: number }) {
  if (step === 0) {
    // The questionnaire: "How old is Meera?" with number tiles
    return (
      <div className="rounded-[28px] bg-[#fffdf8] p-6 shadow-[0_24px_48px_-28px_rgba(0,0,0,0.4)] sm:p-8">
        <p className="text-sm font-semibold text-black/50">Question 2 of 7</p>
        <p className="mt-2 text-[clamp(28px,2.4vw,40px)] font-bold leading-[0.95] tracking-[-0.02em]">How old is Meera?</p>
        <ul className="mt-6 grid grid-cols-4 gap-2">
          {[4, 5, 6, 7].map((n) => (
            <li
              key={n}
              className={`grid aspect-square place-items-center rounded-2xl text-2xl font-bold tabular-nums sm:text-3xl ${
                n === 6 ? "bg-[#f9a220]" : "bg-black/5"
              }`}
            >
              {n}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-1.5">
          {["🦕 Dinosaurs", "🪐 Space", "😂 Funny"].map((t) => (
            <span key={t} className="rounded-full bg-[#fbbe63] px-3.5 py-2 text-base font-semibold leading-none">
              {t}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (step === 1) {
    // The picks: three tilted colour cards, each with a reason
    const reasons = ["Loves animals", "Brave stories", "Bedtime read"];
    return (
      <div className="flex flex-col gap-5">
        <p className="flex w-fit items-center gap-2 rounded-full bg-black py-1.5 pl-1.5 pr-4 text-base font-semibold leading-none text-white">
          <KutuAvatar size={28} />
          Picked for Meera by KutuBooku AI
        </p>
        <ul className="grid grid-cols-3 gap-3">
          {PICKS.map((b, i) => (
            <li
              key={b.id}
              className={`rounded-[20px] p-2.5 ${PICK_TONES[i]} ${["-rotate-3", "rotate-2 translate-y-3", "-rotate-1"][i]}`}
            >
              <span className="relative block aspect-[3/4] overflow-hidden rounded-r-[8px] rounded-l-[3px]">
                <Image src={b.cover} alt="" fill sizes="180px" className="object-cover" />
              </span>
              <span className="mt-2 block w-fit rounded-full bg-black px-2.5 py-1 text-xs font-semibold leading-none text-white">{reasons[i]}</span>
              <span className="mt-1.5 line-clamp-1 block text-sm font-bold tracking-[-0.01em]">{b.title}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // The cart: stacked covers and the split "Add to Amazon cart" button
  const total = PICKS.reduce((n, b) => n + b.price, 0);
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative h-[clamp(160px,14vw,240px)] w-full">
        {PICKS.map((b, i) => (
          <span
            key={b.id}
            className="absolute top-0 aspect-[3/4] h-full overflow-hidden rounded-r-[10px] rounded-l-[3px] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]"
            style={{ left: `calc(50% - 22% + ${(i - 1) * 26}%)`, rotate: `${(i - 1) * 7}deg`, zIndex: i === 1 ? 2 : 1 }}
          >
            <Image src={b.cover} alt="" fill sizes="200px" className="object-cover" />
          </span>
        ))}
      </div>
      <div className="flex h-14 w-full max-w-[420px] items-stretch gap-0.5">
        <span className="flex flex-1 items-center justify-center whitespace-nowrap rounded-lg bg-[#f9a220] px-5 text-lg font-bold leading-none tracking-[-0.02em] sm:text-xl">
          Add 3 to Amazon cart · {rupees(total)}
        </span>
        <span className="grid w-14 shrink-0 place-items-center rounded-lg bg-[#f9a220]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/arrow-right.svg" alt="" width={18.6562} height={16} />
        </span>
      </div>
    </div>
  );
}
