// The one section title style for the whole app (decided 2026-11-03):
// a handwritten Caveat label (violet, slightly tilted) above a bold title,
// on the book page's scale (44px on phones up to 80px at 1920px).
// The page must load Caveat (--font-caveat); the home page and the book page do.

export const SECTION_TITLE = "text-balance text-[clamp(44px,4.17vw,80px)] font-bold leading-[0.85] tracking-[-0.02em]";

// w-fit + origin-bottom-left: the tilt pivots on the label's own corner, so it never dips into the title.
const EYEBROW =
  "w-fit origin-bottom-left -rotate-3 font-[family-name:var(--font-caveat)] text-[28px] leading-none sm:text-[36px]";
// Label colour: violet on light backgrounds, amber on dark ones (the footer).
const EYEBROW_TONE = { light: "text-[#3b308f]", dark: "text-[#fbbe63]" } as const;

export function SectionTitle({
  id,
  eyebrow,
  align = "left",
  tone = "light",
  className = "",
  children,
}: {
  /** Background the title sits on. */
  tone?: keyof typeof EYEBROW_TONE;
  /** id of the h2, for the section's aria-labelledby. */
  id: string;
  /** Handwritten label above the title. */
  eyebrow?: string;
  align?: "left" | "center";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col ${align === "center" ? "items-center text-center" : "items-start"} ${className}`}>
      {eyebrow && <p className={`${EYEBROW} ${EYEBROW_TONE[tone]}`}>{eyebrow}</p>}
      <h2 id={id} className={`${SECTION_TITLE} ${eyebrow ? "mt-3 sm:mt-4" : ""}`}>
        {children}
      </h2>
    </div>
  );
}
