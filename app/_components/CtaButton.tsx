import Image from "next/image";
import Link from "next/link";

const TONES = {
  amber: { block: "bg-[#f9a220] text-black group-hover:bg-[#e8900c]", arrow: "/icons/arrow-right.svg" },
  violet: { block: "bg-[#9a83de] text-white group-hover:bg-[#8670cc]", arrow: "/icons/arrow-right-white.svg" },
} as const;

type CtaButtonProps = {
  href: string;
  label: React.ReactNode;
  className?: string;
  tone?: keyof typeof TONES;
  newTab?: boolean;
};

export function CtaButton({ href, label, className = "", tone = "amber", newTab = false }: CtaButtonProps) {
  const { block, arrow } = TONES[tone];

  return (
    <Link
      href={href}
      {...(newTab && { target: "_blank", rel: "sponsored noopener" })}
      className={`group flex h-14 items-stretch gap-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${className}`}
    >
      <span
        className={`flex flex-1 items-center justify-center whitespace-nowrap rounded-lg px-5 text-xl font-bold leading-none tracking-[-0.48px] transition-colors ${block}`}
      >
        {label}
      </span>
      <span className={`grid w-14 shrink-0 place-items-center rounded-lg transition-colors ${block}`}>
        <Image src={arrow} alt="" width={18.6562} height={16} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
