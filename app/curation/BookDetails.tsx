"use client";

// Book details sheet. A full-page modal that leaves a 100px gap at the top so
// the curation list stays visible behind it. Section order follows Aardvark
// Book Club's book page: title block, at a glance, synopsis, reviews, excerpt,
// book notes, similar titles.

import { useEffect, useRef, useState } from "react";
import { detailsFor, similarTo, themeLabel, TOPIC_LABEL } from "../_data/book-details";
import type { MockBook } from "../_data/curation-mock";
import { amazonCartUrl } from "../_lib/amazon";
import { ArrowIcon, BTN_PRIMARY, BookCover, Button, OutlineButton, rupeesFmt } from "../_components/curation/ui";
import { CARD_TILTS, PILL_COLOURS, TAG_SHORT, cardColourFor } from "./card-style";

type Props = {
  /** Book to show; null closes the sheet. */
  book: MockBook | null;
  /** "Why we picked it" line, when the book is in the curation. */
  reason?: string;
  inList: boolean;
  selected: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onOpen: (id: string) => void;
  onClose: () => void;
};

export function BookDetails({ book, reason, inList, selected, onToggle, onAdd, onOpen, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  // Keep the last book on screen while the sheet animates closed.
  const [shown, setShown] = useState<MockBook | null>(book);
  if (book && book !== shown) setShown(book);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (book) {
      if (!d.open) d.showModal();
      d.scrollTo({ top: 0 });
      const html = document.documentElement;
      const prev = html.style.overflow;
      html.style.overflow = "hidden";
      return () => {
        html.style.overflow = prev;
      };
    }
    if (d.open) d.close();
  }, [book]);

  const b = shown;
  const d = b ? detailsFor(b) : null;
  const similar = b ? similarTo(b) : [];
  const ages = b ? (b.ageMin === b.ageMax ? `Age ${b.ageMin}` : `Ages ${b.ageMin}–${b.ageMax}`) : "";

  return (
    <dialog
      ref={ref}
      aria-labelledby="book-details-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // backdrop
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 h-[calc(100dvh-100px)] max-h-none w-full max-w-none overflow-y-auto overscroll-contain rounded-t-[32px] border-0 bg-[#fffdf8] p-0 text-[#1d2838] shadow-[0_-24px_60px_-20px_rgba(29,40,56,0.45)] [scrollbar-gutter:stable] sm:rounded-t-[48px] lg:rounded-t-[64px] translate-y-full transition-[translate,display,overlay] transition-discrete duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] open:translate-y-0 starting:open:translate-y-full motion-reduce:transition-none backdrop:bg-transparent backdrop:transition-[background-color,display,overlay] backdrop:transition-discrete backdrop:duration-500 open:backdrop:bg-[#1d2838]/45 starting:open:backdrop:bg-transparent"
    >
      {b && d ? (
        <div className="min-h-full font-[family-name:var(--font-q-sans)]">
          {/* Top bar: grabber + close */}
          <div className="sticky top-0 z-10 bg-[#fffdf8]/90 backdrop-blur">
            <span aria-hidden className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-[#1d2838]/15" />
            <div className="mx-auto flex max-w-[1920px] items-center justify-between gap-3 px-5 pb-2 pt-3 sm:px-10 lg:px-[6%]">
              <p className="truncate pt-2 type-label text-[#1d2838]/60">{inList ? "In your list" : "You might also like"}</p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close book details"
                className="mt-1 grid size-12 shrink-0 place-items-center rounded-[16px] bg-[#f4eee3] transition-[background-color,border-radius] duration-300 hover:rounded-[24px] hover:bg-[#ebe3d4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mx-auto max-w-[1920px] px-5 pb-16 sm:px-10 lg:px-[6%]">
            {/* ---------------------------- Title block ---------------------------- */}
            <section className="grid gap-8 pt-4 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:gap-12 lg:gap-16 lg:pt-8">
              <div className="mx-auto w-[200px] sm:w-[240px] md:mx-0 md:w-full">
                <BookCover book={b} className="shadow-[0_30px_50px_-24px_rgba(29,40,56,0.7)]" />
              </div>

              <div className="flex min-w-0 flex-col">
                <ul className="flex flex-wrap gap-1.5" aria-label="Themes & Topics">
                  {d.themes.map((t) => (
                    <li
                      key={t}
                      className="rounded-full bg-[#f4eee3] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#1d2838]/80 transition-colors hover:bg-[#e8decb]"
                    >
                      {themeLabel(t)}
                    </li>
                  ))}
                </ul>
                <h1 id="book-details-title" className="mt-4 type-display">
                  {b.title}
                </h1>
                <p className="mt-3 type-body-lg">by {b.author}</p>
                <p className="mt-2 type-body-sm text-[#1d2838]/60">
                  {ages} · {b.format} ·{" "}
                  {b.rating != null && b.reviews != null ? (
                    <span aria-label={`rated ${b.rating} out of 5 from ${b.reviews ?? 0} reviews`}>
                      ★ {b.rating} ({(b.reviews ?? 0).toLocaleString("en-IN")})
                    </span>
                  ) : null}
                </p>

                {reason ? (
                  <p className="mt-6 rounded-[20px] bg-[#f6c453]/35 px-5 py-4 type-body">
                    <span className="block type-label text-[#1d2838]/60">Why we picked it</span>
                    {reason}
                  </p>
                ) : null}

                <div className="mt-6 flex flex-wrap items-center gap-2 md:mt-auto md:pt-8">
                  <span className="mr-3 type-heading tabular-nums">{rupeesFmt(b.price)}</span>
                  {inList ? (
                    <OutlineButton onClick={onToggle} label={selected ? "Remove from cart selection" : "Include in cart selection"}>
                      {selected ? (
                        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M5 12l5 5L20 7" />
                        </svg>
                      ) : null}
                      {selected ? "In your cart list" : "Include in cart"}
                    </OutlineButton>
                  ) : (
                    <OutlineButton onClick={onAdd} label={`Add “${b.title}” to your list`}>
                      + Add to my list
                    </OutlineButton>
                  )}
                  <Button
                    variant="primary"
                    href={amazonCartUrl([b], `${b.title} ${b.author}`)}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    arrow="right"
                  >
                    Buy on Amazon
                  </Button>
                </div>
              </div>
            </section>

            {/* ---------------------------- At a glance ---------------------------- */}
            <Section title="At a glance">
              <dl className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                {d.glance.map((g, i) => (
                  <div key={g.label} className="rounded-[24px] p-5" style={{ backgroundColor: GLANCE_TONES[i % GLANCE_TONES.length] }}>
                    <dt className="type-label text-[#1d2838]/60">{g.label}</dt>
                    <dd className="mt-6 type-stat">{g.value}</dd>
                  </div>
                ))}
              </dl>
            </Section>

            {/* -------------------------- About this book -------------------------- */}
            <Section title="About this book">
              <div className="rounded-[28px] bg-[#f4eee3]/70 p-6 sm:p-8">
                <p className="max-w-[32ch] text-[26px] font-light italic leading-[1.2] tracking-[-0.025em] sm:text-[32px]">
                  “{d.tagline}”
                </p>
                <p className="mt-5 max-w-[68ch] text-lg font-light leading-relaxed text-[#1d2838]/85 sm:text-xl">
                  {d.about}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[#1d2838]/10 pt-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#1d2838]/50">
                    Key Themes:
                  </span>
                  {d.themes.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-[#fffdf8] px-3.5 py-1 text-xs font-semibold text-[#1d2838] shadow-xs"
                    >
                      {themeLabel(t)}
                    </span>
                  ))}
                </div>
              </div>
            </Section>

            {/* ----------------------------- Story Plot ----------------------------- */}
            {d.storyPlot ? (
              <Section title="Story Plot">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="relative flex flex-col justify-between rounded-[26px] bg-[#fffdf8] p-6 shadow-[inset_0_0_0_1px_rgba(29,40,56,0.08)]">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="grid size-9 place-items-center rounded-full bg-[#9fcbf2] text-sm font-bold text-[#1d2838]">
                          01
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#1d2838]/55">
                          The Beginning
                        </span>
                      </div>
                      <h3 className="mt-4 text-lg font-medium tracking-tight">The Setup</h3>
                      <p className="mt-2 text-base font-light leading-snug text-[#1d2838]/80">
                        {d.storyPlot.setup}
                      </p>
                    </div>
                  </div>

                  <div className="relative flex flex-col justify-between rounded-[26px] bg-[#fffdf8] p-6 shadow-[inset_0_0_0_1px_rgba(29,40,56,0.08)]">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="grid size-9 place-items-center rounded-full bg-[#f6c453] text-sm font-bold text-[#1d2838]">
                          02
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#1d2838]/55">
                          Turning Point
                        </span>
                      </div>
                      <h3 className="mt-4 text-lg font-medium tracking-tight">The Challenge</h3>
                      <p className="mt-2 text-base font-light leading-snug text-[#1d2838]/80">
                        {d.storyPlot.turningPoint}
                      </p>
                    </div>
                  </div>

                  <div className="relative flex flex-col justify-between rounded-[26px] bg-[#fffdf8] p-6 shadow-[inset_0_0_0_1px_rgba(29,40,56,0.08)]">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="grid size-9 place-items-center rounded-full bg-[#a9dfc0] text-sm font-bold text-[#1d2838]">
                          03
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#1d2838]/55">
                          Resolution
                        </span>
                      </div>
                      <h3 className="mt-4 text-lg font-medium tracking-tight">The Transformation</h3>
                      <p className="mt-2 text-base font-light leading-snug text-[#1d2838]/80">
                        {d.storyPlot.resolution}
                      </p>
                    </div>
                  </div>
                </div>
              </Section>
            ) : null}

            {/* ------------------------- Character Portraits ------------------------ */}
            {d.portraits && d.portraits.length > 0 ? (
              <Section title="Character Portraits">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {d.portraits.map((p, i) => (
                    <div
                      key={p.name}
                      className="flex items-start gap-4 rounded-[26px] bg-[#f4eee3] p-5 transition-transform hover:-translate-y-0.5"
                    >
                      {p.avatar ? (
                        <div
                          aria-hidden
                          className="grid size-14 shrink-0 place-items-center rounded-2xl text-2xl shadow-xs"
                          style={{ backgroundColor: GLANCE_TONES[i % GLANCE_TONES.length] }}
                        >
                          {p.avatar}
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <span className="inline-block rounded-full bg-[#1d2838]/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#1d2838]/70">
                          {p.role}
                        </span>
                        <h3 className="mt-1 text-xl font-medium tracking-tight text-[#1d2838]">
                          {p.name}
                        </h3>
                        <p className="mt-1 text-sm font-light leading-snug text-[#1d2838]/75">
                          {p.traits}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            ) : null}

            {/* ----------------------------- Activities ----------------------------- */}
            {d.activities && d.activities.length > 0 ? (
              <Section title="Activities for Kids & Parents">
                <div className="grid gap-4 sm:grid-cols-2">
                  {d.activities.map((act, i) => (
                    <div
                      key={act.title}
                      className="flex flex-col justify-between rounded-[28px] border-2 border-[#1d2838]/10 bg-[#fffdf8] p-6 shadow-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="grid size-7 place-items-center rounded-full bg-[#f26b4f] text-xs font-bold text-white">
                            {i + 1}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#f26b4f]">
                            Hands-on Activity
                          </span>
                        </div>
                        <h3 className="mt-3 text-2xl font-medium tracking-tight text-[#1d2838]">
                          {act.title}
                        </h3>
                        <p className="mt-2 text-base font-light leading-relaxed text-[#1d2838]/80">
                          {act.description}
                        </p>
                      </div>
                      <div className="mt-6 flex items-center gap-1.5 text-xs font-medium text-[#1d2838]/50">
                        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                        10–15 mins · Creative & playful
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            ) : null}

            {/* -------------------------- Conversation Cues ------------------------- */}
            {d.cues && d.cues.length > 0 ? (
              <Section title="Conversation Cues">
                <div className="rounded-[28px] bg-[#9fcbf2]/25 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#1d2838]/60">
                    Thoughtful prompts to spark meaningful chats while reading together
                  </p>
                  <ul className="mt-5 space-y-3">
                    {d.cues.map((cue, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3.5 rounded-[20px] bg-[#fffdf8] p-4.5 shadow-xs"
                      >
                        <span
                          aria-hidden
                          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#1d2838] text-xs font-bold text-white"
                        >
                          Q{i + 1}
                        </span>
                        <p className="text-base font-normal leading-snug text-[#1d2838]">
                          “{cue}”
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </Section>
            ) : null}

            {/* ------------------------------ Reviews ------------------------------ */}
            <Section title="Don't just take our word for it">
              <ul className="grid gap-2 md:auto-cols-fr md:grid-flow-col">
                {d.reviews.map((r) => (
                  <li key={r.who} className="flex flex-col rounded-[24px] bg-[#f4eee3] p-6">
                    <span aria-hidden className="text-5xl leading-none text-[#f26b4f]">“</span>
                    <blockquote className="mt-1 type-body">{r.quote}</blockquote>
                    <p className="mt-auto pt-5 type-caption text-[#1d2838]/60">{r.who}</p>
                  </li>
                ))}
              </ul>
            </Section>

            {/* ------------------------------ Excerpt ------------------------------ */}
            {d.excerpt ? (
              <Section title="Get a taste">
                <div className="rounded-[28px] bg-[#1d2838] px-6 py-8 text-[#fffdf8] sm:px-12 sm:py-12">
                  <div className="max-w-[60ch] space-y-4 type-body-lg">
                    {d.excerpt.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>
                  <p className="mt-8 type-caption text-[#fffdf8]/60">From chapter one of {b.title}</p>
                </div>
              </Section>
            ) : null}

            {/* ----------------------------- Book notes ---------------------------- */}
            <Section title="Notes for parents">
              {d.notes.length ? (
                <ul className="flex flex-wrap gap-2">
                  {d.notes.map((n) => (
                    <li key={n} className="flex items-center gap-2 rounded-full bg-[#f7ab95]/45 px-4 py-2 type-body-sm">
                      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                        <path d="M12 8v5M12 16.5v.5M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                      </svg>
                      {n}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="type-body-lg">Nothing to flag. Gentle for most readers in this age group.</p>
              )}
            </Section>

            {/* ---------------------------- Similar titles --------------------------- */}
            {similar.length ? (
              <Section title="Read more like this">
                <ul className="grid grid-cols-2 gap-x-4 gap-y-6 px-1 pt-1 lg:grid-cols-4">
                  {similar.map((s, i) => {
                    const card = cardColourFor(s.tone, i + 3);
                    const tilt = CARD_TILTS[(i + 1) % CARD_TILTS.length];
                    const pillColours = PILL_COLOURS.filter((c) => c.bg !== card.bg);
                    const chip = { backgroundColor: card.dark ? "#fffdf8" : "#1d2838", color: card.dark ? "#1d2838" : "#fffdf8" };
                    return (
                      <li key={s.id}>
                        {/* Whole card opens that book's details */}
                        <button
                          type="button"
                          onClick={() => onOpen(s.id)}
                          style={{ backgroundColor: card.bg, color: card.fg }}
                          className={`group/sim flex h-full w-full flex-col rounded-[26px] p-2.5 text-left shadow-[0_16px_26px_-20px_rgba(29,40,56,0.7)] transition-[rotate,translate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1.5 focus-visible:-translate-y-1.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1d2838] motion-reduce:transition-none ${tilt}`}
                        >
                          <span className="block overflow-hidden rounded-[18px]">
                            <BookCover book={s} />
                          </span>
                          <span className="mt-2.5 flex flex-wrap gap-1 px-1">
                            {s.tags.slice(0, 2).map((t, k) => {
                              const c = pillColours[k % pillColours.length];
                              return (
                                <span key={t} className="rounded-full px-2 py-0.5 type-caption-strong" style={{ backgroundColor: c.bg, color: c.fg }}>
                                  {TAG_SHORT[t] ?? t}
                                </span>
                              );
                            })}
                          </span>
                          <span className="mt-2 px-1 type-title-sm">{s.title}</span>
                          <span className="mt-1 line-clamp-2 px-1 type-body-sm opacity-85">{s.description}</span>
                          {/* "Read more" button matching the standard button system */}
                          <span className="mt-auto px-1 pb-1 pt-3">
                            <span
                              className="flex h-12 w-full items-center justify-center gap-2 rounded-[18px] text-[15px] font-medium tracking-[-0.01em] transition-[border-radius,background-color,scale] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/sim:rounded-[28px]"
                              style={chip}
                              aria-hidden
                            >
                              <span>Read more</span>
                              <ArrowIcon dir="right" className="size-4.5" />
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Section>
            ) : null}


          </div>
        </div>
      ) : null}
    </dialog>
  );
}

const GLANCE_TONES = ["#9fcbf2", "#a9dfc0", "#f6c453", "#c9b7f1"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14 border-t border-[#1d2838]/10 pt-8 sm:mt-20 sm:pt-10">
      <h2 className="mb-6 type-heading sm:mb-8">{title}</h2>
      {children}
    </section>
  );
}
