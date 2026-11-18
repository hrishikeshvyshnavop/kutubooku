import type { Metadata } from "next";
import { Collections } from "../_components/Collections";
import { BookList } from "../_components/BookList";
import { Faq } from "../_components/Faq";
import { HowItWorks } from "../_components/HowItWorks";
import { Intro } from "../_components/Intro";
import { Footer } from "../_components/Footer";
import { FooterMascot } from "../_components/FooterMascot";
import { REVEAL_ABOVE } from "../_data/footer";
import { HERO_PEACH } from "../_data/theme";
import { Header } from "../_components/Header";
import { Hero } from "../_components/Hero";
import { PageTransition } from "../_components/PageTransition";
import { Reviews } from "../_components/Reviews";
import { SITE_NAME, SITE_URL, abs, jsonLd } from "../_lib/site";

// Home page. This is also exported from app/page.tsx as the root route.

// Handwritten labels ("How it works", the chat's "book finder"). Loaded per page, like the book page does.

export const metadata: Metadata = {
  title: "KutuBooku — Books picked for your child",
  description: "AI-picked books for your child, each with a reason, ready for your Amazon cart.",
  // Served at / and /home: one canonical address so they don't compete in search.
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "KutuBooku — Books picked for your child",
    description: "AI-picked books for your child, each with a reason, ready for your Amazon cart.",
    // Explicit: /home is its own route, so it doesn't pick up app/opengraph-image on its own.
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "KutuBooku: books picked for your child" }],
  },
};

// Who we are and the site's search (the /books search box), for search engines.
const STRUCTURED = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: abs("/brand/kutubooku-logo.png"),
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/books?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  },
];

export default function HomePage() {
  return (
    <PageTransition>
      <div className={`flex min-h-dvh flex-1 flex-col overflow-x-clip ${HERO_PEACH} font-[family-name:var(--font-q-sans)] text-[#1d2838]`}>
        {/* Header hides while scrolling down, comes back on scroll up. */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(STRUCTURED) }} />
        {/* First visit: a short motion story of what KutuBooku does, handing over to the hero. */}
        <Intro />
        <Header />
        {/* REVEAL_ABOVE: rounded bottom corners; slides up off the sticky footer.
            Opaque bg: the footer waits underneath, so any see-through part of main would show it early. */}
        <main className={`flex-1 ${HERO_PEACH} ${REVEAL_ABOVE}`}>
          <Hero />
          <BookList />
          {/* Seasonal / monthly collections from the CMS (app/_data/collections.ts for now) */}
          <Collections />
          <HowItWorks />
          <Reviews />
          <Faq />
          {/* last in main: peeks over the footer. relative z-10 + cream: covers the sticky hero, matches the FAQ. */}
          <FooterMascot className="relative z-10 bg-[#fffdf8]" />
          {/* Next sections come here (see the home page plan). */}
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
}
