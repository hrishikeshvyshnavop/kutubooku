// Original spot illustrations for questionnaire answers (48×48, navy line +
// one or two palette fills). Keyed by "<questionId>:<optionValue>".
// Add a key here to give any new answer an illustration; options without one
// fall back to a letter tile.

const INK = "#1d2838";
const CORAL = "#f26b4f";
const MARIGOLD = "#f6c453";
const SKY = "#9fcbf2";
const MINT = "#a9dfc0";
const LILAC = "#c9b7f1";

const line = { stroke: INK, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

/** Open book used by several reading illustrations. */
const OpenBook = ({ fill = "#fff", y = 0 }: { fill?: string; y?: number }) => (
  <g transform={`translate(0 ${y})`}>
    <path d="M24 30c-4-3-10-4-16-4v12c6 0 12 1 16 4 4-3 10-4 16-4V26c-6 0-12 1-16 4z" fill={fill} {...line} />
    <path d="M24 30v12" {...line} />
  </g>
);

const ART: Record<string, React.ReactNode> = {
  /* ---------- reading stage ---------- */
  "stage:read-to": (
    <>
      <OpenBook fill={MARIGOLD} y={2} />
      <path d="M14 8h20a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H24l-5 4v-4h-5a4 4 0 0 1-4-4v-6a4 4 0 0 1 4-4z" fill={SKY} {...line} />
      <circle cx="18" cy="15" r="1.4" fill={INK} />
      <circle cx="24" cy="15" r="1.4" fill={INK} />
      <circle cx="30" cy="15" r="1.4" fill={INK} />
    </>
  ),
  "stage:learning": (
    <>
      <OpenBook fill="#fff" y={2} />
      <rect x="9" y="7" width="13" height="13" rx="3" fill={MINT} {...line} />
      <path d="M13 17l2.5-7 2.5 7M14 15h3" {...line} strokeWidth={1.7} />
      <rect x="26" y="9" width="13" height="13" rx="3" fill={CORAL} {...line} />
      <path d="M30 13v6h2.5a1.8 1.8 0 0 0 0-3.6H30" {...line} strokeWidth={1.7} />
    </>
  ),
  "stage:independent": (
    <>
      <circle cx="24" cy="13" r="7" fill={MARIGOLD} {...line} />
      <path d="M21 13.5h.01M27 13.5h.01" {...line} strokeWidth={2.6} />
      <path d="M21.5 16.5c1.5 1.2 3.5 1.2 5 0" {...line} strokeWidth={1.6} />
      <OpenBook fill={SKY} y={0} />
    </>
  ),
  "stage:confident": (
    <>
      <rect x="10" y="33" width="28" height="7" rx="1.5" fill={CORAL} {...line} />
      <rect x="12" y="26" width="24" height="7" rx="1.5" fill={MINT} {...line} />
      <rect x="9" y="19" width="26" height="7" rx="1.5" fill={LILAC} {...line} />
      <path d="M36 6l1.6 3.4 3.7.5-2.7 2.6.7 3.7L36 14.4l-3.3 1.8.7-3.7-2.7-2.6 3.7-.5z" fill={MARIGOLD} {...line} strokeWidth={1.6} />
    </>
  ),

  /* ---------- interests ---------- */
  "interests:animals": (
    <>
      <ellipse cx="24" cy="31" rx="9" ry="8" fill={MARIGOLD} {...line} />
      <ellipse cx="12.5" cy="20" rx="3.6" ry="4.6" fill={MARIGOLD} {...line} />
      <ellipse cx="19.5" cy="13" rx="3.6" ry="4.6" fill={MARIGOLD} {...line} />
      <ellipse cx="28.5" cy="13" rx="3.6" ry="4.6" fill={MARIGOLD} {...line} />
      <ellipse cx="35.5" cy="20" rx="3.6" ry="4.6" fill={MARIGOLD} {...line} />
    </>
  ),
  "interests:space": (
    <>
      <circle cx="22" cy="26" r="11" fill={LILAC} {...line} />
      <path d="M8 31c-3 3-2 5 3 4 6-1 15-5 22-10s9-9 6-10c-2-.6-5 .3-8 1.8" fill="none" {...line} />
      <path d="M38 6l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z" fill={MARIGOLD} {...line} strokeWidth={1.4} />
      <circle cx="10" cy="11" r="1.6" fill={INK} />
    </>
  ),
  "interests:dinosaurs": (
    <>
      <path d="M6 38c1-9 7-14 15-13 3-7 8-11 14-10 4 .7 5 4 2 5-2 .6-4 .4-5 2 2 4 2 10-1 16h-4l-1-5h-8l-1 5h-4l-1-6c-2 1-4 4-6 6z" fill={MINT} {...line} />
      <path d="M16 25l2-4 2 4M21 23l2-4 2 4" fill={CORAL} {...line} strokeWidth={1.6} />
      <circle cx="34" cy="18.5" r="1.3" fill={INK} />
    </>
  ),
  "interests:mystery": (
    <>
      <circle cx="20" cy="20" r="11" fill={SKY} {...line} />
      <path d="M15 17a6 6 0 0 1 5-4" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M28 28l11 11" {...line} strokeWidth={4} />
      <path d="M20 24.5v.01M18 16.5a2.3 2.3 0 1 1 3.2 2.1c-.8.4-1.2 1-1.2 1.9" fill="none" {...line} strokeWidth={1.8} />
    </>
  ),
  "interests:myths": (
    <>
      <path d="M8 36l3-20 8 8 5-12 5 12 8-8 3 20z" fill={MARIGOLD} {...line} />
      <path d="M8 36h32v4H8z" fill={CORAL} {...line} />
      <circle cx="11" cy="14" r="2" fill={LILAC} {...line} strokeWidth={1.6} />
      <circle cx="24" cy="9.5" r="2" fill={LILAC} {...line} strokeWidth={1.6} />
      <circle cx="37" cy="14" r="2" fill={LILAC} {...line} strokeWidth={1.6} />
    </>
  ),
  "interests:funny": (
    <>
      <circle cx="24" cy="24" r="16" fill={MARIGOLD} {...line} />
      <path d="M16 20c1.2-2 3.8-2 5 0M27 20c1.2-2 3.8-2 5 0" fill="none" {...line} />
      <path d="M15 27h18c-1 6-5 9-9 9s-8-3-9-9z" fill={CORAL} {...line} />
    </>
  ),
  "interests:feelings": (
    <>
      <path d="M19 38s-12-7-14-15a7 7 0 0 1 14-5 7 7 0 0 1 14 5c-2 8-14 15-14 15z" fill={CORAL} {...line} />
      <path d="M33 22s-6-3.5-7-7.5a3.6 3.6 0 0 1 7-2.6 3.6 3.6 0 0 1 7 2.6c-1 4-7 7.5-7 7.5z" fill={LILAC} {...line} strokeWidth={1.7} />
    </>
  ),
  "interests:nature": (
    <>
      <path d="M19 7h10M21 7v11L10 36a3 3 0 0 0 2.6 4.5h22.8A3 3 0 0 0 38 36L27 18V7" fill={SKY} {...line} />
      <path d="M13.5 31h21" {...line} />
      <path d="M33 22c4-6 9-5 9-5s0 6-6 8" fill={MINT} {...line} strokeWidth={1.7} />
      <circle cx="20" cy="35" r="1.6" fill="#fff" />
      <circle cx="27" cy="36" r="1.2" fill="#fff" />
    </>
  ),
  "interests:adventure": (
    <>
      <path d="M4 40l13-20 7 9 6-10 14 21z" fill={MINT} {...line} />
      <path d="M17 20l-3.5 5.5h7z" fill="#fff" {...line} strokeWidth={1.6} />
      <path d="M30 19V6" {...line} />
      <path d="M30 6h9l-2.5 3.5L39 13h-9" fill={CORAL} {...line} strokeWidth={1.8} />
    </>
  ),
  "interests:sports": (
    <>
      <circle cx="24" cy="24" r="16" fill="#fff" {...line} />
      <path d="M24 17l6.6 4.8-2.5 7.8h-8.2l-2.5-7.8z" fill={INK} />
      <path d="M24 17V8.5M30.6 21.8l8-2.6M28.1 29.6l5 6.8M19.9 29.6l-5 6.8M17.4 21.8l-8-2.6" {...line} strokeWidth={1.6} />
    </>
  ),
  "interests:history": (
    <>
      <path d="M12 9h22a4 4 0 0 1 0 8H14" fill={MARIGOLD} {...line} />
      <path d="M14 9a4 4 0 0 0-4 4v22a4 4 0 0 0 4 4h20a4 4 0 0 0 4-4V17" fill={MARIGOLD} {...line} />
      <path d="M14 9a4 4 0 0 1 0 8" fill="none" {...line} />
      <path d="M17 24h15M17 29h15M17 34h9" {...line} strokeWidth={1.7} />
    </>
  ),
  "interests:making": (
    <>
      <path d="M24 7C13 7 6 15 6 24s7 17 16 17c3 0 4-2 3-4.5S25 32 28 32h5c5 0 9-3 9-9 0-9-8-16-18-16z" fill={LILAC} {...line} />
      <circle cx="15" cy="21" r="3" fill={CORAL} {...line} strokeWidth={1.6} />
      <circle cx="22" cy="14" r="3" fill={MARIGOLD} {...line} strokeWidth={1.6} />
      <circle cx="31" cy="15" r="3" fill={MINT} {...line} strokeWidth={1.6} />
      <circle cx="35" cy="23" r="3" fill={SKY} {...line} strokeWidth={1.6} />
    </>
  ),

  /* ---------- already read? ---------- */
  "skip:no": (
    <>
      <OpenBook fill={MINT} y={0} />
      <path d="M24 6l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill={MARIGOLD} {...line} strokeWidth={1.6} />
      <path d="M36 12l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1zM12 14l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill={CORAL} {...line} strokeWidth={1.2} />
    </>
  ),
  "skip:yes": (
    <>
      <rect x="10" y="8" width="24" height="32" rx="3" fill={SKY} {...line} />
      <path d="M15 8v32" {...line} />
      <circle cx="34" cy="32" r="8" fill={MINT} {...line} />
      <path d="M30.5 32l2.5 2.5 4.5-5" fill="none" {...line} />
    </>
  ),

  /* ---------- can't stand ---------- */
  "avoid:scary": (
    <>
      <path d="M12 40V22a12 12 0 0 1 24 0v18l-4-3-4 3-4-3-4 3-4-3z" fill={LILAC} {...line} />
      <ellipse cx="19.5" cy="22" rx="2" ry="3" fill={INK} />
      <ellipse cx="28.5" cy="22" rx="2" ry="3" fill={INK} />
      <ellipse cx="24" cy="29" rx="2.4" ry="3" fill={INK} />
    </>
  ),
  "avoid:violence": (
    <>
      <path d="M10 10l20 20M38 10L18 30" {...line} strokeWidth={2.4} />
      <path d="M26 33l7-7M15 26l7 7" {...line} strokeWidth={3} />
      <path d="M29 34l4 4M19 34l-4 4" {...line} strokeWidth={3} stroke={CORAL} />
      <path d="M8 8l4 1-3 3zM40 8l-1 4-3-3z" fill={SKY} {...line} strokeWidth={1.6} />
    </>
  ),
  "avoid:sad": (
    <>
      <path d="M14 28a8 8 0 0 1-.6-16 11 11 0 0 1 21 2.5A7 7 0 0 1 34 28z" fill={SKY} {...line} />
      <path d="M17 33l-2 5M24 33l-2 5M31 33l-2 5" {...line} stroke={SKY} strokeWidth={2.6} />
      <path d="M20 22c2.4-1.6 5.6-1.6 8 0" fill="none" {...line} strokeWidth={1.6} />
    </>
  ),
  "avoid:romance": (
    <>
      <path d="M17 36s-10-6-11.5-12.5a6 6 0 0 1 11.5-4 6 6 0 0 1 11.5 4C27 30 17 36 17 36z" fill={CORAL} {...line} />
      <path d="M32 30s-7-4-8-8.6a4.2 4.2 0 0 1 8-2.8 4.2 4.2 0 0 1 8 2.8c-1 4.6-8 8.6-8 8.6z" fill={LILAC} {...line} strokeWidth={1.7} />
    </>
  ),
  "avoid:screens": (
    <>
      <rect x="6" y="13" width="36" height="24" rx="4" fill={SKY} {...line} />
      <path d="M18 5l6 8 6-8M17 42h14" {...line} />
      <path d="M21 21v8l7-4z" fill="#fff" {...line} strokeWidth={1.7} />
    </>
  ),
  "avoid:other": (
    <>
      <path d="M10 10h28a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H22l-8 7v-7h-4a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4z" fill={MARIGOLD} {...line} />
      <circle cx="16" cy="21" r="2" fill={INK} />
      <circle cx="24" cy="21" r="2" fill={INK} />
      <circle cx="32" cy="21" r="2" fill={INK} />
    </>
  ),
};

/** Returns the illustration for an answer, or null if it has none. */
export function answerArt(questionId: string, value: string): React.ReactNode | null {
  const art = ART[`${questionId}:${value}`];
  if (!art) return null;
  return (
    <svg viewBox="0 0 48 48" className="size-full" aria-hidden>
      {art}
    </svg>
  );
}
