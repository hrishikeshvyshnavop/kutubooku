import type { Metadata } from "next";
import Link from "next/link";
import { Book3D, BOOKS } from "../_components/Book3D";
import { CtaButton } from "../_components/CtaButton";
import { Faq } from "../_components/Faq";
import { Footer } from "../_components/Footer";
import { FooterMascot } from "../_components/FooterMascot";
import { Header } from "../_components/Header";
import { PageTransition } from "../_components/PageTransition";
import { SECTION_TITLE, SectionTitle } from "../_components/SectionTitle";
import { REVEAL_ABOVE } from "../_data/footer";
import { GIFT_FAQ, GIFT_INCLUDED, GIFT_STEPS, OCCASIONS } from "../_data/gifting";
import { HERO_GLOW, HERO_PEACH } from "../_data/theme";

export const metadata: Metadata = {
  title: "Gift a book — KutuBooku",
  description: "Send a child books they'll love. Tell us a little about them, pick from our suggestions, and we'll wrap and deliver. You pay book prices only.",
  alternates: { canonical: "/gifting" },
};

const QUIZ = "/gifting/quiz";

const WRAPPED = [
  { book: BOOKS[4], ribbon: "#f26b4f", tilt: { rx: 8, ry: 20, rz: 5 }, className: "left-[4%] top-[18%] z-10", height: 250 },
  { book: BOOKS[0], ribbon: "#3b308f", tilt: { rx: 6, ry: -14, rz: -4 }, className: "left-[34%] top-[2%] z-20", height: 300 },
  { book: BOOKS[7], ribbon: "#f9a220", tilt: { rx: 10, ry: 16, rz: 3 }, className: "right-[2%] top-[30%] z-10", height: 230 },
];

export default function GiftingPage() {
  return (
    <PageTransition>
      <div className={`flex min-h-dvh flex-1 flex-col ${HERO_PEACH} font-[family-name:var(--font-q-sans)] text-[#1d2838]`}>
        <Header />
        <main className={`flex-1 ${HERO_PEACH} ${REVEAL_ABOVE}`}>
          <GiftHero />
          <HowGiftingWorks />
          <GiftOccasions />
          <WhatsIncluded />
          <Faq
            items={GIFT_FAQ}
            id="gift-faq"
            eyebrow="Good to know"
            title="Questions about gifting"
            intro="How gifting works, what it costs and when it arrives."
            cta={{ href: QUIZ, label: "Find a gift for a child" }}
          />
          <FooterMascot className="relative z-10 bg-[#fffdf8]" />
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
}

function GiftHero() {
  return (
    <section aria-labelledby="gifting-title" className="relative overflow-hidden">
      <div aria-hidden className={HERO_GLOW} />
      <div className="relative mx-auto grid w-full max-w-[1920px] items-center gap-6 px-page pb-16 pt-8 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12 lg:pb-24">
        <div className="max-w-[720px]">
          <p className="w-fit origin-bottom-left -rotate-3 font-[family-name:var(--font-caveat)] text-[28px] leading-none text-[#3b308f] sm:text-[36px]">
            gift a book
          </p>
          <h1 id="gifting-title" className={`mt-3 sm:mt-4 ${SECTION_TITLE}`}>
            Give a child a book <span className="text-[#a86f00]">they&apos;ll love.</span>
          </h1>
          <p className="mt-6 max-w-[560px] type-body-lg text-[#1d2838]/70">
            Tell us a little about them and we&apos;ll suggest books that suit them, each with a reason. We wrap every book, add your note
            and deliver it to their door.
          </p>
          <CtaButton href={QUIZ} label="Find a gift for a child" className="mt-10 w-fit" />
          <p className="mt-4 type-body-sm text-[#1d2838]/60">You pay book prices only. Wrapping and delivery are on us.</p>
          <Link
            href="/gifting/orders"
            className="link-underline mt-6 inline-block type-label focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]"
          >
            Already sent a gift? Track it in My gifts
          </Link>
        </div>

        <div aria-hidden className="relative mx-auto h-[360px] w-full max-w-[640px] [perspective:1600px] sm:h-[440px] lg:h-[520px]">
          {WRAPPED.map(({ book, ribbon, tilt, className, height }, i) => (
            <div key={book.src} className={`absolute scale-[0.72] sm:scale-90 lg:scale-100 ${className}`}>
              <Book3D b={book} i={i} height={height} tilt={tilt} ribbon={ribbon} eager={i === 1} sizes="300px" />
            </div>
          ))}
          <div className="absolute bottom-[6%] left-[38%] z-30 rotate-[-6deg] rounded-[14px] bg-[#fffdf8] px-5 py-3 shadow-[0_16px_32px_-16px_rgba(29,40,56,0.5)]">
            <span className="absolute -top-2 left-6 size-4 rounded-full border-4 border-[#f4efe6] bg-[#f9a220]" />
            <p className="font-[family-name:var(--font-caveat)] text-[26px] leading-none text-[#1d2838]">To: someone special</p>
            <p className="mt-1 font-[family-name:var(--font-caveat)] text-[20px] leading-none text-[#1d2838]/60">Happy reading!</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowGiftingWorks() {
  return (
    <section aria-labelledby="gift-steps-title" className="relative z-10 bg-[#fffdf8] px-page py-16 sm:py-24">
      <div className="mx-auto w-full max-w-[1920px]">
        <SectionTitle id="gift-steps-title" eyebrow="how it works">
          Gifting in three steps
        </SectionTitle>
        <ol className="mt-10 grid gap-4 sm:mt-14 md:grid-cols-3 md:gap-5">
          {GIFT_STEPS.map((s, i) => (
            <li key={s.title} className={`flex flex-col rounded-[28px] p-6 sm:p-8 ${s.tone}`}>
              <span className="type-stat text-[#1d2838]/70">0{i + 1}</span>
              <h3 className="mt-10 type-title sm:mt-16">{s.title}</h3>
              <p className="mt-3 type-body text-[#1d2838]/75">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function GiftOccasions() {
  return (
    <section aria-labelledby="gift-occasions-title" className="relative z-10 px-page py-16 sm:py-24">
      <div className="mx-auto w-full max-w-[1920px]">
        <SectionTitle id="gift-occasions-title" eyebrow="for every occasion">
          What&apos;s the occasion?
        </SectionTitle>
        <ul className="mt-10 grid gap-3 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {OCCASIONS.map((o) => (
            <li key={o.value}>
              <Link
                href={`${QUIZ}?occasion=${o.value}`}
                className={`group flex h-full min-h-[220px] flex-col rounded-[28px] p-6 transition-[scale,rotate] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-rotate-1 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838] motion-reduce:transition-none sm:p-8 ${o.tone}`}
              >
                <h3 className="type-title">{o.label}</h3>
                <p className="mt-3 type-body text-[#1d2838]/75">{o.line}</p>
                <span className="mt-auto flex items-center gap-2 pt-8 type-label">
                  Find a {o.label.toLowerCase()} gift
                  <svg viewBox="0 0 24 24" className="size-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const ICONS: Record<(typeof GIFT_INCLUDED)[number]["icon"], React.ReactNode> = {
  wrap: (
    <>
      <rect x="4" y="9" width="16" height="11" rx="2" />
      <path d="M12 9v11M4 13h16M12 9c-2-4-6-4-6-1s4 1 6 1c2 0 6 2 6-1s-4-3-6 1" />
    </>
  ),
  note: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 10h8M8 14h5" />
    </>
  ),
  truck: (
    <>
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
};

function WhatsIncluded() {
  return (
    <section aria-labelledby="gift-included-title" className="relative z-10 bg-[#f4efe6] px-page py-16 sm:py-24">
      <div className="mx-auto grid w-full max-w-[1920px] gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-end lg:gap-[6vw]">
        <div>
          <SectionTitle id="gift-included-title" eyebrow="what's included">
            Wrapped, written and delivered
          </SectionTitle>
          <p className="mt-4 max-w-[36ch] type-body-lg text-[#1d2838]/70">You choose the books. Everything else is on us.</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-3">
          {GIFT_INCLUDED.map((item) => (
            <li key={item.title} className="flex flex-col rounded-[28px] bg-[#fffdf8] p-6">
              <span className="grid size-12 place-items-center rounded-full bg-[#f9a220]">
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="#1d2838" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {ICONS[item.icon]}
                </svg>
              </span>
              <h3 className="mt-6 type-title-sm">{item.title}</h3>
              <p className="mt-2 type-body text-[#1d2838]/75">{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
