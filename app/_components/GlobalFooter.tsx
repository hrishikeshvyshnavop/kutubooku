// The one footer for every content page (home, book page, 404).
// Design language: the home hero's background (peach + soft white glow, hero-bg.ts), black text, a closing
// headline in the shared SectionTitle style, the header's amber pills and split CTA,
// peach social icons, and the wordmark full width along the bottom.
// Same max width and side padding as the header, so the edges line up.

import Image from "next/image";
import Link from "next/link";
import { NAV, PILL } from "../_data/nav";
import { SplitCta } from "./HomeHeader";
import { SectionTitle } from "./SectionTitle";
import { StickyFooterShell } from "./StickyFooterShell";
import { HERO_GLOW, HERO_PEACH } from "./hero-bg";

// TODO: real profile URLs. The icons are in /public/icons (peach), so they sit in black circles.
const SOCIALS = [
  { label: "Instagram", icon: "/icons/instagram.svg", href: "#" },
  { label: "TikTok", icon: "/icons/tiktok.svg", href: "#" },
];

// Written out, not new Date(): this Next version refuses unstable values like the current time while prerendering. Update each January.
const YEAR = 2026;

const COL_TITLE = "font-[family-name:var(--font-caveat)] text-[26px] leading-none text-[#3b308f] sm:text-[30px]";

/**
 * Classes for the page content just above the footer (each page's <main>): it sits over
 * the footer and gets rounded bottom corners, so it lifts off the footer as you
 * scroll to the end. overflow-clip (not hidden) keeps the home hero's position: sticky working.
 */
export const REVEAL_ABOVE = "relative z-10 overflow-clip rounded-b-[32px] sm:rounded-b-[48px] lg:rounded-b-[64px]";

export function GlobalFooter({ className = "" }: { className?: string }) {
  return (
    // -mt + extra pt: the footer tucks 64px under the content, so its rounded corners show the footer, not whatever is behind the page.
    <StickyFooterShell aria-labelledby="footer-title" className={`-mt-16 ${HERO_PEACH} text-black ${className}`}>
      {/* Same glow as the home hero (hero-bg.ts) */}
      <div aria-hidden className={HERO_GLOW} />
      {/* Kept compact (about 880px at 1440 wide) so the whole footer fits a laptop screen and can be pinned (see StickyFooterShell). */}
      <div className="relative mx-auto w-full max-w-[1920px] px-4 pt-28 sm:px-6 sm:pt-32">
        {/* Closing line + CTA */}
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle id="footer-title" eyebrow="one last thing" className="max-w-[900px]">
            Every child has a book they&apos;ll love. Let&apos;s find it.
          </SectionTitle>
          <SplitCta href="/reading-preferences" label="Find books for my child" className="w-fit shrink-0" />
        </div>

        {/* Links */}
        <div className="mt-10 grid gap-10 border-t-2 border-black/15 pt-10 sm:mt-14 sm:grid-cols-2 lg:flex lg:justify-between lg:gap-12">
          <nav aria-label="Footer">
            <p className={COL_TITLE}>explore</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} prefetch={n.live ? undefined : false} className={PILL}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className={COL_TITLE}>your account</p>
            <ul className="mt-5 flex flex-col gap-3 text-xl font-semibold tracking-[-0.02em]">
              <li>
                <Link href="/sign-in" className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
                  Log in / Sign up
                </Link>
              </li>
              <li>
                <Link href="/reading-preferences" className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
                  Update reading preferences
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
                    <img src={s.icon} alt="" width={24} height={24} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Wordmark, edge to edge of the content width, in its own mint + amber (as in the header, on the same peach). */}
        <Image
          src="/brand/kutubooku-logo.svg"
          alt=""
          aria-hidden
          width={1674}
          height={275}
          className="mt-12 h-auto w-full select-none sm:mt-14"
        />

        {/* Legal */}
        <div className="flex flex-col gap-2 py-6 text-sm font-medium text-black/60 sm:flex-row sm:items-center sm:justify-between sm:py-8 sm:text-base">
          <p>© {YEAR} KutuBooku. Books picked for your child.</p>
          {/* Amazon Associates disclosure (see CONTEXT.md Q32) */}
          <p>As an Amazon Associate, KutuBooku earns from qualifying purchases. You buy and get delivery through Amazon.in.</p>
        </div>
      </div>
    </StickyFooterShell>
  );
}
