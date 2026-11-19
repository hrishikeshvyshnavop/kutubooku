"use client";

import { useState } from "react";

const ROLL = "transition-[translate,rotate,scale,opacity] duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

const SIZES = {
  md: { btn: "h-12", face: "px-3 rounded-[14px] group-hover/buy:rounded-[24px] type-button-sm", icon: "size-5", gap: "gap-2", label: "" },
  sm: { btn: "h-10", face: "px-3 rounded-[12px] group-hover/buy:rounded-[20px] text-[13px] font-semibold leading-none sm:text-sm", icon: "size-4", gap: "gap-1.5", label: "" },
  icon: { btn: "size-11 shrink-0", face: "rounded-full", icon: "size-5", gap: "", label: "hidden" },
} as const;

export function AddToBoxButton({
  selected,
  onToggle,
  title,
  whoseBox,
  addLabel = `Add to ${whoseBox}`,
  inLabel = `In ${whoseBox}`,
  fill,
  size = "md",
  className = "",
}: {
  selected: boolean;
  onToggle: () => void;
  title: string;
  whoseBox: string;
  addLabel?: string;
  inLabel?: string;
  fill: { bg: string; fg: string };
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const [peekOff, setPeekOff] = useState(false);
  const z = SIZES[size];

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={selected ? `“${title}” is in ${whoseBox}. Take it out` : `Add “${title}” to ${whoseBox}`}
      data-fresh={peekOff || undefined}
      onClick={(e) => {
        e.stopPropagation();
        setPeekOff(true);
        onToggle();
      }}
      onPointerLeave={() => setPeekOff(false)}
      onBlur={() => setPeekOff(false)}
      className={`buy-btn group/buy flex items-stretch focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${z.btn} ${className}`}
    >
      <span
        className={`grid flex-1 place-items-center overflow-hidden border-2 transition-[border-radius,background-color,color,border-color] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none [&>*]:col-start-1 [&>*]:row-start-1 ${z.face} ${
          selected && peekOff ? "animate-[buy-pop_480ms_cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:animate-none" : ""
        }`}
        style={selected ? { backgroundColor: "transparent", color: "inherit", borderColor: "currentColor" } : { backgroundColor: fill.bg, color: fill.fg, borderColor: "transparent" }}
      >
        <span aria-hidden={selected} className={`${ROLL} flex items-center whitespace-nowrap ${z.gap} ${selected ? "-translate-y-[160%] opacity-0" : ""}`}>
          <svg viewBox="0 0 24 24" className={z.icon} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3.5 8.5 12 4l8.5 4.5v9L12 22l-8.5-4.5z" />
            <path d="M3.5 8.5 12 13l8.5-4.5M12 13v9" />
          </svg>
          <span className={z.label}>{addLabel}</span>
        </span>
        <span aria-hidden={!selected} className={`${ROLL} flex items-center whitespace-nowrap ${z.gap} ${selected ? "" : "translate-y-[160%] opacity-0"}`}>
          <span aria-hidden className={`relative shrink-0 ${z.icon}`}>
            <svg viewBox="0 0 24 24" className={`${ROLL} absolute inset-0 ${z.icon} buy-peek:-rotate-90 buy-peek:scale-50 buy-peek:opacity-0`} fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path
                d="M5 12l5 5L20 7"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={selected ? 0 : 1}
                className="transition-[stroke-dashoffset] delay-150 duration-[420ms] ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none"
              />
            </svg>
            <svg viewBox="0 0 24 24" className={`${ROLL} absolute inset-0 ${z.icon} rotate-90 scale-50 opacity-0 buy-peek:rotate-0 buy-peek:scale-100 buy-peek:opacity-100`} fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
              <path d="M6 12h12" />
            </svg>
          </span>
          <span className={`-my-1 grid justify-items-center ${z.label} overflow-hidden py-1 [&>*]:col-start-1 [&>*]:row-start-1`}>
            <span className={`${ROLL} buy-peek:-translate-y-[140%] buy-peek:opacity-0`}>{inLabel}</span>
            <span aria-hidden className={`${ROLL} translate-y-[140%] opacity-0 buy-peek:translate-y-0 buy-peek:opacity-100`}>Take it out</span>
          </span>
        </span>
      </span>
    </button>
  );
}
