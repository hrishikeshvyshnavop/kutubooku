// Tick used for "done" states (In box, Opened, Saved). An SVG rather than the ✓ character,
// so it looks the same in every font and on every device.

export function CheckIcon({ className = "size-5", strokeWidth = 2.8 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
