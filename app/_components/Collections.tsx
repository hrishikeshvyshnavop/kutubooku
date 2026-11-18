import { cacheLife } from "next/cache";
import { liveCollections, todayInIndia, untilLabel, type Collection, type CollectionBook } from "../_data/collections";
import { MOCK_BOOKS } from "../_data/curation-mock";
import { amazonCartUrl } from "../_lib/amazon";
import { CollectionBooks, type CollectionItem } from "./CollectionBooks";
import { CollectionsDeck } from "./CollectionsDeck";
import { SectionTitle } from "./SectionTitle";

async function collectionsToday(): Promise<Collection[]> {
  "use cache";
  cacheLife("hours");
  return liveCollections(todayInIndia());
}

function resolve(b: CollectionBook, i: number): CollectionItem | null {
  if (typeof b === "string") {
    const m = MOCK_BOOKS.find((x) => x.id === b);
    return m ? { kind: "shelf", key: m.id, book: m } : null;
  }
  return {
    kind: "seasonal",
    key: `s${i}-${b.title}`,
    title: b.title,
    author: b.author,
    cover: b.cover,
    ages: `Ages ${b.ageMin}–${b.ageMax}`,
    price: b.price,
    href: amazonCartUrl(b.asin ? [{ asin: b.asin }] : [], `${b.title} ${b.author}`),
  };
}

export async function Collections() {
  const live = await collectionsToday();
  if (!live.length) return null;

  return (
    <CollectionsDeck count={live.length}>
      {live.map((c) => (
        <CollectionSection key={c.slug} c={c} />
      ))}
    </CollectionsDeck>
  );
}

function CollectionSection({ c }: { c: Collection }) {
  const dark = c.theme.tone === "dark";
  const items = c.books.map(resolve).filter((x): x is CollectionItem => x !== null);
  const titleId = `c-${c.slug}-title`;
  const muted = dark ? "text-white/75" : "text-[#1d2838]/70";

  return (
    <section
      id={`c-${c.slug}`}
      aria-labelledby={titleId}
      className={`sticky top-0 origin-top rounded-t-[32px] pb-16 pt-14 shadow-[0_-24px_60px_-28px_rgba(29,40,56,0.45)] sm:rounded-t-[48px] sm:pb-24 sm:pt-20 lg:rounded-t-[64px] ${dark ? "text-white" : "text-[#1d2838]"}`}
      style={{ background: c.theme.bg }}
    >
      <span aria-hidden data-dim className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] bg-black opacity-0" />
      <div className="mx-auto w-full max-w-[1920px] px-page">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle id={titleId} eyebrow={c.eyebrow} tone={dark ? "dark" : "light"} className="max-w-[900px]">
            {c.title}
          </SectionTitle>
          <div className="flex max-w-md flex-col gap-3 lg:items-end lg:text-right">
            <p className={`type-body-lg ${muted}`}>{c.description}</p>
            <p className={`flex items-center gap-2 text-[14px] font-medium ${muted}`}>
              <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke={c.theme.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
                <path d="M3.5 10h17M8 3v4M16 3v4" />
              </svg>
              {untilLabel(c.endsAt)} · {items.length} books
            </p>
          </div>
        </div>

        <CollectionBooks label={`${c.title}: books`} items={items} accent={c.theme.accent} />
      </div>
    </section>
  );
}
