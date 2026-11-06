import type { Metadata } from "next";
import { getImageProps } from "next/image";
import { notFound } from "next/navigation";
import { abs, jsonLd } from "../../_lib/site";
import { GlobalFooter } from "../../_components/GlobalFooter";
import { GlobalHeader } from "../../_components/GlobalHeader";
import { PageTransition } from "../../_components/PageTransition";
import { MOCK_BOOKS } from "../../_data/curation-mock";
import { BookPdp, bookTheme } from "./BookPdp";

// Book product page (PDP), /books/[id]. Layout from Figma node 1431:6 (Hrishi's Workspace).

// Handwritten "At a glance" heading. Only this page uses it, so it is loaded here, not in the root layout.

type Props = { params: Promise<{ id: string }> };

const findBook = (id: string) => MOCK_BOOKS.find((b) => b.id === id);

export function generateStaticParams() {
  return MOCK_BOOKS.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const book = findBook((await params).id);
  if (!book) return { title: "Book not found — KutuBooku", robots: { index: false } };
  const title = `${book.title} by ${book.author} — KutuBooku`;
  return {
    title,
    description: book.description,
    alternates: { canonical: `/books/${book.id}` },
    // Share card: the cover, resized (some originals are 4000×5000 px).
    openGraph: { type: "book", url: `/books/${book.id}`, title, description: book.description, images: [{ url: coverFor(book.cover), width: 1200, alt: `Cover of ${book.title}` }] },
  };
}

// width 600 → the 2× file is 1200 px wide: the size share cards use, without the 4000 px original.
const coverFor = (src: string) => getImageProps({ src, alt: "", width: 600, height: 600 }).props.src;

/** What the book is, for search engines. No ratings or prices: ours are samples / approximate. */
function bookData(book: NonNullable<ReturnType<typeof findBook>>) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Book",
      name: book.title,
      ...(book.subtitle ? { alternateName: book.subtitle } : {}),
      url: abs(`/books/${book.id}`),
      image: abs(book.cover),
      description: book.description,
      author: { "@type": "Person", name: book.author },
      ...(book.illustrator ? { illustrator: { "@type": "Person", name: book.illustrator } } : {}),
      ...(book.pages ? { numberOfPages: book.pages } : {}),
      inLanguage: "en",
      typicalAgeRange: `${book.ageMin}-${book.ageMax}`,
      audience: { "@type": "PeopleAudience", suggestedMinAge: book.ageMin, suggestedMaxAge: book.ageMax },
      ...(book.themes?.length ? { keywords: book.themes.join(", ") } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: abs("/") },
        { "@type": "ListItem", position: 2, name: "All books", item: abs("/books") },
        { "@type": "ListItem", position: 3, name: book.title, item: abs(`/books/${book.id}`) },
      ],
    },
  ];
}

export default async function BookPage({ params }: Props) {
  // Static mock data, all ids known at build time: cache the whole page so every book is
  // fully prerendered (was partial for 13 of 15) and navigating to it is instant.
  "use cache";
  const book = findBook((await params).id);
  if (!book) notFound();

  // The page takes its colours from the book: the spine colour of its 3D book,
  // which was picked from the real cover. Text stays black, so the tints are kept light.
  const theme = bookTheme(book);

  return (
    <PageTransition>
      <div style={theme} className={`flex min-h-dvh flex-1 flex-col overflow-x-clip bg-white font-[family-name:var(--font-q-sans)] text-black`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(bookData(book)) }} />
        <GlobalHeader background="bg-[var(--book-tint)]" />
        <BookPdp book={book} />
        {/* pb on phones: room for the fixed Buy button */}
        <GlobalFooter className="pb-24 sm:pb-0" />
      </div>
    </PageTransition>
  );
}
