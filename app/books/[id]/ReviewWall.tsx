"use client";

// "Don't just take our word for it" — a small stack of printed recommendation cards.
// Entry (once, when the section scrolls into view): the two heading lines rise out of
// a mask, then the cards are dealt in one by one and settle onto their tilt.
// Hover (pointer devices, sm+): the card lifts, straightens and comes forward; its
// neighbours slide apart so the part they were covering shows.
// Motion lives in globals.css (.review-wall / .review-card). Reduced motion: no motion.

import { useEffect, useRef, useState } from "react";
import { SectionTitle } from "../../_components/SectionTitle";

// Colour and tilt in design order; the next card overlaps the one before.
// `from` is the tilt each card is dealt in from, so they don't all arrive the same way.
const CARDS = [
  { bg: "bg-[#faed8f]", tilt: "sm:-rotate-[0.67deg]", from: "-9deg" },
  { bg: "bg-[#ffdbfd]", tilt: "sm:-rotate-[5.45deg]", from: "7deg" },
  { bg: "bg-[#a4f6f8]", tilt: "sm:-rotate-[7.1deg]", from: "-14deg" },
];

export function ReviewWall({ reviews }: { reviews: { quote: string; who: string }[] }) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setInView(true); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setInView(true);
        io.disconnect();
      },
      { rootMargin: "0px 0px -20% 0px" }, // start once the section is well into view
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} aria-labelledby="reviews-title" data-in={inView || undefined} className="review-wall flex flex-col gap-10 py-10">
      <SectionTitle id="reviews-title" eyebrow="from parents">
        <span className="review-line">
          <span style={{ "--i": 0 } as React.CSSProperties}>Don&apos;t just take</span>
        </span>
        <span className="review-line">
          <span style={{ "--i": 1 } as React.CSSProperties}>our word for it</span>
        </span>
      </SectionTitle>
      <ul className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-0 sm:pt-6">
        {reviews.map((r, i) => {
          const card = CARDS[i % CARDS.length];
          return (
            <li
              key={r.quote}
              style={{ "--i": i, "--from-r": card.from } as React.CSSProperties}
              className={`review-card relative flex w-full max-w-[400px] flex-col justify-between gap-6 rounded-[32px] px-5 pb-6 pt-10 sm:h-[334px] sm:w-[400px] sm:shrink-0 ${i > 0 ? "sm:-ml-20" : ""} ${card.bg} ${card.tilt}`}
            >
              {/* The next card covers this one's right 80px, so keep the text clear of it. */}
              <blockquote className={`pr-4 text-xl ${i < reviews.length - 1 ? "sm:pr-20" : ""} font-semibold leading-[1.2] tracking-[-0.02em] sm:text-2xl`}>“{r.quote}”</blockquote>
              <p className="text-lg font-medium italic leading-[1.2] tracking-[-0.02em] sm:text-xl">— {r.who}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
