import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import { BookHero } from "../_components/BookHero";
import { HomeBookList } from "../_components/HomeBookList";
import { FooterMascot } from "../_components/FooterMascot";
import { HomeFaq } from "../_components/HomeFaq";
import { HomeHowItWorks } from "../_components/HomeHowItWorks";
import { GlobalFooter, REVEAL_ABOVE } from "../_components/GlobalFooter";
import { GlobalHeader } from "../_components/GlobalHeader";
import { PageTransition } from "../_components/PageTransition";

// Home page. This is also exported from app/page.tsx as the root route.

// Handwritten labels ("How it works", the chat's "book finder"). Loaded per page, like the book page does.
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KutuBooku — Books picked for your child",
  description: "AI-picked books for your child, each with a reason, ready for your Amazon cart.",
};

export default function HomePage() {
  return (
    <PageTransition>
      <div className={`${caveat.variable} flex min-h-dvh flex-1 flex-col overflow-x-clip bg-[#FDDAA6] font-[family-name:var(--font-q-sans)] text-[#1d2838]`}>
        {/* Header hides while scrolling down, comes back on scroll up. */}
        <GlobalHeader />
        {/* REVEAL_ABOVE: rounded bottom corners; slides up off the sticky footer.
            Opaque bg: the footer waits underneath, so any see-through part of main would show it early. */}
        <main className={`flex-1 bg-[#FDDAA6] ${REVEAL_ABOVE}`}>
          {/* Hero sticks just under the header (80px, 88px from xl, where the pill nav shows); the sections after it
              scroll up over it. Later sections need `relative z-10` too. */}
          <div className="sticky top-20 z-0 xl:top-[88px]">
            <BookHero />
          </div>
          <HomeBookList />
          <HomeHowItWorks />
          <HomeFaq />
          {/* last in main: peeks over the footer. relative z-10 + cream: covers the sticky hero, matches the FAQ. */}
          <FooterMascot className="relative z-10 bg-[#fffdf8]" />
          {/* Next sections come here (see the home page plan). */}
        </main>
        <GlobalFooter />
      </div>
    </PageTransition>
  );
}
