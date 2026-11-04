import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import { Suspense } from "react";
import { GlobalHeader } from "../_components/GlobalHeader";
import { PageTransition } from "../_components/PageTransition";
import { Catalogue } from "./Catalogue";
import { MOCK_BOOKS } from "../_data/curation-mock";
import { abs, jsonLd } from "../_lib/site";

// Handwritten eyebrow ("our whole shelf") and the book sheet's section titles.
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "All books — KutuBooku",
  description: "Every book on the KutuBooku shelf: filter by age and interests, open any book, and add it to your box.",
  // Filters (?age=…&into=…) and the book sheet (?book=…) are views of this one page.
  alternates: { canonical: "/books" },
};

// The whole shelf as a list, for search engines.
const STRUCTURED = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "All books on KutuBooku",
  itemListElement: MOCK_BOOKS.map((b, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/books/${b.id}`), name: b.title })),
};

export default function BooksPage() {
  return (
    <PageTransition>
      <div className={`${caveat.variable} flex min-h-dvh flex-1 flex-col bg-[#f4efe6] font-[family-name:var(--font-q-sans)] text-[#1d2838]`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(STRUCTURED) }} />
        <GlobalHeader background="bg-[#f4efe6]" />
        <Suspense fallback={<div className="flex-1" />}>
          <Catalogue />
        </Suspense>
      </div>
    </PageTransition>
  );
}
