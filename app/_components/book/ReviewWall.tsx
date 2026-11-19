"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SectionTitle } from "../ui/SectionTitle";

export type Review = { quote: string; who: string; book?: { title: string; href: string } };

const SPEED_PX_S = 40;

const CARDS = [
  { bg: "bg-[#faed8f]", tilt: "sm:-rotate-[0.67deg]", from: "-9deg" },
  { bg: "bg-[#ffdbfd]", tilt: "sm:-rotate-[5.45deg]", from: "7deg" },
  { bg: "bg-[#a4f6f8]", tilt: "sm:-rotate-[7.1deg]", from: "-14deg" },
];

function styleIndex(i: number, count: number) {
  const k = i % CARDS.length;
  return count > 1 && i === count - 1 && k === 0 ? 1 : k;
}

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
  const trackRef = useRef<HTMLUListElement>(null);
  const seamRef = useRef<HTMLLIElement>(null);
  const [loop, setLoop] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    const seam = seamRef.current;
    if (!track || !seam) return;
    const first = track.firstElementChild as HTMLElement | null;
    const measure = () => setLoop(first ? Math.max(0, seam.offsetLeft - first.offsetLeft) : 0);
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, [reviews.length]);

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
      <div className="overflow-x-clip motion-reduce:overflow-x-auto motion-reduce:[scrollbar-width:none]">
        <ul
          ref={trackRef}
          aria-label="Reviews from parents"
          style={{ "--loop": `${loop}px`, "--loop-dur": `${loop / SPEED_PX_S}s` } as React.CSSProperties}
          className={`review-track flex w-max items-stretch px-4 pb-6 pt-4 sm:px-6 sm:pt-6 ${loop ? "" : "[animation:none]"}`}
        >
          {[0, 1].map((copy) =>
            reviews.map((r, i) => {
              const card = CARDS[styleIndex(i, reviews.length)];
              const n = copy * reviews.length + i;
              return (
                <li
                  key={`${copy}-${r.quote}`}
                  ref={copy === 1 && i === 0 ? seamRef : undefined}
                  aria-hidden={copy === 1 || undefined}
                  style={{ "--i": i, "--from-r": card.from } as React.CSSProperties}
                  className={`review-card relative flex w-[300px] shrink-0 flex-col justify-between gap-6 rounded-[32px] px-5 pb-6 pt-10 sm:h-[334px] sm:w-[400px] ${
                    n > 0 ? "-ml-12 sm:-ml-20" : ""
                  } ${copy === 1 ? "motion-reduce:hidden" : ""} ${card.bg} ${card.tilt}`}
                >
                  <blockquote className="pr-10 text-xl font-semibold leading-[1.2] tracking-[-0.02em] sm:pr-20 sm:text-2xl">“{r.quote}”</blockquote>
                  <div className="pr-10 sm:pr-20">
                    <p className="text-lg font-medium italic leading-[1.2] tracking-[-0.02em] sm:text-xl">— {r.who}</p>
                    {r.book && (
                      <Link
                        href={r.book.href}
                        tabIndex={copy === 1 ? -1 : undefined}
                        className="relative after:absolute after:-inset-x-1 after:-inset-y-2.5 after:content-[''] link-underline mt-2 inline-block type-body-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]"
                      >
                        on {r.book.title}
                      </Link>
                    )}
                  </div>
                </li>
              );
            }),
          )}
        </ul>
      </div>
    </section>
  );
}
