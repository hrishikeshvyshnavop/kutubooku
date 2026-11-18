import { HOME_FAQ, type Faq as FaqItem } from "../_data/faq";
import { Button } from "./Button";
import { SectionTitle } from "./SectionTitle";

type FaqProps = {
  items?: FaqItem[];
  id?: string;
  eyebrow?: string;
  title?: string;
  intro?: string;
  cta?: { href: string; label: string };
};

const ITEM =
  "group rounded-[24px] bg-[#f4eee3] transition-[background-color,border-radius] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#efe6d6] open:rounded-[32px] open:bg-[#f1a903] open:hover:bg-[#f1a903] motion-reduce:transition-none [interpolate-size:allow-keywords] [&::details-content]:h-0 [&::details-content]:overflow-hidden [&::details-content]:transition-[height,content-visibility] [&::details-content]:duration-300 [&::details-content]:[transition-behavior:allow-discrete] open:[&::details-content]:h-auto";

export function Faq({
  items = HOME_FAQ,
  id = "faq",
  eyebrow = "Good to know",
  title = "Questions parents ask us",
  intro = "Everything about how KutuBooku picks books for your child, and how buying them works.",
  cta = { href: "/reading-preferences", label: "Find books for my child" },
}: FaqProps) {
  const titleId = `${id}-title`;

  return (
    <section id={id} tabIndex={-1} aria-labelledby={titleId} className="relative z-10 bg-[#fffdf8] outline-none">
      <div className="mx-auto grid w-full max-w-[1920px] gap-10 px-page pb-24 pt-20 sm:pb-32 sm:pt-28 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-[6vw]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionTitle id={titleId} eyebrow={eyebrow}>
            {title}
          </SectionTitle>
          <p className="mt-4 max-w-[36ch] type-body-lg text-[#1d2838]/70">{intro}</p>
          <Button href={cta.href} variant="primary" arrow="right" className="mt-8">
            {cta.label}
          </Button>
        </div>

        <ul className="flex flex-col gap-2">
          {items.map((f, i) => (
            <li key={f.q}>
              <details name={`${id}-questions`} open={i === 0} className={ITEM}>
                <summary className="flex cursor-pointer list-none items-center gap-4 rounded-[inherit] px-5 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838] sm:gap-6 sm:px-7 sm:py-6 [&::-webkit-details-marker]:hidden">
                  <span aria-hidden className="w-7 shrink-0 type-label tabular-nums text-[#1d2838]/50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="flex-1 type-title-sm sm:text-[22px]">{f.q}</h3>
                  <PlusIcon />
                </summary>
                <p className="max-w-[60ch] px-5 pb-6 pl-[calc(1.25rem+1.75rem+1rem)] type-body text-[#1d2838]/85 sm:px-7 sm:pb-7 sm:pl-[calc(1.75rem+1.75rem+1.5rem)]">
                  {f.a}
                </p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PlusIcon() {
  return (
    <span
      aria-hidden
      className="grid size-10 shrink-0 place-items-center rounded-full bg-[#fffdf8] text-[#1d2838] transition-colors duration-300 group-hover:bg-white group-open:bg-[#1d2838] group-open:text-white"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M5 12h14" />
        <path
          d="M12 5v14"
          className="origin-center transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:scale-y-0 motion-reduce:transition-none"
        />
      </svg>
    </span>
  );
}
