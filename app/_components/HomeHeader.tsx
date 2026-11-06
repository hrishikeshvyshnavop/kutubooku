"use client";

// Home page header — built from Figma node 1424:31907 (Hrishi's Workspace).
// The design frame is 2560px wide; values are scaled ×0.75 to the app's
// 1920px layout (75px pills → 56px, 32px text → 24px, 64px socials → 48px).
// Font: the site's Cal Sans / Figtree pair in place of the design's Degular.

import Link from "next/link";
import { NavLink } from "./NavLink";
import { MascotVideo } from "./MascotVideo";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV, PILL } from "../_data/nav";
import { BoxLink } from "./BoxLink";
import { AccountMenu } from "./AccountMenu";
import { Toast } from "./Toast";
import { lastSignOut, useSession } from "../_lib/session";


function Logo() {
  // Book worm + wordmark, as in Figma "Navigation / Header / Default" (node 1257:3881). The worm is
  // Figma's blinking clip (transparent, MascotVideo): still until you hover or keyboard-focus the
  // logo, then it plays, finishing its loop when you leave.
  const [active, setActive] = useState(false);
  return (
    <Link
      href="/"
      aria-label="KutuBooku home"
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      className="flex items-center gap-1 text-[#111]"
    >
      <MascotVideo name="kutu-logo-mark" poster="/brand/mascot/kutu-logo-mark.webp" width={124} height={168} play="hover" active={active} className="h-[52px] w-auto sm:h-[56px]" />
      <Image src="/brand/kutubooku-logo-deep.svg" alt="kutubooku" width={1674} height={275} priority className="h-auto w-[132px] sm:w-[154px]" />
    </Link>
  );
}

const SPLIT_TONES = {
  // Header CTA (design: #f9a220, black text)
  amber: { block: "bg-[#f9a220] text-black group-hover:bg-[#e8900c]", arrow: "/icons/arrow-right.svg" },
  // Book page buy button (design node 1431:428: #9a83de, white text — 3.1:1, large bold text)
  violet: { block: "bg-[#9a83de] text-white group-hover:bg-[#8670cc]", arrow: "/icons/arrow-right-white.svg" },
} as const;

/** Split CTA: label block + separate arrow square (8px radius). */
export function SplitCta({
  href,
  label,
  className = "",
  tone = "amber",
  newTab = false,
}: {
  href: string;
  label: React.ReactNode;
  className?: string;
  tone?: keyof typeof SPLIT_TONES;
  /** External link in a new tab (Amazon): adds target and rel="sponsored". */
  newTab?: boolean;
}) {
  const t = SPLIT_TONES[tone];
  return (
    <Link
      href={href}
      {...(newTab ? { target: "_blank", rel: "sponsored noopener" } : {})}
      className={`group flex h-14 items-stretch gap-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${className}`}
    >
      <span className={`flex flex-1 items-center justify-center whitespace-nowrap rounded-lg px-5 text-xl font-bold leading-none tracking-[-0.48px] transition-colors ${t.block}`}>
        {label}
      </span>
      <span className={`grid w-14 shrink-0 place-items-center rounded-lg transition-colors ${t.block}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={t.arrow} alt="" width={18.6562} height={16} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

/** "You've signed out" for a few seconds after signing out. Timed from the sign-out itself, so it
 *  carries on smoothly if signing out also changed the page (account-only pages go home). */
const SIGNED_OUT_MS = 3200;
// Some pages render the header twice; the first one owns the toast.
let toastOwner: symbol | null = null;
function SignedOutToast({ session }: { session: unknown }) {
  const [show, setShow] = useState(false);
  const [me] = useState(() => Symbol("toast"));
  useEffect(() => {
    if (!toastOwner) toastOwner = me;
    return () => {
      if (toastOwner === me) toastOwner = null;
    };
  }, [me]);
  useEffect(() => {
    if (session !== null || toastOwner !== me) return;
    const left = SIGNED_OUT_MS - (Date.now() - lastSignOut());
    if (!lastSignOut() || left <= 0) return;
    setShow(true); // eslint-disable-line react-hooks/set-state-in-effect
    const t = setTimeout(() => setShow(false), left);
    return () => clearTimeout(t);
  }, [session, me]);
  return <Toast toast={show ? { text: "You've signed out. Your box is saved for next time.", tone: "info" } : null} />;
}

/** "Log-in / Sign-up". Right after signing out it fades in where the profile button was. */
function LoginCta({ href, hidden }: { href: string; hidden: boolean }) {
  // Decided once, when it mounts (it mounts as the profile button goes away).
  // Browser only: the server prerender must not read the clock (and nobody signs out there).
  const [fresh] = useState(() => typeof window !== "undefined" && lastSignOut() > 0 && Date.now() - lastSignOut() < SIGNED_OUT_MS);
  return <SplitCta href={href} label="Log-in / Sign-up" className={hidden ? "invisible" : fresh ? "animate-q-in" : ""} />;
}

export function HomeHeader() {
  const [open, setOpen] = useState(false);
  const session = useSession(); // undefined until hydrated: the slot is kept but hidden, so nothing jumps
  const pathname = usePathname();
  // Come back to this page after signing in.
  const signInHref = pathname && pathname !== "/" && !pathname.startsWith("/sign-in") ? `/sign-in?next=${encodeURIComponent(pathname)}` : "/sign-in";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="relative z-40 mx-auto w-full max-w-[1920px] bg-transparent px-page py-4">
      <SignedOutToast session={session} />
      <div className="flex items-center justify-between gap-4 xl:grid xl:grid-cols-[1fr_auto_1fr]">
        <Logo />

        {/* Desktop (xl+: five pills need the room): centred pill nav + split CTA */}
        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center gap-2">
            {NAV.map((n) => (
              <li key={n.href}>
                <NavLink href={n.href} prefetch={n.live ? undefined : false} className={`${PILL} font-heading max-2xl:px-3.5 max-2xl:text-xl`}>
                  {n.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center justify-end gap-2 xl:flex">
          <BoxLink />
          {session ? (
            <AccountMenu session={session} />
          ) : (
            <LoginCta href={signInHref} hidden={session === undefined} />
          )}
        </div>

        {/* Mobile: box icon, profile (signed in) + split Menu button */}
        <div className="flex items-center gap-2 xl:hidden">
          <BoxLink />
          {session ? <AccountMenu session={session} /> : null}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="home-mobile-menu"
            className="group flex h-12 items-stretch gap-0.5 xl:hidden"
          >
            <span className="flex items-center rounded-lg bg-[#f9a220] px-4 text-lg font-bold leading-none tracking-[-0.4px] text-black">
              {open ? "Close" : "Menu"}
            </span>
            <span className="grid w-12 place-items-center rounded-lg bg-[#f9a220] text-black">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      <div
        id="home-mobile-menu"
        hidden={!open}
        className="absolute inset-x-4 top-[calc(100%-0.25rem)] rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5 xl:hidden"
      >
        <nav aria-label="Main">
          <ul className="flex flex-col gap-1.5">
            {NAV.map((n) => (
              <li key={n.href}>
                <NavLink href={n.href} prefetch={n.live ? undefined : false} onClick={() => setOpen(false)} className={`${PILL} font-heading justify-center`}>
                  {n.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        {/* Signed in: account and children live in the profile button next to the box. */}
        {session ? null : <SplitCta href={signInHref} label="Log-in / Sign-up" className="mt-2 w-full" />}
      </div>
    </header>
  );
}
