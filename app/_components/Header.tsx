"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV, PILL } from "../_data/nav";
import { HERO_PEACH } from "../_data/theme";
import { lastSignOut, useSession } from "../_lib/session";
import { AccountMenu } from "./AccountMenu";
import { BoxLink } from "./BoxLink";
import { HideOnScroll } from "./HideOnScroll";
import { MascotVideo } from "./MascotVideo";
import { NavLink } from "./NavLink";
import { CtaButton } from "./CtaButton";
import { Toast } from "./Toast";

const SIGNED_OUT_MS = 3200;
const SIGNED_OUT_TOAST = { text: "You've signed out. Your box is saved for next time.", tone: "info" } as const;
const LOGIN_LABEL = "Log-in / Sign-up";
const MOBILE_MENU_ID = "header-mobile-menu";
const MENU_CHIP = "rounded-lg bg-[#f9a220] text-black";

let toastOwner: symbol | null = null;

function msSinceSignOut() {
  const at = lastSignOut();
  return at ? Date.now() - at : Infinity;
}

function signInHrefFor(pathname: string | null) {
  if (!pathname || pathname === "/" || pathname.startsWith("/sign-in")) return "/sign-in";
  return `/sign-in?next=${encodeURIComponent(pathname)}`;
}

function useEscape(enabled: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onEscape();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, onEscape]);
}

function Logo() {
  const [active, setActive] = useState(false);
  const on = () => setActive(true);
  const off = () => setActive(false);

  return (
    <Link
      href="/"
      aria-label="KutuBooku home"
      onPointerEnter={on}
      onPointerLeave={off}
      onFocus={on}
      onBlur={off}
      className="flex items-center gap-1 text-[#111]"
    >
      <MascotVideo
        name="kutu-logo-mark"
        poster="/brand/mascot/kutu-logo-mark.webp"
        width={124}
        height={168}
        play="hover"
        active={active}
        className="h-[52px] w-auto sm:h-[56px]"
      />
      <Image
        src="/brand/kutubooku-logo-deep.svg"
        alt="kutubooku"
        width={1674}
        height={275}
        priority
        className="h-auto w-[132px] sm:w-[154px]"
      />
    </Link>
  );
}

function NavLinks({ listClassName, linkClassName, onNavigate }: { listClassName: string; linkClassName: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main">
      <ul className={listClassName}>
        {NAV.map(({ href, label, live }) => (
          <li key={href}>
            <NavLink href={href} prefetch={live ? undefined : false} onClick={onNavigate} className={`${PILL} font-heading ${linkClassName}`}>
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SignedOutToast({ session }: { session: unknown }) {
  const [show, setShow] = useState(false);
  const [me] = useState(() => Symbol("toast"));

  useEffect(() => {
    toastOwner ??= me;
    return () => {
      if (toastOwner === me) toastOwner = null;
    };
  }, [me]);

  useEffect(() => {
    if (session !== null || toastOwner !== me) return;
    const left = SIGNED_OUT_MS - msSinceSignOut();
    if (left <= 0) return;
    const showTimer = setTimeout(() => setShow(true));
    const hideTimer = setTimeout(() => setShow(false), left);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [session, me]);

  return <Toast toast={show ? SIGNED_OUT_TOAST : null} />;
}

function LoginCta({ href, hidden }: { href: string; hidden: boolean }) {
  const [fresh] = useState(() => typeof window !== "undefined" && msSinceSignOut() < SIGNED_OUT_MS);

  return <CtaButton href={href} label={LOGIN_LABEL} className={hidden ? "invisible" : fresh ? "animate-q-in" : ""} />;
}

function MenuButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={MOBILE_MENU_ID}
      className="group flex h-12 items-stretch gap-0.5"
    >
      <span className={`flex items-center px-4 text-lg font-bold leading-none tracking-[-0.4px] ${MENU_CHIP}`}>
        {open ? "Close" : "Menu"}
      </span>
      <span className={`grid w-12 place-items-center ${MENU_CHIP}`}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <path d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
        </svg>
      </span>
    </button>
  );
}

export function Header({ background = HERO_PEACH }: { background?: string }) {
  const [open, setOpen] = useState(false);
  const session = useSession();
  const signInHref = signInHrefFor(usePathname());
  const closeMenu = () => setOpen(false);

  useEscape(open, closeMenu);

  return (
    <HideOnScroll className={`z-40 ${background}`}>
      <header className="relative z-40 mx-auto w-full max-w-[1920px] px-page py-4">
        <SignedOutToast session={session} />

        <div className="flex items-center justify-between gap-4 xl:grid xl:grid-cols-[1fr_auto_1fr]">
          <Logo />

          <div className="hidden xl:block">
            <NavLinks listClassName="flex items-center gap-2" linkClassName="max-2xl:px-3.5 max-2xl:text-xl" />
          </div>

          <div className="hidden items-center justify-end gap-2 xl:flex">
            <BoxLink />
            {session ? <AccountMenu session={session} /> : <LoginCta href={signInHref} hidden={session === undefined} />}
          </div>

          <div className="flex items-center gap-2 xl:hidden">
            <BoxLink />
            {session && <AccountMenu session={session} />}
            <MenuButton open={open} onToggle={() => setOpen((o) => !o)} />
          </div>
        </div>

        <div
          id={MOBILE_MENU_ID}
          hidden={!open}
          className="absolute inset-x-4 top-[calc(100%-0.25rem)] rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5 xl:hidden"
        >
          <NavLinks listClassName="flex flex-col gap-1.5" linkClassName="justify-center" onNavigate={closeMenu} />
          {!session && <CtaButton href={signInHref} label={LOGIN_LABEL} className="mt-2 w-full" />}
        </div>
      </header>
    </HideOnScroll>
  );
}
