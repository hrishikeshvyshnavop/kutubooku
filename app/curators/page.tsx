import type { Metadata } from "next";
import Image from "next/image";
import { FooterMascot } from "../_components/FooterMascot";
import { GlobalFooter, REVEAL_ABOVE } from "../_components/GlobalFooter";
import { GlobalHeader } from "../_components/GlobalHeader";
import { SplitCta } from "../_components/HomeHeader";
import { PageTransition } from "../_components/PageTransition";
import { SECTION_TITLE, SectionTitle } from "../_components/SectionTitle";
import { SITE_NAME, abs, jsonLd } from "../_lib/site";

// Curators page (2026-11-05). Hero from Figma "Section / Experts / Meet Our Curators"
// (Kutubooku Website, node 1257:3815), restyled in the site's own language: Cal Sans + Figtree
// (Figma's Cal Sans / Lora / Kalam → our type scale + the Caveat eyebrow), navy ink, amber
// highlight, the shared SplitCta. Photo keeps Figma's crop and its two rounded corners.
// TODO(content): the three "How a book gets picked" principles are draft copy; confirm with Ria.

export const metadata: Metadata = {
  title: "Our curators — KutuBooku",
  description:
    "Every KutuBooku pick is curated by educators. Meet Ria Zita George, who leads our curation, and see how a book makes it onto the shelf.",
  alternates: { canonical: "/curators" },
};

const STRUCTURED = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Ria Zita George",
  jobTitle: "Curator",
  worksFor: { "@type": "Organization", name: SITE_NAME },
  alumniOf: { "@type": "CollegeOrUniversity", name: "Nanyang Technological University, Singapore" },
  image: abs("/curators/ria-zita-george.jpg"),
};

const PRINCIPLES = [
  {
    title: "Right for their stage",
    text: "Every book is matched to how children read and think at each age, not just the number on the cover.",
    tone: "bg-[#ffe75e]",
  },
  {
    title: "Grows the whole child",
    text: "We look for stories that build curiosity, kindness and confidence alongside reading skills.",
    tone: "bg-[#b6beff]",
  },
  {
    title: "Loved by children",
    text: "A good book has to be one a child picks up again. If it only pleases adults, it doesn't make the shelf.",
    tone: "bg-[#ffd0b2]",
  },
];

export default function CuratorsPage() {
  return (
    <PageTransition>
      <div className="flex min-h-dvh flex-1 flex-col bg-[#f4efe6] font-[family-name:var(--font-q-sans)] text-[#1d2838]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(STRUCTURED) }} />
        <GlobalHeader background="bg-[#f4efe6]" />
        <main className={`flex-1 bg-[#f4efe6] ${REVEAL_ABOVE}`}>
          {/* Hero: copy left, curator photo right (stacks on phones, photo first) */}
          <section aria-labelledby="curators-title" className="mx-auto grid w-full max-w-[1920px] items-center gap-10 px-page pb-16 pt-8 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)] lg:gap-16 lg:pb-24 xl:gap-24">
            <div className="order-2 max-w-[720px] lg:order-1">
              <p className="w-fit origin-bottom-left -rotate-3 font-[family-name:var(--font-caveat)] text-[28px] leading-none text-[#3b308f] sm:text-[36px]">
                meet our curators
              </p>
              <h1 id="curators-title" className={`mt-3 sm:mt-4 ${SECTION_TITLE}`}>
                Curated by educators. <span className="text-[#a86f00]">Guided by research.</span>
              </h1>
              <p className="mt-6 max-w-[620px] type-body-lg text-[#1d2838]/70">
                Every recommendation at KutuBooku is carefully curated by education experts who understand how children learn, grow, and
                develop at different stages of life. Our curation is led by Ria Zita George, an educator and published researcher with a
                Master&rsquo;s degree in Curriculum and Teaching from Nanyang Technological University, Singapore.
              </p>

              <figure className="mt-8 sm:mt-10">
                <blockquote className="max-w-[560px] font-[family-name:var(--font-caveat)] text-[30px] leading-[1.1] text-[#1d2838]/85 sm:text-[36px]">
                  &ldquo;Because the right book at the right time can change everything.&rdquo;
                </blockquote>
                <figcaption className="mt-1 flex items-center gap-3">
                  <Image src="/curators/ria-signature.png" alt="Ria Zita George's signature" width={1264} height={723} sizes="139px" className="h-auto w-[139px]" />
                  <span className="sr-only">Ria Zita George</span>
                </figcaption>
              </figure>

              <SplitCta href="/reading-preferences" label="Find books for my child" className="mt-10 w-fit" />
            </div>

            {/* Photo: tl/br rounded like Figma, dark fade at the bottom for the name */}
            <div className="relative order-1 mx-auto aspect-[454/592] w-full max-w-[520px] overflow-hidden rounded-br-[40px] rounded-tl-[40px] lg:order-2 lg:mx-0 lg:justify-self-end">
              <Image
                src="/curators/ria-zita-george.jpg"
                alt="Ria Zita George reading from a stack of books in a library"
                fill
                priority
                sizes="(min-width: 64rem) 520px, 100vw"
                className="object-cover object-top"
              />
              <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0)_57%)]" />
              <div className="absolute bottom-8 left-8 flex gap-3 border-l border-white/80 pl-3 text-white sm:bottom-12 sm:left-10">
                <div>
                  <p className="type-body-sm text-white/85">Our curator</p>
                  <p className="mt-1 type-title">Ria Zita George</p>
                </div>
              </div>
            </div>
          </section>

          {/* How a book gets picked */}
          <section aria-labelledby="principles-title" className="relative z-10 bg-[#fffdf8] px-page py-16 sm:py-24">
            <div className="mx-auto w-full max-w-[1920px]">
              <SectionTitle id="principles-title" eyebrow="what we look for">
                How a book gets picked
              </SectionTitle>
              <ul className="mt-10 grid gap-4 sm:mt-14 md:grid-cols-3 md:gap-5">
                {PRINCIPLES.map((p, i) => (
                  <li key={p.title} className={`flex flex-col rounded-[28px] p-6 sm:p-8 ${p.tone}`}>
                    <span className="type-stat text-[#1d2838]/70">0{i + 1}</span>
                    <h3 className="mt-10 type-title sm:mt-16">{p.title}</h3>
                    <p className="mt-3 type-body text-[#1d2838]/75">{p.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <FooterMascot className="relative z-10 bg-[#fffdf8]" />
        </main>
        <GlobalFooter />
      </div>
    </PageTransition>
  );
}
