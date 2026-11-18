export const SECTION_TITLE = "text-balance text-[clamp(44px,4.17vw,80px)] font-bold leading-[0.85] tracking-[-0.02em]";

const EYEBROW =
  "w-fit origin-bottom-left -rotate-3 font-[family-name:var(--font-caveat)] text-[28px] leading-none sm:text-[36px]";
const EYEBROW_TONE = { light: "text-[#3b308f]", dark: "text-[#fbbe63]" } as const;

export function SectionTitle({
  id,
  eyebrow,
  align = "left",
  tone = "light",
  className = "",
  children,
}: {
  tone?: keyof typeof EYEBROW_TONE;
  id: string;
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
