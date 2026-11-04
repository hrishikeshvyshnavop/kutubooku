import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import { Suspense } from "react";
import { GlobalHeader } from "../_components/GlobalHeader";
import { PageTransition } from "../_components/PageTransition";
import { Catalogue } from "./Catalogue";

// Handwritten eyebrow ("our whole shelf") and the book sheet's section titles.
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "All books — KutuBooku",
  description: "Every book on the KutuBooku shelf: filter by age and interests, open any book, and add it to your box.",
};

export default function BooksPage() {
  return (
    <PageTransition>
      <div className={`${caveat.variable} flex min-h-dvh flex-1 flex-col bg-[#f4efe6] font-[family-name:var(--font-q-sans)] text-[#1d2838]`}>
        <GlobalHeader background="bg-[#f4efe6]" />
        <Suspense fallback={<div className="flex-1" />}>
          <Catalogue />
        </Suspense>
      </div>
    </PageTransition>
  );
}
