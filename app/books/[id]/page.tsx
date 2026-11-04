import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import { notFound } from "next/navigation";
import { GlobalFooter } from "../../_components/GlobalFooter";
import { GlobalHeader } from "../../_components/GlobalHeader";
import { PageTransition } from "../../_components/PageTransition";
import { MOCK_BOOKS } from "../../_data/curation-mock";
import { BookPdp, bookTheme } from "./BookPdp";

// Book product page (PDP), /books/[id]. Layout from Figma node 1431:6 (Hrishi's Workspace).

// Handwritten "At a glance" heading. Only this page uses it, so it is loaded here, not in the root layout.
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"] });

type Props = { params: Promise<{ id: string }> };

const findBook = (id: string) => MOCK_BOOKS.find((b) => b.id === id);

export function generateStaticParams() {
  return MOCK_BOOKS.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const book = findBook((await params).id);
  if (!book) return { title: "Book not found — KutuBooku" };
  return {
    title: `${book.title} by ${book.author} — KutuBooku`,
    description: book.description,
  };
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
      <div style={theme} className={`${caveat.variable} flex min-h-dvh flex-1 flex-col overflow-x-clip bg-white font-[family-name:var(--font-q-sans)] text-black`}>
        <GlobalHeader background="bg-[var(--book-tint)]" />
        <BookPdp book={book} />
        {/* pb on phones: room for the fixed Buy button */}
        <GlobalFooter className="pb-24 sm:pb-0" />
      </div>
    </PageTransition>
  );
}
