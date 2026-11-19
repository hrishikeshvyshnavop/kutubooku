import reviewsJson from "../../../public/covers/reviews.json";
import { THEME_LABEL, TOPIC_LABEL, detailsFor, similarTo } from "../../_data/book-details";
import type { MockBook } from "../../_data/curation-mock";
import { AiSummary, type AiBlock } from "./AiSummary";
import { BookCover3D } from "./BookCover3D";
import { book3DFor } from "../../_components/book/Book3D";
import { ReviewWall } from "../../_components/book/ReviewWall";
import { BuyTray } from "./BuyTray";
import { SimilarBooks } from "./SimilarBooks";
import { SectionTitle } from "../../_components/ui/SectionTitle";
import { FooterMascot } from "../../_components/layout/FooterMascot";
import { REVEAL_ABOVE } from "../../_data/footer";

const TOPIC_EMOJI: Record<string, string> = {
  animals: "🐾",
  space: "🪐",
  dinosaurs: "🦕",
  mystery: "🔍",
  myths: "🐉",
  funny: "😂",
  feelings: "💛",
  nature: "🌱",
  adventure: "🧭",
  sports: "⚽",
  history: "🏛️",
  making: "✂️",
};

const CHIP_TONES = ["bg-black text-white", "bg-[#3f309b] text-white", "bg-[#ffd0b2] text-black"];

const GLANCE_TONES = ["bg-[#897400] text-black", "bg-[#b6beff] text-black", "bg-[#3d3195] text-white", "bg-[#ffe75e] text-black"];

const CUE_TONES = ["bg-[#3f309b] text-white", "bg-[#ffd0b2] text-black", "bg-[#ffe75e] text-black"];

const PLOT_TONES = ["bg-[#3f309b] text-white", "bg-[#ffd0b2] text-black", "bg-[#ffe75e] text-black"];
const PORTRAIT_RINGS = ["bg-[#ffe75e]", "bg-[#b6beff]", "bg-[#ffd0b2]"];

const LAZY_LAYOUT = "[content-visibility:auto] [contain-intrinsic-size:auto_900px]";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function bookTheme(book: MockBook) {
  const color = book3DFor(book.cover, book.title, book.tone).spine;
  return {
    "--book": color,
    "--book-tint": `color-mix(in oklab, ${color} 28%, white)`,
    "--book-soft": `color-mix(in oklab, ${color} 50%, white)`,
  } as React.CSSProperties;
}

export function BookPdp({ book, sheet }: { book: MockBook; sheet?: {
    onOpenBook?: (id: string) => void;
    child?: string | null;
    lite?: boolean;
  };
}) {
  const Root = sheet ? "div" : "main";
  const d = detailsFor(book);
  const topics = book.tags.slice(0, 3);
  const ages = book.ageMin === book.ageMax ? `Age ${book.ageMin}` : `Ages ${book.ageMin}–${book.ageMax}`;
  const how = d.glance.find((g) => g.label === "How")?.value;
  const themes = d.themes.slice(0, 2).map((t) => THEME_LABEL[t] ?? cap(t));

  const glance = [
    { emoji: "🎂", label: ages },
    how && { emoji: "🗣️", label: how },
    { emoji: "📖", label: book.pages ? `${book.pages}-page ${book.format.toLowerCase()}` : book.format },
    themes.length > 0 && { emoji: "✨", label: themes.join(" & ") },
  ].filter(Boolean) as { emoji: string; label: string }[];
  const glanceRows = [glance.slice(0, 1), glance.slice(1, 3), glance.slice(3)].filter((r) => r.length > 0);

  const reviews = [
    ...reviewsJson.filter((r) => r.bookId === book.id).map((r) => ({ quote: r.quote, who: r.attribution })),
    ...d.reviews,
  ].slice(0, 4);

  const plot = book.storyPlot
    ? [
        { label: "The setup", text: book.storyPlot.setup },
        { label: "The turning point", text: book.storyPlot.turningPoint },
        { label: "The ending", text: book.storyPlot.resolution },
      ]
    : [];
  const aiBlocks: AiBlock[] = d.activities.map((a) => ({ kind: "activity" as const, title: a.title, text: a.description }));
  const similar = similarTo(book, 4);

  return (
    <Root className={sheet ? "relative bg-white" : `flex-1 bg-white ${REVEAL_ABOVE}`}>
      <section aria-labelledby="book-title" className="relative overflow-hidden bg-[var(--book-tint)]">
        <HeroWaves />
        <div className="relative flex flex-col items-center gap-6 px-page pb-[clamp(140px,13.4vw,257px)] pt-[clamp(40px,9vw,174px)] text-center sm:gap-10">
          <div className="flex flex-col items-center gap-6 sm:gap-10">
            <p className="text-xl font-semibold leading-[1.2] tracking-[-0.02em] sm:text-[32px]">{book.author}</p>
            <h1
              id="book-title"
              className="max-w-[1546px] text-balance text-[clamp(52px,8.33vw,160px)] font-bold leading-[0.85] tracking-[-0.01em]"
            >
              {book.title}
            </h1>
            {book.subtitle && <p className="max-w-[40ch] text-lg font-medium leading-snug sm:text-2xl">{book.subtitle}</p>}
          </div>
          {topics.length > 0 && (
            <ul aria-label="Topics" className="flex flex-wrap items-center justify-center gap-1.5">
              {topics.map((t, i) => (
                <li
                  key={t}
                  className={`flex h-10 items-center gap-2 rounded-full px-3 text-lg font-semibold leading-none tracking-[-0.02em] sm:h-12 sm:text-2xl ${CHIP_TONES[i % CHIP_TONES.length]}`}
                >
                  <span aria-hidden>{TOPIC_EMOJI[t] ?? "📚"}</span>
                  {TOPIC_LABEL[t] ?? cap(t)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="relative z-10 -mt-[clamp(120px,10.5vw,215px)] px-page">
        <BookCover3D book={book} />
      </div>

      {!sheet?.lite && (
      <>
      <div className="mx-auto w-full max-w-[1312px] px-page">
        <section aria-labelledby="glance-title" className="relative flex flex-col items-center gap-2 pb-10 pt-16 sm:pb-[59px] sm:pt-[110px]">
          <h2
            id="glance-title"
            className="absolute left-[2%] top-6 -rotate-10 font-[family-name:var(--font-caveat)] text-[28px] leading-none text-[#3b308f] sm:left-[6.5%] sm:top-[60px] sm:text-[40px]"
          >
            At a glance
          </h2>
          {glanceRows.map((row, r) => (
            <ul key={r} className="flex flex-wrap justify-center gap-2">
              {row.map((g) => {
                const i = glance.indexOf(g);
                return (
                  <li
                    key={g.label}
                    className={`flex min-h-12 items-center gap-2 rounded-[33px] px-4 py-2 text-[clamp(22px,2.24vw,43px)] font-bold leading-[0.8] tracking-[-0.01em] sm:min-h-14 ${GLANCE_TONES[i % GLANCE_TONES.length]}`}
                  >
                    <span aria-hidden>{g.emoji}</span>
                    {g.label}
                  </li>
                );
              })}
            </ul>
          ))}
        </section>

        <div className="mx-auto flex max-w-[1248px] flex-col gap-12 sm:gap-16">
          <p className="text-[clamp(30px,3.33vw,64px)] font-semibold leading-[0.9] tracking-[-0.03em] text-pretty">{book.description}</p>

          <p className="max-w-[60ch] text-xl font-medium leading-[1.2] tracking-[-0.01em] sm:text-2xl">{d.about}</p>

          {plot.length > 0 && (
            <section aria-labelledby="plot-title" className="mt-12 sm:mt-24">
              <SectionTitle id="plot-title" eyebrow="what happens">
                Story plot
              </SectionTitle>
              <ol className="relative mt-10 grid gap-10 sm:mt-14 md:grid-cols-3 md:gap-8">
                <span aria-hidden className="absolute left-7 right-7 top-7 hidden h-[3px] rounded-full bg-[var(--book-soft)] md:block" />
                {plot.map((p, i) => (
                  <li key={p.label} className="relative flex flex-col gap-4">
                    <span
                      aria-hidden
                      className={`grid size-14 place-items-center rounded-full text-xl font-bold ${PLOT_TONES[i % PLOT_TONES.length]}`}
                    >
                      {i + 1}
                    </span>
                    <h3 className="text-[clamp(26px,2vw,36px)] font-bold leading-[0.9] tracking-[-0.02em]">{p.label}</h3>
                    <p className="text-lg font-medium leading-[1.25] tracking-[-0.01em] sm:text-xl">{p.text}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {d.portraits.length > 0 && (
            <section aria-labelledby="cast-title" className={`mt-12 sm:mt-24 ${LAZY_LAYOUT}`}>
              <SectionTitle id="cast-title" eyebrow="who's who">
                Meet the
                <br />
                characters
              </SectionTitle>
              <ul className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                {d.portraits.map((c, i) => (
                  <li key={c.name} className="flex flex-col items-start gap-5 rounded-[32px] bg-[var(--book-tint)] p-7 sm:p-9">
                    <span
                      aria-hidden
                      className={`grid size-20 place-items-center rounded-full text-[40px] leading-none sm:size-24 sm:text-5xl ${PORTRAIT_RINGS[i % PORTRAIT_RINGS.length]}`}
                    >
                      {c.avatar ?? c.name.charAt(0)}
                    </span>
                    <div className="flex flex-col gap-2">
                      <h3 className="text-[clamp(26px,2vw,36px)] font-bold leading-[0.9] tracking-[-0.02em]">{c.name}</h3>
                      <p className="font-[family-name:var(--font-caveat)] text-[26px] leading-none text-[#3b308f]">{c.role}</p>
                    </div>
                    <ul aria-label={`${c.name}'s traits`} className="flex flex-wrap gap-1.5">
                      {c.traits.split(",").map((t) => (
                        <li key={t} className="rounded-full bg-white px-3 py-1.5 text-base font-semibold leading-none tracking-[-0.01em]">
                          {cap(t.trim())}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {reviews.length > 0 && (
            <div className={`mx-[calc(50%-50vw)] w-screen ${LAZY_LAYOUT}`}>
              <ReviewWall reviews={reviews} />
            </div>
          )}
        </div>

        {d.cues.length > 0 && (
          <section aria-labelledby="cues-title" className={`mx-auto mt-24 max-w-[1248px] sm:mt-40 ${LAZY_LAYOUT}`}>
            <SectionTitle id="cues-title" eyebrow="ask after the last page">
              Conversation
              <br />
              cues
            </SectionTitle>
            <ol className="mt-10 grid gap-4 sm:mt-14 md:grid-cols-3 md:gap-5">
              {d.cues.map((cue, i) => (
                <li
                  key={cue}
                  className={`flex flex-col gap-6 rounded-[32px] p-7 sm:p-9 ${CUE_TONES[i % CUE_TONES.length]}`}
                >
                  <span aria-hidden className="text-[clamp(40px,3.4vw,64px)] font-bold leading-[0.8] tracking-[-0.02em] opacity-60">
                    Q{i + 1}
                  </span>
                  <p className="text-xl font-semibold leading-[1.15] tracking-[-0.01em] text-pretty sm:text-2xl">“{cue}”</p>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      {d.activities.length > 0 && (
        <section aria-labelledby="together-title" className={`relative mt-24 overflow-clip bg-[var(--book-tint)] sm:mt-40 ${LAZY_LAYOUT}`}>
          <TastePattern />
          <div className="relative flex flex-col items-center px-page pb-16 sm:pb-[120px]">
            <SectionTitle id="together-title" eyebrow="after story time" align="center" className="pb-10 pt-20 sm:pb-16 sm:pt-[120px]">
              Read it together
            </SectionTitle>
            <div className="w-full max-w-[936px] rounded-[32px] bg-white px-6 py-10 text-xl font-medium leading-[1.2] tracking-[-0.01em] sm:p-[clamp(48px,7.7vw,148px)] sm:text-2xl">
              <AiSummary blocks={aiBlocks} bookTitle={book.title} />
            </div>
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <section aria-labelledby="similar-title" className={`mx-auto w-full max-w-[1312px] px-page pb-10 pt-20 sm:pb-24 sm:pt-[120px] ${LAZY_LAYOUT}`}>
          <SectionTitle id="similar-title" eyebrow="up next">
            Read more
            <br />
            like this
          </SectionTitle>
          <SimilarBooks books={similar} title={book.title} onOpenBook={sheet?.onOpenBook} />
        </section>
      )}

      </>
      )}

      {!sheet && <FooterMascot className="pt-10 sm:pt-16" />}

      <BuyTray book={book} placement={sheet ? "sticky" : "fixed"} child={sheet?.child} />
    </Root>
  );
}

function HeroWaves() {
  return (
    <svg aria-hidden viewBox="0 0 1920 600" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-[72%] w-full">
      <path
        d="M0 260 C 220 140 420 120 640 210 S 1040 360 1280 250 S 1720 90 1920 190 V600 H0 Z"
        className="fill-[var(--book-soft)]"
        opacity="0.6"
      />
      <path
        d="M0 420 C 260 330 460 340 700 410 S 1160 500 1420 400 S 1780 300 1920 350 V600 H0 Z"
        className="fill-[var(--book)]"
        opacity="0.18"
      />
    </svg>
  );
}

function TastePattern() {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-50">
      <defs>
        <pattern id="pdp-waves" width="320" height="120" patternUnits="userSpaceOnUse">
          <path d="M0 60 C 40 20 120 20 160 60 S 280 100 320 60" fill="none" className="stroke-[var(--book-soft)]" strokeWidth="14" strokeLinecap="round" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pdp-waves)" />
    </svg>
  );
}
