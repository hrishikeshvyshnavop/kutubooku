"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SectionTitle } from "./SectionTitle";

export type Review = { quote: string; who: string; book?: { title: string; href: string } };

const CARDS = [
  { bg: "bg-[#faed8f]", tilt: "sm:-rotate-[0.67deg]", from: "-9deg" },
  { bg: "bg-[#ffdbfd]", tilt: "sm:-rotate-[5.45deg]", from: "7deg" },
  { bg: "bg-[#a4f6f8]", tilt: "sm:-rotate-[7.1deg]", from: "-14deg" },
];

type ReviewWallProps = {
  reviews: Review[];
  id?: string;
  eyebrow?: string;
  className?: string;
};

export function ReviewWall({ reviews, id = "reviews", eyebrow = "from parents", className = "py-10" }: ReviewWallProps) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const titleId = `${id}-title`;

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
      { rootMargin: "0px 0px -20% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} id={id} aria-labelledby={titleId} data-in={inView || undefined} className={`review-wall flex flex-col gap-10 ${className}`}>
      <div className="mx-auto w-full max-w-[1312px] px-page">
        <SectionTitle id={titleId} eyebrow={eyebrow} className="mx-auto max-w-[1248px]">
          <span className="review-line">
            <span style={{ "--i": 0 } as React.CSSProperties}>Don&apos;t just take</span>
          </span>
          <span className="review-line">
            <span style={{ "--i": 1 } as React.CSSProperties}>our word for it</span>
          </span>
        </SectionTitle>
      </div>
      <div className="sm:overflow-x-auto sm:pb-6 sm:[scrollbar-width:none]" data-lenis-prevent-horizontal>
        <ul className="flex flex-col items-center gap-4 px-4 sm:mx-auto sm:w-max sm:flex-row sm:gap-0 sm:px-6 sm:pt-6">
          {reviews.map((r, i) => {
            const card = CARDS[i % CARDS.length];
            const last = i === reviews.length - 1;
            return (
              <li
                key={r.quote}
                style={{ "--i": i, "--from-r": card.from } as React.CSSProperties}
                className={`review-card relative flex w-full max-w-[400px] flex-col justify-between gap-6 rounded-[32px] px-5 pb-6 pt-10 sm:h-[334px] sm:w-[400px] sm:shrink-0 ${i > 0 ? "sm:-ml-20" : ""} ${card.bg} ${card.tilt}`}
              >
                <blockquote className={`pr-4 text-xl font-semibold leading-[1.2] tracking-[-0.02em] sm:text-2xl ${last ? "" : "sm:pr-20"}`}>“{r.quote}”</blockquote>
                <div className={last ? "" : "sm:pr-20"}>
                  <p className="text-lg font-medium italic leading-[1.2] tracking-[-0.02em] sm:text-xl">— {r.who}</p>
                  {r.book && (
                    <Link
                      href={r.book.href}
                      className="link-underline mt-2 inline-block type-body-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]"
                    >
                      on {r.book.title}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
