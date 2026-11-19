"use client";

import Link from "next/link";
import React from "react";

export type ButtonVariant = "primary" | "secondary" | "split" | "ghost" | "icon" | "link" | "google";
export type ButtonTone = "amber" | "violet" | "ink" | "light" | "outline" | "clear" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
type IconName = "arrow" | "external" | "none";

type SharedProps = {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  arrow?: "left" | "right";
  icon?: IconName | React.ReactNode;
  loading?: boolean;
  label?: string;
  className?: string;
  children?: React.ReactNode;
};

type AsButton = SharedProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof SharedProps> & { href?: undefined; newTab?: undefined };
type AsLink = SharedProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof SharedProps> & { href: string; newTab?: boolean };
export type ButtonProps = AsButton | AsLink;

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]";
const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

const SOLID = {
  amber: "bg-[#f9a220] text-black group-hover:bg-[#e8900c]",
  violet: "bg-[#9a83de] text-white group-hover:bg-[#8670cc]",
  ink: "bg-[#1d2838] text-[#fffdf8] group-hover:bg-black",
  light: "bg-[#fffdf8] text-[#1d2838] group-hover:bg-white",
  outline: "bg-transparent text-[#1d2838] shadow-[inset_0_0_0_2px_#1d2838] group-hover:bg-[#1d2838] group-hover:text-white",
  clear: "bg-transparent text-current group-hover:bg-current/10",
  danger: "bg-[#b3402a] text-white group-hover:bg-[#9a3522]",
} as const;

const PILL = {
  amber: "bg-[#f9a220] text-black hover:bg-[#e8900c]",
  violet: "bg-[#9a83de] text-white hover:bg-[#8670cc]",
  ink: "bg-[#1d2838] text-white hover:bg-black",
  light: "text-[#fffdf8]/80 hover:bg-white/10 hover:text-[#fffdf8]",
  outline: "border-2 border-[#1d2838]/15 text-[#1d2838] hover:border-[#1d2838] hover:bg-[#1d2838]/5",
  clear: "text-current opacity-70 hover:bg-current/10 hover:opacity-100",
  danger: "bg-[#b3402a] text-white hover:bg-[#9a3522]",
} as const;

const ICON_TONE = {
  amber: "bg-[#f9a220] text-black hover:bg-[#e8900c]",
  violet: "bg-[#9a83de] text-white hover:bg-[#8670cc]",
  ink: "bg-[#1d2838] text-white hover:bg-black",
  light: "bg-[#f4eee3] text-[#1d2838] hover:bg-[#f9a220]",
  outline: "border-2 border-black text-black hover:bg-black hover:text-[#FDDAA6]",
  clear: "text-current opacity-60 hover:bg-current/10 hover:opacity-100",
  danger: "bg-[#b3402a] text-white hover:bg-[#9a3522]",
} as const;

const LINK_TONE: Record<ButtonTone, string> = {
  amber: "text-[#a86f00]",
  violet: "text-[#3b308f]",
  ink: "text-[#1d2838]",
  light: "text-[#fffdf8]",
  outline: "text-[#1d2838]/70 hover:text-[#1d2838]",
  clear: "text-current",
  danger: "text-[#b3402a]",
};

const SPLIT_SIZE = {
  sm: { h: "h-10", chip: "w-10", radius: "rounded-[12px] group-hover:rounded-[20px]", text: "px-3.5 text-[14px] font-semibold", icon: "size-4" },
  md: { h: "h-12", chip: "w-12", radius: "rounded-[14px] group-hover:rounded-[24px]", text: "px-4 type-button-sm", icon: "size-[18px]" },
  lg: { h: "h-14", chip: "w-14", radius: "rounded-lg group-hover:rounded-[24px]", text: "px-5 text-xl font-bold leading-none tracking-[-0.48px]", icon: "size-5" },
} as const;

const PILL_SIZE = { sm: "h-9 px-4 type-label", md: "h-11 px-5 type-label", lg: "h-12 px-6 type-button-sm" } as const;
const ICON_SIZE = { sm: "size-10", md: "size-12", lg: "size-14" } as const;

const BASE_BLOCK = `group inline-flex h-14 shrink-0 items-center justify-center gap-2.5 rounded-[18px] text-lg font-medium tracking-[-0.01em] transition-[background-color,border-color,color,scale,border-radius] duration-300 ${EASE} hover:rounded-[28px] focus-visible:rounded-[28px] active:scale-[0.98] ${FOCUS} disabled:pointer-events-none disabled:opacity-30`;

export function ArrowIcon({ dir, className = "" }: { dir: "left" | "right"; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-5 shrink-0 transition-transform duration-200 ${dir === "left" ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"} ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={dir === "left" ? "M20 12H4M10 6l-6 6 6 6" : "M4 12h16M14 6l6 6-6 6"} />
    </svg>
  );
}

export function BrandArrow({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 18.6562 16" className={`${className} transition-transform duration-300 group-hover:translate-x-0.5`} fill="currentColor" aria-hidden>
      <path d="M17.4266 6.96615V8.00615L10.0493 14.9723L7.94472 12.4332C9.64169 11.1337 11.393 9.90679 13.1939 8.75569L13.1693 8.65969C10.9195 8.90092 8.11456 9.02154 5.30841 9.02154H0.712715V5.95077H5.30841C8.11456 5.95077 10.9207 6.07138 13.1693 6.31262L13.1939 6.24C11.3973 5.07474 9.64622 3.8406 7.94472 2.54031L10.0493 0L17.4266 6.96615Z" />
    </svg>
  );
}

function ExternalIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}

function Spinner() {
  return <span aria-hidden className="size-5 shrink-0 animate-spin rounded-full border-[3px] border-current/25 border-t-current motion-reduce:animate-none" />;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5 shrink-0" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function iconFor(icon: SharedProps["icon"], className: string) {
  if (icon === "none") return null;
  if (icon === "external") return <ExternalIcon className={className} />;
  if (icon === "arrow" || icon === undefined) return <BrandArrow className={className} />;
  return icon;
}

function setPressOrigin(e: React.PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
}

function clearPressOrigin(e: React.FocusEvent<HTMLElement>) {
  if (!e.currentTarget.matches(":focus-visible")) return;
  e.currentTarget.style.removeProperty("--x");
  e.currentTarget.style.removeProperty("--y");
}

function render(variant: ButtonVariant, tone: ButtonTone, size: ButtonSize, props: SharedProps) {
  const { arrow, icon, loading, children } = props;
  const lead = loading ? <Spinner /> : arrow === "left" ? <ArrowIcon dir="left" /> : null;
  const trail = !loading && arrow === "right" ? <ArrowIcon dir="right" /> : null;

  switch (variant) {
    case "split": {
      const s = SPLIT_SIZE[size];
      const block = `${SOLID[tone]} ${s.radius} transition-[background-color,border-radius,color] duration-300`;
      const chip = loading ? <Spinner /> : iconFor(icon, s.icon);
      return {
        className: `group inline-flex ${s.h} items-stretch gap-0.5 ${FOCUS} disabled:pointer-events-none disabled:opacity-60`,
        content: (
          <>
            <span className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap ${s.text} ${block}`}>{children}</span>
            {chip && <span className={`grid ${s.chip} shrink-0 place-items-center ${block}`}>{chip}</span>}
          </>
        ),
      };
    }
    case "ghost":
      return {
        className: `group inline-flex shrink-0 items-center justify-center gap-2 rounded-full transition-[background-color,border-color,color,opacity] duration-200 ${PILL_SIZE[size]} ${PILL[tone]} ${FOCUS} disabled:pointer-events-none disabled:opacity-40`,
        content: (
          <>
            {lead}
            {children}
            {trail}
          </>
        ),
      };
    case "link":
      return {
        className: `group inline-flex items-center gap-1.5 rounded link-underline-on ${size === "sm" ? "type-caption" : "type-label"} ${LINK_TONE[tone]} transition-colors ${FOCUS} disabled:pointer-events-none disabled:opacity-40`,
        content: (
          <>
            {lead}
            {children}
            {trail}
          </>
        ),
      };
    case "icon":
      return {
        className: `group grid shrink-0 place-items-center rounded-full transition-[background-color,color,opacity,scale] duration-200 active:scale-95 ${ICON_SIZE[size]} ${ICON_TONE[tone]} ${FOCUS} disabled:pointer-events-none disabled:opacity-30`,
        content: loading ? <Spinner /> : children,
      };
    case "google":
      return {
        className: `${BASE_BLOCK} gap-3 border border-[#747775] bg-white px-6 text-[#1f1f1f] hover:bg-[#f2f2f2] disabled:opacity-60`,
        content: (
          <>
            {loading ? <Spinner /> : <GoogleIcon />}
            {children}
          </>
        ),
      };
    case "secondary":
      return {
        className: `${BASE_BLOCK} relative isolate overflow-hidden px-[22px] text-[#1d2838]`,
        sweep: true,
        content: (
          <>
            <span
              aria-hidden
              className="absolute inset-0 -z-10 bg-[#1d2838] transition-[clip-path] duration-[520ms] ease-[cubic-bezier(0.64,0,0.78,0)] group-hover:ease-[cubic-bezier(0.22,1,0.36,1)] group-focus-visible:ease-[cubic-bezier(0.22,1,0.36,1)] [clip-path:circle(0%_at_var(--x,50%)_var(--y,50%))] group-hover:[clip-path:circle(150%_at_var(--x,50%)_var(--y,50%))] group-focus-visible:[clip-path:circle(150%_at_var(--x,50%)_var(--y,50%))] motion-reduce:transition-none"
            />
            <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_2px_#1d2838]" />
            <span className="relative inline-flex items-center gap-2.5 transition-colors delay-[200ms] duration-[260ms] ease-out group-hover:text-white group-hover:delay-[60ms] group-focus-visible:text-white">
              {lead}
              {children}
              {trail}
            </span>
          </>
        ),
      };
    default:
      return {
        className: `${BASE_BLOCK} border-2 border-[#f1a903] bg-[#f1a903] px-5 text-[#1d2838] hover:border-[#d99500] hover:bg-[#d99500]`,
        content: (
          <>
            {lead}
            {children}
            {trail}
          </>
        ),
      };
  }
}

const DEFAULT_TONE: Record<ButtonVariant, ButtonTone> = {
  primary: "amber",
  secondary: "outline",
  split: "amber",
  ghost: "outline",
  icon: "light",
  link: "ink",
  google: "light",
};

const DEFAULT_SIZE: Record<ButtonVariant, ButtonSize> = {
  primary: "lg",
  secondary: "lg",
  split: "lg",
  ghost: "md",
  icon: "sm",
  link: "md",
  google: "lg",
};

export function Button(props: ButtonProps) {
  const { variant = "primary", tone, size, arrow, icon, loading, label, className = "", children, ...rest } = props;
  const v = render(variant, tone ?? DEFAULT_TONE[variant], size ?? DEFAULT_SIZE[variant], { arrow, icon, loading, children });
  const cls = `${v.className} ${className}`.trim();
  const sweep = v.sweep ? { onPointerEnter: setPressOrigin, onPointerLeave: setPressOrigin, onFocus: clearPressOrigin } : {};

  if ("href" in rest && rest.href) {
    const { href, newTab, target, rel, ...anchor } = rest as Omit<AsLink, keyof SharedProps>;
    const external = newTab || target === "_blank" || !href.startsWith("/") || href.startsWith("//");
    if (!external) {
      return (
        <Link href={href} aria-label={label} className={cls} {...sweep} {...anchor}>
          {v.content}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target={newTab ? "_blank" : target}
        rel={rel ?? (newTab || target === "_blank" ? "sponsored noopener noreferrer" : undefined)}
        aria-label={label}
        className={cls}
        {...sweep}
        {...anchor}
      >
        {v.content}
        {(newTab || target === "_blank") && <span className="sr-only"> (opens in a new tab)</span>}
      </a>
    );
  }

  const { type = "button", disabled, ...button } = rest as Omit<AsButton, keyof SharedProps>;
  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} aria-label={label} className={cls} {...sweep} {...button}>
      {v.content}
    </button>
  );
}
