"use client";

// Home: FAQ, after the book listing. Same cream panel, navy ink and amber
// accent as the rest of the home page.
// lg+: title and CTA stay pinned on the left while the questions scroll on the right.
// One answer open at a time. The open row turns amber and its corners round into
// a pill-ish card, like the buttons' hover morph. The answer opens with a
// grid-rows height transition (no measuring), and is instant with reduced motion.

import { useId, useState } from "react";
import { HOME_FAQ } from "../_data/faq";
import { Button } from "./Button";
import { SectionTitle } from "./SectionTitle";

export function HomeFaq() {
  const [open, setOpen] = useState<number | null>(0);
  const uid = useId();

  return (
    // relative z-10: covers the sticky hero, like HomeBookList.
    <section id="faq" tabIndex={-1} aria-labelledby="home-faq-title" className="relative z-10 bg-[#fffdf8] outline-none">
      <div className="mx-auto grid w-full max-w-[1920px] gap-10 px-page pb-24 pt-20 sm:pb-32 sm:pt-28 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-[6vw]">
        {/* Same max width and side padding as the header (HomeHeader), so the edges line up. */}
        {/* Left: title + CTA */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionTitle id="home-faq-title" eyebrow="Good to know">
            Questions parents ask us
          </SectionTitle>
          <p className="mt-4 max-w-[36ch] type-body-lg text-[#1d2838]/70">
            Everything about how KutuBooku picks books for your child, and how buying them works.
          </p>
          <Button href="/reading-preferences" variant="primary" arrow="right" className="mt-8">
            Find books for my child
          </Button>
        </div>

        {/* Right: questions */}
        <ul className="flex flex-col gap-2">
          {HOME_FAQ.map((f, i) => {
            const isOpen = open === i;
            const btnId = `${uid}-q${i}`;
            const panelId = `${uid}-a${i}`;
            return (
              <li
                key={f.q}
                className={`rounded-[24px] transition-[background-color,border-radius] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  isOpen ? "rounded-[32px] bg-[#f1a903]" : "bg-[#f4eee3] hover:bg-[#efe6d6]"
                }`}
              >
                <h3>
                  <button
                    id={btnId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="group flex w-full items-center gap-4 rounded-[inherit] px-5 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838] sm:gap-6 sm:px-7 sm:py-6"
                  >
                    <span aria-hidden className="w-7 shrink-0 type-label tabular-nums text-[#1d2838]/50">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 type-title-sm sm:text-[22px]">{f.q}</span>
                    <PlusIcon open={isOpen} />
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                  inert={!isOpen}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[60ch] px-5 pb-6 pl-[calc(1.25rem+1.75rem+1rem)] type-body text-[#1d2838]/85 sm:px-7 sm:pb-7 sm:pl-[calc(1.75rem+1.75rem+1.5rem)]">
                      {f.a}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** A plus that turns into a minus (the vertical bar folds away). */
function PlusIcon({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid size-10 shrink-0 place-items-center rounded-full transition-colors duration-300 ${
        open ? "bg-[#1d2838] text-white" : "bg-[#fffdf8] text-[#1d2838] group-hover:bg-white"
      }`}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M5 12h14" />
        <path
          d="M12 5v14"
          className={`origin-center transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${open ? "scale-y-0" : ""}`}
        />
      </svg>
    </span>
  );
}
