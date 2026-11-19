"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "../_components/ui/Button";

const links = [
  { href: "/editions", label: "Editions" },
  { href: "/gifting", label: "Gifting" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
];

const pill =
  "flex h-[42px] items-center whitespace-nowrap rounded-full bg-white/65 px-3 text-[17px] font-semibold tracking-[-0.01em] text-ink backdrop-blur transition-colors hover:bg-white";

const chip = "bg-marigold text-ink transition-colors group-hover:bg-marigold-deep";

function Arrow({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function Logo() {
  return (
    <Link href="/" aria-label="KutuBooku home" className="flex h-[38px] items-center">
      <Image src="/brand/kutubooku-logo.svg" alt="kutubooku" width={1674} height={275} priority className="h-auto w-[142px]" />
    </Link>
  );
}

function SplitButton({ href, label, className = "" }: { href: string; label: string; className?: string }) {
  return (
    <Button variant="split" size="sm" href={href} className={className}>
      {label}
    </Button>
  );
}

export function LegacyHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="relative z-40 flex h-20 items-center justify-between gap-4 bg-transparent px-4 sm:px-[18px]">
      <Logo />

      <nav aria-label="Main" className="absolute left-1/2 hidden -translate-x-1/2 lg:block">
        <ul className="flex items-center gap-1.5">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={pill}>
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <SplitButton href="/reading-preferences" label="Find books for my child" />
          </li>
        </ul>
      </nav>

      <ul className="hidden items-center gap-1.5 xl:flex">
        <li>
          <span className={`${pill} cursor-default hover:bg-white/65`}>🇮🇳 Shopping on Amazon.in</span>
        </li>
      </ul>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="group flex h-[47px] items-stretch gap-0.5 lg:hidden"
      >
        <span className={`flex items-center rounded-md px-3.5 text-[15.5px] font-bold tracking-[-0.03em] ${chip}`}>
          {open ? "Close" : "Menu"}
        </span>
        <span className={`grid w-[47px] place-items-center rounded-md ${chip}`}>
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </span>
      </button>

      <div
        id="mobile-menu"
        hidden={!open}
        className="absolute inset-x-4 top-[calc(100%-0.25rem)] rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 lg:hidden"
      >
        <nav aria-label="Main">
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl px-4 py-3.5 text-xl font-semibold tracking-[-0.01em] hover:bg-paper"
                >
                  {l.label}
                  <Arrow className="size-5 text-ink-soft" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <SplitButton href="/reading-preferences" label="Find books for my child" className="mt-2 h-[47px]" />
        <p className="mt-3 pb-1 text-center text-sm font-semibold text-ink-soft">🇮🇳 Shopping on Amazon.in</p>
      </div>
    </header>
  );
}
