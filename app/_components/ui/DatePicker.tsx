"use client";

import { Button } from "./Button";
import { useEffect, useId, useRef, useState } from "react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const parseIso = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};

const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

const sameDay = (a: Date | null, b: Date | null) => !!a && !!b && toIso(a) === toIso(b);

const longDate = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

const fullDate = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const monthTitle = (d: Date) => d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

type DatePickerProps = {
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  labelledBy?: string;
  className?: string;
};

export function DatePicker({ value, onChange, min, max, placeholder = "Choose a date", labelledBy, className = "" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogId = useId();
  const selected = value ? parseIso(value) : null;

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        aria-labelledby={labelledBy}
        aria-describedby={`${dialogId}-value`}
        onClick={() => setOpen((o) => !o)}
        className={`group flex h-12 w-full items-center gap-3 rounded-[14px] bg-[#fffdf8] px-4 text-left type-body outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[#1d2838] ${
          open ? "ring-2 ring-[#1d2838]" : ""
        }`}
      >
        <CalendarIcon />
        <span id={`${dialogId}-value`} className={`flex-1 truncate ${selected ? "" : "text-[#1d2838]/40"}`}>
          {selected ? longDate(selected) : placeholder}
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`size-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <Calendar
          id={dialogId}
          selected={selected}
          min={min ? parseIso(min) : null}
          max={max ? parseIso(max) : null}
          onPick={(d) => {
            onChange(toIso(d));
            close();
          }}
          onClear={() => {
            onChange("");
            close();
          }}
          onClose={close}
        />
      )}
    </div>
  );
}

function Calendar({
  id,
  selected,
  min,
  max,
  onPick,
  onClear,
  onClose,
}: {
  id: string;
  selected: Date | null;
  min: Date | null;
  max: Date | null;
  onPick: (d: Date) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [today] = useState(() => new Date());
  const start = selected ?? (min && min > today ? min : today);
  const [focusDay, setFocusDay] = useState<Date>(start);
  const [month, setMonth] = useState(() => new Date(start.getFullYear(), start.getMonth(), 1));
  const gridRef = useRef<HTMLDivElement>(null);
  const titleId = `${id}-title`;

  const outOfRange = (d: Date) => (!!min && toIso(d) < toIso(min)) || (!!max && toIso(d) > toIso(max));

  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const lead = firstOfMonth.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];

  const prevMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const canPrev = !min || new Date(month.getFullYear(), month.getMonth(), 0) >= min;
  const canNext = !max || nextMonth <= max;

  useEffect(() => {
    gridRef.current?.querySelector<HTMLButtonElement>('[data-focus="true"]')?.focus();
  }, [focusDay]);

  const moveFocus = (d: Date) => {
    if (outOfRange(d)) return;
    setFocusDay(d);
    if (d.getMonth() !== month.getMonth() || d.getFullYear() !== month.getFullYear()) setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const showMonth = (m: Date) => {
    setMonth(m);
    const day = Math.min(focusDay.getDate(), new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate());
    let target = new Date(m.getFullYear(), m.getMonth(), day);
    if (min && target < min) target = min;
    if (max && target > max) target = max;
    setFocusDay(target);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focusDay, -1),
      ArrowRight: () => addDays(focusDay, 1),
      ArrowUp: () => addDays(focusDay, -7),
      ArrowDown: () => addDays(focusDay, 7),
      Home: () => addDays(focusDay, -focusDay.getDay()),
      End: () => addDays(focusDay, 6 - focusDay.getDay()),
      PageUp: () => new Date(focusDay.getFullYear(), focusDay.getMonth() - 1, focusDay.getDate()),
      PageDown: () => new Date(focusDay.getFullYear(), focusDay.getMonth() + 1, focusDay.getDate()),
    };
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    moveFocus(move());
  };

  return (
    <div
      id={id}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
      className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-[min(340px,calc(100vw-3rem))] origin-top-left animate-q-in rounded-[28px] bg-[#fffdf8] p-4 shadow-[0_24px_48px_-20px_rgba(29,40,56,0.45)] ring-1 ring-[#1d2838]/10 sm:p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <MonthButton dir="prev" disabled={!canPrev} onClick={() => showMonth(prevMonth)} />
        <p id={titleId} aria-live="polite" className="type-title-sm">
          {monthTitle(month)}
        </p>
        <MonthButton dir="next" disabled={!canNext} onClick={() => showMonth(nextMonth)} />
      </div>

      <div ref={gridRef} role="grid" aria-labelledby={titleId} className="mt-4">
        <div role="row" className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w) => (
            <span key={w} role="columnheader" aria-label={w} className="grid h-8 place-items-center type-body-sm font-semibold text-[#1d2838]/45">
              {w.slice(0, 2)}
            </span>
          ))}
        </div>
        <div key={toIso(month)} role="rowgroup" className="mt-1 grid animate-q-in grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <span key={`blank-${i}`} role="gridcell" aria-hidden />;
            const disabled = outOfRange(d);
            const isSelected = sameDay(d, selected);
            const isToday = sameDay(d, today);
            const isFocus = sameDay(d, focusDay);
            return (
              <span key={toIso(d)} role="gridcell" aria-selected={isSelected}>
                <button
                  type="button"
                  tabIndex={isFocus ? 0 : -1}
                  data-focus={isFocus}
                  disabled={disabled}
                  aria-label={`${fullDate(d)}${isToday ? ", today" : ""}${disabled ? ", not available" : ""}`}
                  aria-pressed={isSelected}
                  onClick={() => onPick(d)}
                  className={`relative grid aspect-square w-full place-items-center rounded-[14px] text-[15px] font-medium tabular-nums transition-[background-color,color,scale,rotate] duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838] active:scale-95 disabled:cursor-not-allowed disabled:text-[#1d2838]/25 disabled:line-through motion-reduce:transition-none ${
                    isSelected
                      ? "rotate-[-6deg] scale-105 bg-[#1d2838] font-semibold text-[#f9a220]"
                      : disabled
                        ? ""
                        : "bg-[#f4eee3] text-[#1d2838] hover:bg-[#ece3d3]"
                  }`}
                >
                  {d.getDate()}
                  {isToday && !isSelected && <span aria-hidden className="absolute bottom-1.5 size-1 rounded-full bg-[#f26b4f]" />}
                </button>
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#1d2838]/10 pt-3">
        <p className="type-body-sm text-[#1d2838]/60">{min ? `Earliest ${min.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}</p>
        {selected && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear date
          </Button>
        )}
      </div>
    </div>
  );
}

function MonthButton({ dir, disabled, onClick }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void }) {
  return (
    <Button variant="icon" onClick={onClick} disabled={disabled} label={dir === "prev" ? "Previous month" : "Next month"}>
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={dir === "prev" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </Button>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}
