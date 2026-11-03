"use client";

// "Read it together" card, presented as KutuBooku AI writing it for you.
// When the card scrolls into view: a short "thinking" stage (every line is a
// shimmering bar the exact shape of the text to come), then the paragraphs
// type out one after another with a caret.
// - No layout shift: untyped text is laid out, just invisible.
// - Screen readers get the full text straight away (the animation is aria-hidden).
// - Reduced motion: everything is shown at once.

import { useEffect, useRef, useState } from "react";
import { KutuAvatar } from "../../_components/KutuAvatar";

export type AiBlock = { kind: "lead" | "cue" | "activity"; title?: string; text: string };

const THINK_MS = 1500; // shimmer stage
const CHARS_PER_MS = 0.11; // typing speed (~110 characters a second)
const PAUSE = 14; // "characters" of pause between paragraphs

type Stage = "idle" | "thinking" | "typing" | "done";

export function AiSummary({ blocks, bookTitle }: { blocks: AiBlock[]; bookTitle: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [typed, setTyped] = useState(0); // characters typed so far, across all blocks

  // Where each block starts in the shared character count.
  const full = blocks.map((b) => (b.title ? `${b.title}. ${b.text}` : b.text));
  const starts: number[] = [];
  let total = 0;
  for (const f of full) {
    starts.push(total);
    total += f.length + PAUSE;
  }

  // Start when the card is well into view (once).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStage("done"); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setStage("thinking");
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (stage === "thinking") {
      const t = setTimeout(() => setStage("typing"), THINK_MS);
      return () => clearTimeout(t);
    }
    if (stage !== "typing") return;
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const n = Math.floor((now - t0) * CHARS_PER_MS);
      if (n >= total) {
        setTyped(total);
        setStage("done");
        return;
      }
      setTyped(n);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [stage, total]);

  const thinking = stage === "idle" || stage === "thinking";

  return (
    <div ref={ref} className="flex max-w-[640px] flex-col gap-[1.2em]">
      {/* AI label: shimmering while it "reads", then settles */}
      <p className="flex items-center gap-2 text-base font-semibold tracking-[-0.01em] sm:text-lg" aria-live="polite">
        <KutuAvatar size={36} thinking={stage === "thinking" || stage === "typing"} />
        {stage === "done" ? (
          <span>Summarised by KutuBooku AI</span>
        ) : (
          <span className="animate-[ai-shimmer_1.6s_linear_infinite] bg-[linear-gradient(90deg,#1d2838_0%,#1d2838_35%,var(--book)_50%,#1d2838_65%,#1d2838_100%)] bg-[length:250%_100%] bg-clip-text text-transparent">
            {stage === "typing" ? `Writing ideas for ${bookTitle}…` : `KutuBooku AI is reading ${bookTitle}…`}
          </span>
        )}
      </p>

      {/* Full text for screen readers */}
      <div className="sr-only">
        {full.map((f) => (
          <p key={f}>{f}</p>
        ))}
      </div>

      {blocks.map((b, i) => {
        const text = full[i];
        const shown = stage === "done" ? text.length : Math.max(0, Math.min(text.length, typed - starts[i]));
        const active = stage === "typing" && shown > 0 && shown < text.length;
        // Bold title part ("One-Dot Masterpiece.") for activities
        const titleLen = b.title ? b.title.length + 1 : 0;
        return (
          <p key={text} aria-hidden className={b.kind === "cue" ? "italic" : ""}>
            {thinking ? (
              // Skeleton: the real text, invisible, on a shimmering bar per line.
              <span className="animate-[ai-shimmer_1.4s_linear_infinite] rounded-md bg-[linear-gradient(90deg,#efede8_0%,#efede8_40%,#faf8f4_50%,#efede8_60%,#efede8_100%)] bg-[length:250%_100%] text-transparent [box-decoration-break:clone]">
                {text}
              </span>
            ) : (
              <>
                <Typed text={text} upTo={shown} boldTo={titleLen} />
                {active && <span className="ml-0.5 inline-block h-[0.95em] w-[2px] translate-y-[3px] animate-[caret_0.9s_steps(1)_infinite] bg-current" />}
                <span className="text-transparent">
                  <Typed text={text} from={shown} boldTo={titleLen} />
                </span>
              </>
            )}
          </p>
        );
      })}
    </div>
  );
}

/** A slice of `text`, with the first `boldTo` characters in bold. */
function Typed({ text, from = 0, upTo = text.length, boldTo }: { text: string; from?: number; upTo?: number; boldTo: number }) {
  const bold = text.slice(from, Math.max(from, Math.min(upTo, boldTo)));
  const rest = text.slice(Math.max(from, boldTo), upTo);
  return (
    <>
      {bold && <span className="font-semibold">{bold}</span>}
      {rest}
    </>
  );
}
