import Link from "next/link";
import { NavLink } from "../ui/NavLink";
import { NAV, PILL } from "../../_data/nav";
import { Button } from "../ui/Button";
import { SectionTitle } from "../ui/SectionTitle";
import { FooterShell } from "./FooterShell";
import { HERO_GLOW, HERO_PEACH } from "../../_data/theme";

const SOCIALS = [
  { label: "Instagram", icon: "/icons/instagram.svg", href: "#" },
  { label: "TikTok", icon: "/icons/tiktok.svg", href: "#" },
];

const YEAR = 2026;

const COL_TITLE = "font-[family-name:var(--font-caveat)] text-[26px] leading-none text-[#3b308f] sm:text-[30px]";

export function Footer({ className = "" }: { className?: string }) {
  return (
    <FooterShell aria-labelledby="footer-title" className={`-mt-16 ${HERO_PEACH} text-black ${className}`}>
      <div aria-hidden className={HERO_GLOW} />
      <div className="relative mx-auto w-full max-w-[1920px] px-page pt-28 sm:pt-32">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle id="footer-title" eyebrow="one last thing" className="max-w-[900px]">
            Every child has a book they&apos;ll love. Let&apos;s find it.
          </SectionTitle>
          <Button variant="split" href="/reading-preferences" className="w-fit shrink-0">Find books for my child</Button>
        </div>

        <div className="mt-10 grid gap-10 border-t-2 border-black/15 pt-10 sm:mt-14 sm:grid-cols-2 lg:flex lg:justify-between lg:gap-12">
          <nav aria-label="Footer">
            <p className={COL_TITLE}>explore</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {NAV.map((n) => (
                <li key={n.href}>
                  <NavLink href={n.href} prefetch={n.live ? undefined : false} className={PILL}>
                    {n.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className={COL_TITLE}>your account</p>
            <ul className="mt-5 flex flex-col gap-3 text-xl font-semibold tracking-[-0.02em]">
              <li>
                <Link href="/sign-in" className="relative after:absolute after:-inset-x-1 after:-inset-y-2.5 after:content-[''] link-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
                  Log in / Sign up
                </Link>
              </li>
              <li>
                <Link href="/reading-preferences" className="relative after:absolute after:-inset-x-1 after:-inset-y-2.5 after:content-[''] link-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
                  Update reading preferences
                </Link>
              </li>
              <li>
                <Link href="/gifting/orders" className="relative after:absolute after:-inset-x-1 after:-inset-y-2.5 after:content-[''] link-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
                  My gifts
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className={COL_TITLE}>follow along</p>
            <ul className="mt-5 flex gap-2">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    aria-label={`KutuBooku on ${s.label}`}
                    className="grid size-12 place-items-center rounded-full bg-black transition-[background-color,scale] duration-200 hover:bg-[#3f309b] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.icon} alt="" width={24} height={24} loading="lazy" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          aria-hidden
          className="mt-12 aspect-[3348/550] w-full select-none bg-[#F3BE78] [mask:url(/brand/kutubooku-logo.svg)_center/contain_no-repeat] sm:mt-14"
        />

        <div className="flex flex-col gap-2 py-6 text-sm font-medium text-black/60 sm:flex-row sm:items-center sm:justify-between sm:py-8 sm:text-base">
          <p>© {YEAR} KutuBooku. Books picked for your child.</p>
          <p>As an Amazon Associate, KutuBooku earns from qualifying purchases. You buy and get delivery through Amazon.in.</p>
        </div>
      </div>
    </FooterShell>
  );
}
