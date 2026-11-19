import type { Metadata } from "next";
import { getImageProps } from "next/image";
import { notFound } from "next/navigation";
import { abs, jsonLd } from "../../_lib/site";
import { Footer } from "../../_components/layout/Footer";
import { Header } from "../../_components/layout/Header";
import { PageTransition } from "../../_components/layout/PageTransition";
import { MOCK_BOOKS } from "../../_data/curation-mock";
import { BookPdp, bookTheme } from "./BookPdp";

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
    openGraph: { type: "book", url: `/books/${book.id}`, title, description: book.description, images: [{ url: coverFor(book.cover), width: 1200, alt: `Cover of ${book.title}` }] },
  };
}

const coverFor = (src: string) => getImageProps({ src, alt: "", width: 600, height: 600 }).props.src;

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
  "use cache";
  const book = findBook((await params).id);
  if (!book) notFound();

  const theme = bookTheme(book);

  return (
    <PageTransition>
      <div style={theme} className={`flex min-h-dvh flex-1 flex-col overflow-x-clip bg-white font-[family-name:var(--font-q-sans)] text-black`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(bookData(book)) }} />
        <Header background="bg-[var(--book-tint)]" />
        <BookPdp book={book} />
        <Footer className="pb-24 sm:pb-0" />
      </div>
    </PageTransition>
  );
}
