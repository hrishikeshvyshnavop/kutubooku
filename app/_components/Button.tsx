"use client";

import Link from "next/link";
import React from "react";

/* -------------------------------------------------------------------------- */
/*                               Class Constants                              */
/* -------------------------------------------------------------------------- */

export const BTN_BASE =
  "group inline-flex h-14 shrink-0 items-center justify-center gap-2.5 rounded-[18px] text-lg font-medium tracking-[-0.01em] transition-[background-color,border-color,color,scale,border-radius] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:rounded-[28px] focus-visible:rounded-[28px] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838] disabled:pointer-events-none disabled:opacity-30";

// Primary = amber #f1a903 (hover #d99500) with navy text: 7.4:1 contrast (6.1:1 on hover).
export const BTN_PRIMARY = `${BTN_BASE} border-2 px-5 border-[#f1a903] bg-[#f1a903] text-[#1d2838] hover:border-[#d99500] hover:bg-[#d99500]`;

export const BTN_SECONDARY = `${BTN_BASE} relative isolate overflow-hidden px-[22px] text-[#1d2838]`;

export const BTN_GOOGLE =
  "group inline-flex h-14 shrink-0 items-center justify-center gap-3 rounded-[18px] border border-[#747775] bg-white px-6 text-lg font-medium text-[#1f1f1f] transition-[background-color,scale,border-radius] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:rounded-[28px] hover:bg-[#f2f2f2] focus-visible:rounded-[28px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60";

/* -------------------------------------------------------------------------- */
/*                                    Icons                                   */
/* -------------------------------------------------------------------------- */

export function ArrowIcon({
  dir,
  className = "",
}: {
  dir: "left" | "right";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-5 shrink-0 transition-transform duration-200 ${
        dir === "left" ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"
      } ${className}`}
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

export function GoogleIcon({ className = "size-5 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Component Types                             */
/* -------------------------------------------------------------------------- */

export type ButtonVariant = "primary" | "secondary" | "outline" | "google";

export interface ButtonSharedProps {
  variant?: ButtonVariant;
  arrow?: "left" | "right";
  textColor?: "white" | "ink";
  label?: string;
  className?: string;
  children?: React.ReactNode;
}

export type ButtonAsButton = ButtonSharedProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonSharedProps> & {
    href?: undefined;
  };

export type ButtonAsAnchor = ButtonSharedProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonSharedProps> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

/* -------------------------------------------------------------------------- */
/*                             Main Button Component                          */
/* -------------------------------------------------------------------------- */

export function Button({
  variant = "primary",
  arrow,
  textColor,
  label,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const isSecondary = variant === "secondary" || variant === "outline";
  const isGoogle = variant === "google";

  // Outline pointer coordinates tracking for the circular ripple effect
  const handlePointerEnter = (e: React.PointerEvent<HTMLElement>) => {
    if (!isSecondary) return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLElement>) => {
    if (!isSecondary) return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
  };

  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    if (!isSecondary) return;
    if (e.currentTarget.matches(":focus-visible")) {
      e.currentTarget.style.removeProperty("--x");
      e.currentTarget.style.removeProperty("--y");
    }
  };

  // Resolve classes based on variant and text color
  let variantClass = BTN_PRIMARY;
  if (isSecondary) {
    variantClass = BTN_SECONDARY;
  } else if (isGoogle) {
    variantClass = BTN_GOOGLE;
  } else if (variant === "primary") {
    // Amber primary (#f1a903): navy text by default — white on amber is only ~2:1 contrast.
    const textClass = textColor === "white" ? "text-white" : "text-[#1d2838]";
    variantClass = `${BTN_BASE} border-2 px-5 border-[#f1a903] bg-[#f1a903] ${textClass} hover:border-[#d99500] hover:bg-[#d99500]`;
  }

  const combinedClassName = `${variantClass} ${className}`.trim();

  // Internal contents
  const content = isSecondary ? (
    <>
      <span
        aria-hidden
        className="absolute inset-0 -z-10 bg-[#1d2838] transition-[clip-path] duration-[520ms] ease-[cubic-bezier(0.64,0,0.78,0)] group-hover:ease-[cubic-bezier(0.22,1,0.36,1)] group-focus-visible:ease-[cubic-bezier(0.22,1,0.36,1)] [clip-path:circle(0%_at_var(--x,50%)_var(--y,50%))] group-hover:[clip-path:circle(150%_at_var(--x,50%)_var(--y,50%))] group-focus-visible:[clip-path:circle(150%_at_var(--x,50%)_var(--y,50%))] motion-reduce:transition-none"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_2px_#1d2838]"
      />
      <span className="relative inline-flex items-center gap-2.5 transition-colors delay-[200ms] duration-[260ms] ease-out group-hover:text-white group-hover:delay-[60ms] group-focus-visible:text-white">
        {arrow === "left" ? <ArrowIcon dir="left" /> : null}
        {children}
        {arrow === "right" ? <ArrowIcon dir="right" /> : null}
      </span>
    </>
  ) : (
    <>
      {isGoogle ? <GoogleIcon /> : null}
      {arrow === "left" ? <ArrowIcon dir="left" /> : null}
      {children}
      {arrow === "right" ? <ArrowIcon dir="right" /> : null}
    </>
  );

  // Polymorphic rendering: Next.js Link vs native anchor vs button
  if ("href" in props && props.href) {
    const { href, target, rel, ...restAnchorProps } = props as ButtonAsAnchor;
    const isInternal = href.startsWith("/") && !href.startsWith("//") && target !== "_blank";

    if (isInternal) {
      return (
        <Link
          href={href}
          aria-label={label}
          className={combinedClassName}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onFocus={handleFocus}
          {...restAnchorProps}
        >
          {content}
        </Link>
      );
    }

    return (
      <a
        href={href}
        target={target}
        rel={rel || (target === "_blank" ? "noopener noreferrer" : undefined)}
        aria-label={label}
        className={combinedClassName}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocus={handleFocus}
        {...restAnchorProps}
      >
        {content}
      </a>
    );
  }

  const { type = "button", disabled, ...restButtonProps } = props as ButtonAsButton;

  return (
    <button
      type={type}
      disabled={disabled}
      aria-label={label}
      className={combinedClassName}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={handleFocus}
      {...restButtonProps}
    >
      {content}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Specialized Buttons                          */
/* -------------------------------------------------------------------------- */

/**
 * Outline button with navy entry-origin ripple animation.
 * Replaces and is 100% compatible with previous OutlineButton definitions.
 */
export function OutlineButton({
  onClick,
  label,
  children,
  disabled,
  className,
  arrow,
}: {
  onClick?: () => void;
  label?: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  arrow?: "left" | "right";
}) {
  return (
    <Button
      variant="secondary"
      onClick={onClick}
      label={label}
      disabled={disabled}
      className={className}
      arrow={arrow}
    >
      {children}
    </Button>
  );
}

/** Google Sign-In button following official branding guidelines. */
export function GoogleButton({
  onClick,
  busy,
  children,
  className = "",
}: {
  onClick?: () => void;
  busy?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Button
      variant="google"
      onClick={onClick}
      disabled={busy}
      className={`w-full sm:w-auto ${className}`.trim()}
    >
      {children ?? (busy ? "Signing in…" : "Continue with Google")}
    </Button>
  );
}

/** Split CTA button (action label + arrow chip), e.g. "Buy on Amazon" or "Read more". */
export function SplitButton({
  href,
  onClick,
  label,
  dark = false,
  className = "",
  size = "md",
}: {
  href?: string;
  onClick?: () => void;
  label: React.ReactNode;
  dark?: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  const isSm = size === "sm";
  const heightClass = isSm ? "h-10" : "h-12";
  const radiusClass = isSm
    ? "rounded-[12px] group-hover/split:rounded-[20px]"
    : "rounded-[14px] group-hover/split:rounded-[24px]";
  const arrowBoxClass = isSm ? "w-10" : "w-12";
  const iconSize = isSm ? "size-4" : "size-5";

  const chipStyle: React.CSSProperties = {
    backgroundColor: dark ? "#fffdf8" : "#1d2838",
    color: dark ? "#1d2838" : "#fffdf8",
  };

  const inner = (
    <>
      <span
        className={`flex flex-1 items-center justify-center text-[15px] font-semibold transition-[border-radius] duration-300 ${radiusClass}`}
        style={chipStyle}
      >
        {label}
      </span>
      <span
        className={`grid place-items-center transition-[border-radius] duration-300 ${arrowBoxClass} ${radiusClass}`}
        style={chipStyle}
      >
        <svg
          viewBox="0 0 24 24"
          className={`${iconSize} transition-transform group-hover/split:translate-x-0.5`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M4 12h16M14 6l6 6-6 6" />
        </svg>
      </span>
    </>
  );

  if (href) {
    const isInternal = href.startsWith("/") && !href.startsWith("//");
    if (isInternal) {
      return (
        <Link
          href={href}
          className={`group/split flex items-stretch gap-1 ${heightClass} ${className}`.trim()}
        >
          {inner}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className={`group/split flex items-stretch gap-1 ${heightClass} ${className}`.trim()}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group/split flex items-stretch gap-1 ${heightClass} ${className}`.trim()}
    >
      {inner}
    </button>
  );
}

/** Thumbs reaction button with like-pop and like-ring burst animation. */
export function ThumbButton({
  dark,
  pressed,
  label,
  onClick,
  type = "up",
}: {
  dark: boolean;
  pressed: boolean;
  label: string;
  onClick: () => void;
  type?: "up" | "down";
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
      className={`grid size-10 place-items-center rounded-[13px] transition-[background-color,color,scale] duration-200 active:scale-95 ${
        pressed
          ? dark
            ? "relative bg-[#fffdf8] text-[#1d2838] animate-[like-pop_420ms_cubic-bezier(.22,1,.36,1)]"
            : "relative bg-[#1d2838] text-white animate-[like-pop_420ms_cubic-bezier(.22,1,.36,1)]"
          : dark
            ? "hover:bg-white/15"
            : "hover:bg-[#1d2838]/10"
      }`}
    >
      {pressed ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-[16px] border-2 border-current opacity-0 animate-[like-ring_520ms_ease-out]"
        />
      ) : null}
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {type === "up" ? (
          <path d="M7 10v10H4V10zM7 10l4-7c1.7 0 2.5 1 2.2 2.6L12.6 9H19a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 20H7" />
        ) : (
          <path d="M17 14V4h3v10zM17 14l-4 7c-1.7 0-2.5-1-2.2-2.6l.6-3.4H5a2 2 0 0 1-2-2.3l1.2-7A2 2 0 0 1 6.2 4H17" />
        )}
      </svg>
    </button>
  );
}
