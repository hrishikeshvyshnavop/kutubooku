"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV, PILL } from "../../_data/nav";
import { HERO_PEACH } from "../../_data/theme";
import { lastSignOut, useSession } from "../../_lib/session";
import { AccountMenu } from "./AccountMenu";
import { BoxLink } from "./BoxLink";
import { HideOnScroll } from "./HideOnScroll";
import { MascotVideo } from "../media/MascotVideo";
import { NavLink } from "../ui/NavLink";
import { Button } from "../ui/Button";
import { Toast } from "../ui/Toast";

const SIGNED_OUT_MS = 3200;
const SIGNED_OUT_TOAST = { text: "You've signed out. Your box is saved for next time.", tone: "info" } as const;
const LOGIN_LABEL = "Log-in / Sign-up";
const MOBILE_MENU_ID = "header-mobile-menu";
const STAGGER_MS = 40;
const STAGGER_START_MS = 60;
const SPRING = "ease-[cubic-bezier(0.34,1.4,0.64,1)]";
const PANEL_MOTION = `origin-top-right transition-[opacity,scale,translate,visibility] motion-reduce:transition-none`;
const PANEL_OPEN = `visible scale-100 opacity-100 duration-[420ms] ${SPRING}`;
const PANEL_CLOSED = "invisible -translate-y-2 scale-[0.92] opacity-0 duration-200 ease-[cubic-bezier(0.5,0,0.75,0)]";
const ITEM_MOTION = "transition-[opacity,translate] motion-reduce:transition-none";
const ITEM_OPEN = `translate-y-0 opacity-100 duration-[420ms] ${SPRING}`;
const ITEM_CLOSED = "-translate-y-2.5 opacity-0 duration-150 ease-in";
const LABEL_ROLL = "text-center transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";
const LINE = "[transform-box:fill-box] [transform-origin:center] motion-reduce:transition-none";
const LINE_TO_CROSS = "[transition:translate_160ms_ease-in,rotate_280ms_160ms_cubic-bezier(0.34,1.56,0.64,1),scale_160ms,opacity_120ms]";
const LINE_TO_BARS = "[transition:rotate_180ms_ease-in,translate_240ms_180ms_cubic-bezier(0.34,1.56,0.64,1),scale_200ms_180ms,opacity_160ms_180ms]";

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
      className="flex min-w-0 items-center gap-1 text-[#111]"
    >
      <MascotVideo
        name="kutu-logo-mark"
        poster="/brand/mascot/kutu-logo-mark.webp"
        width={124}
        height={168}
        play="hover"
        active={active}
        className="h-[44px] w-auto shrink-0 sm:h-[56px]"
      />
      <Image
        src="/brand/kutubooku-logo-deep.svg"
        alt="kutubooku"
        width={1674}
        height={275}
        priority
        className="h-auto w-[96px] min-[360px]:w-[112px] min-[400px]:w-[132px] sm:w-[154px]"
      />
    </Link>
  );
}

function reveal(open: boolean, index: number) {
  return {
    className: `${ITEM_MOTION} ${open ? ITEM_OPEN : ITEM_CLOSED}`,
    style: { transitionDelay: open ? `${STAGGER_START_MS + index * STAGGER_MS}ms` : "0ms" },
  };
}

function NavLinks({
  listClassName,
  linkClassName,
  onNavigate,
  open,
}: {
  listClassName: string;
  linkClassName: string;
  onNavigate?: () => void;
  open?: boolean;
}) {
  return (
    <nav aria-label="Main">
      <ul className={listClassName}>
        {NAV.map(({ href, label, live }, i) => (
          <li key={href} {...(open === undefined ? {} : reveal(open, i))}>
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

  return <Button variant="split" href={href} className={hidden ? "invisible" : fresh ? "animate-q-in" : ""}>{LOGIN_LABEL}</Button>;
}

function MenuButton({ open, compact, onToggle }: { open: boolean; compact: boolean; onToggle: () => void }) {
  const label = open ? "Close" : "Menu";
  const line = `${LINE} ${open ? LINE_TO_CROSS : LINE_TO_BARS}`;
  const icon = (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden className="overflow-visible">
      <path d="M4 7h16" className={`${line} ${open ? "translate-y-[5px] rotate-45" : ""}`} />
      <path d="M4 12h16" className={`${line} ${open ? "scale-x-0 opacity-0" : ""}`} />
      <path d="M4 17h16" className={`${line} ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
    </svg>
  );
  const shared = { onClick: onToggle, "aria-expanded": open, "aria-controls": MOBILE_MENU_ID };

  return (
    <>
      <Button variant="icon" tone="amber" size="md" label={label} className={compact ? "sm:hidden" : "min-[360px]:hidden"} {...shared}>
        {icon}
      </Button>
      <Button variant="split" size="md" icon={icon} label={label} className={compact ? "max-sm:hidden" : "max-[359px]:hidden"} {...shared}>
        <span aria-hidden className="-my-1 grid overflow-hidden py-1 [&>*]:col-start-1 [&>*]:row-start-1">
          <span className={`${LABEL_ROLL} ${open ? "-translate-y-[140%] opacity-0" : ""}`}>Menu</span>
          <span className={`${LABEL_ROLL} ${open ? "" : "translate-y-[140%] opacity-0"}`}>Close</span>
        </span>
      </Button>
    </>
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

        <div className="flex items-center justify-between gap-2 sm:gap-4 xl:grid xl:grid-cols-[1fr_auto_1fr]">
          <Logo />

          <div className="hidden xl:block">
            <NavLinks listClassName="flex items-center gap-2" linkClassName="max-2xl:px-3.5 max-2xl:text-xl" />
          </div>

          <div className="hidden items-center justify-end gap-2 xl:flex">
            <BoxLink />
            {session ? <AccountMenu session={session} /> : <LoginCta href={signInHref} hidden={session === undefined} />}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 xl:hidden">
            <BoxLink />
            {session && <AccountMenu session={session} />}
            <MenuButton open={open} compact={Boolean(session)} onToggle={() => setOpen((o) => !o)} />
          </div>
        </div>

        <div
          id={MOBILE_MENU_ID}
          inert={!open}
          aria-hidden={!open}
          className={`absolute inset-x-4 top-[calc(100%-0.25rem)] rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5 xl:hidden ${PANEL_MOTION} ${open ? PANEL_OPEN : PANEL_CLOSED}`}
        >
          <NavLinks listClassName="flex flex-col gap-1.5" linkClassName="justify-center" onNavigate={closeMenu} open={open} />
          {!session && (
            <div {...reveal(open, NAV.length)}>
              <Button variant="split" href={signInHref} className="mt-2 w-full">{LOGIN_LABEL}</Button>
            </div>
          )}
        </div>
      </header>
    </HideOnScroll>
  );
}
