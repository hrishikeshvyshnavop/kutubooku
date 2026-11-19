import type { Metadata } from "next";
import { Collections } from "../_components/home/Collections";
import { BookList } from "../_components/home/BookList";
import { Faq } from "../_components/ui/Faq";
import { HowItWorks } from "../_components/home/HowItWorks";
import { Intro } from "../_components/home/Intro";
import { Footer } from "../_components/layout/Footer";
import { FooterMascot } from "../_components/layout/FooterMascot";
import { REVEAL_ABOVE } from "../_data/footer";
import { HERO_PEACH } from "../_data/theme";
import { Header } from "../_components/layout/Header";
import { Hero } from "../_components/home/Hero";
import { PageTransition } from "../_components/layout/PageTransition";
import { Reviews } from "../_components/home/Reviews";
import { SITE_NAME, SITE_URL, abs, jsonLd } from "../_lib/site";

export const metadata: Metadata = {
  title: "KutuBooku — Books picked for your child",
  description: "AI-picked books for your child, each with a reason, ready for your Amazon cart.",
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "KutuBooku — Books picked for your child",
    description: "AI-picked books for your child, each with a reason, ready for your Amazon cart.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "KutuBooku: books picked for your child" }],
  },
};

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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(STRUCTURED) }} />
        <Intro />
        <Header />
        <main className={`flex-1 ${HERO_PEACH} ${REVEAL_ABOVE}`}>
          <Hero />
          <BookList />
          <Collections />
          <HowItWorks />
          <Reviews />
          <Faq />
          <FooterMascot className="relative z-10 bg-[#fffdf8]" />
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
}
