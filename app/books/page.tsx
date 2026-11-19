import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "../_components/layout/Header";
import { PageTransition } from "../_components/layout/PageTransition";
import { Catalogue } from "./Catalogue";
import { MOCK_BOOKS } from "../_data/curation-mock";
import { abs, jsonLd } from "../_lib/site";

export const metadata: Metadata = {
  title: "All books — KutuBooku",
  description: "Every book on the KutuBooku shelf: filter by age and interests, open any book, and add it to your box.",
  alternates: { canonical: "/books" },
};

const STRUCTURED = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "All books on KutuBooku",
  itemListElement: MOCK_BOOKS.map((b, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/books/${b.id}`), name: b.title })),
};

export default function BooksPage() {
  return (
    <PageTransition>
      <div className={`flex min-h-dvh flex-1 flex-col bg-[#f4efe6] font-[family-name:var(--font-q-sans)] text-[#1d2838]`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(STRUCTURED) }} />
        <Header background="bg-[#f4efe6]" />
        <Suspense fallback={<div className="flex-1" />}>
          <Catalogue />
        </Suspense>
      </div>
    </PageTransition>
  );
}
