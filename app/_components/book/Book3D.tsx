import Image from "next/image";
import { memo } from "react";

export type Book3DData = { src: string; title: string; ratio: number; spine: string };
export type Tilt = { rx: number; ry: number; rz: number };

export const BOOKS: Book3DData[] = [
  { src: "/covers/the-dot.jpg", title: "The Dot", ratio: 0.995, spine: "#e8553a" },
  { src: "/covers/lost-and-found.jpg", title: "Lost and Found", ratio: 0.983, spine: "#2f9e8f" },
  { src: "/covers/the-magical-yet.jpg", title: "The Magical Yet", ratio: 1, spine: "#5b4a8b" },
  { src: "/covers/jabari-jumps.jpg", title: "Jabari Jumps", ratio: 0.861, spine: "#3e9fb8" },
  { src: "/covers/the-color-monster.jpg", title: "The Color Monster", ratio: 1.004, spine: "#f1a903" },
  { src: "/covers/after-the-fall.jpg", title: "After the Fall", ratio: 0.778, spine: "#3b6e8f" },
  { src: "/covers/i-am-human.jpg", title: "I Am Human", ratio: 1, spine: "#c2237f" },
  { src: "/covers/the-rabbit-listened.jpg", title: "The Rabbit Listened", ratio: 1, spine: "#7fc3cf" },
  { src: "/covers/the-heart-and-the-bottle.jpg", title: "The Heart and the Bottle", ratio: 0.959, spine: "#e9c21a" },
  { src: "/covers/the-invisible-boy.jpg", title: "The Invisible Boy", ratio: 0.809, spine: "#8aa6b8" },
  { src: "/covers/the-wonderful-things-you-will-be.jpg", title: "The Wonderful Things You Will Be", ratio: 0.952, spine: "#2f7f86" },
  { src: "/covers/when-sadness-is-at-your-door.jpg", title: "When Sadness Is at Your Door", ratio: 0.908, spine: "#4fa98a" },
  { src: "/covers/you-choose.jpg", title: "You Choose", ratio: 0.869, spine: "#d6312b" },
  { src: "/covers/the-bad-seed.jpg", title: "The Bad Seed", ratio: 1, spine: "#7a5a3a" },
  { src: "/covers/the-most-magnificent-thing.jpg", title: "The Most Magnificent Thing", ratio: 1, spine: "#e0782c" },
];

export const TILTS: Tilt[] = [
  { rx: 10, ry: 22, rz: 6 },
  { rx: 6, ry: -16, rz: -3 },
  { rx: 12, ry: 14, rz: 4 },
  { rx: 4, ry: -24, rz: -5 },
];

const BY_COVER = new Map(BOOKS.map((b) => [b.src, b]));

export function book3DFor(cover: string, title: string, fallbackSpine: string): Book3DData {
  return BY_COVER.get(cover) ?? { src: cover, title, ratio: 1, spine: fallbackSpine };
}

const FACE = "absolute left-1/2 top-1/2 [backface-visibility:hidden]";
const SIDE_PAGES = "repeating-linear-gradient(90deg,#fffaf0 0 2px,#e9e1d1 2px 3px)";
const TOP_PAGES = "repeating-linear-gradient(0deg,#fffaf0 0 2px,#ece4d4 2px 3px)";
const BOTTOM_PAGES = "#d9cfbd";
const COVER_SHINE =
  "pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgb(255_255_255/0.28)_0%,transparent_38%,transparent_70%,rgb(0_0_0/0.14)_100%)]";
const COVER_HINGE = "pointer-events-none absolute inset-y-0 left-0 w-[6%] bg-gradient-to-r from-black/25 to-transparent";
function Ribbon({ color, bow = false }: { color: string; bow?: boolean }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      <span className="absolute inset-y-0 left-[58%] w-[11%] shadow-[0_0_6px_rgb(0_0_0/0.18)]" style={{ background: color }} />
      <span className="absolute inset-x-0 top-[44%] h-[11%] shadow-[0_0_6px_rgb(0_0_0/0.18)]" style={{ background: color }} />
      {bow && (
        <svg viewBox="0 0 120 80" className="absolute left-[63.5%] top-[49.5%] w-[46%] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_4px_6px_rgb(0_0_0/0.25)]">
          <path d="M60 40 C40 8 6 10 10 34 C13 52 40 50 60 40Z" fill={color} />
          <path d="M60 40 C80 8 114 10 110 34 C107 52 80 50 60 40Z" fill={color} />
          <path d="M60 40 L42 76 L50 74 L56 78 Z M60 40 L78 76 L70 74 L64 78 Z" fill={color} />
          <path d="M60 40 C46 22 22 20 22 33 M60 40 C74 22 98 20 98 33" stroke="rgb(0 0 0/0.18)" strokeWidth="3" fill="none" />
          <circle cx="60" cy="40" r="9" fill={color} stroke="rgb(0 0 0/0.2)" strokeWidth="2" />
        </svg>
      )}
    </span>
  );
}

const FOCUS_RING = "pointer-events-none rounded-r-[14px] rounded-l-[9px] shadow-[0_0_0_8px_#fffdf8,0_0_0_16px_#1d2838] transition-opacity duration-200";

function Face({
  width,
  height,
  transform,
  className = "",
  style,
  children,
}: {
  width: number;
  height: number;
  transform: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div className={`${FACE} ${className}`} style={{ width, height, transform: `translate(-50%,-50%) ${transform}`, ...style }}>
      {children}
    </div>
  );
}

type Book3DProps = {
  b: Book3DData;
  i: number;
  height?: number;
  depth?: number;
  tilt?: Tilt;
  focused?: boolean;
  eager?: boolean;
  sizes?: string;
  ribbon?: string;
};

export const Book3D = memo(function Book3D({
  b,
  i,
  height: h = 440,
  depth: d = 38,
  tilt,
  focused = false,
  eager = false,
  sizes = "(min-width: 1536px) 460px, 300px",
  ribbon,
}: Book3DProps) {
  const w = Math.round(h * b.ratio);
  const t = tilt ?? TILTS[i % TILTS.length];
  const rotation = `rotateX(${t.rx}deg) rotateY(${t.ry}deg) rotateZ(${t.rz}deg)`;

  return (
    <div
      data-book3d
      className="relative [transform-style:preserve-3d] motion-safe:animate-[book-float_var(--dur)_ease-in-out_infinite]"
      style={
        {
          width: w,
          height: h,
          "--dur": `${9 + (i % 4) * 1.3}s`,
          "--rx0": `${t.rx}deg`,
          "--ry0": `${t.ry}deg`,
          "--rz0": `${t.rz}deg`,
          animationDelay: `-${(i % 5) * 1.7}s`,
          transform: rotation,
        } as React.CSSProperties
      }
    >
      <Face width={w} height={h} transform={`translateZ(${d / 2}px)`} className="overflow-hidden rounded-r-[8px] rounded-l-[3px]">
        <Image
          src={b.src}
          alt=""
          fill
          sizes={sizes}
          draggable={false}
          className="object-cover [-webkit-user-drag:none]"
          {...(eager && { loading: "eager", fetchPriority: "high" })}
        />
        <span className={COVER_SHINE} />
        <span className={COVER_HINGE} />
        {ribbon && <Ribbon color={ribbon} bow />}
      </Face>

      <Face
        width={w}
        height={h}
        transform={`translateZ(${d / 2 + 1}px)`}
        className={`${FOCUS_RING} ${focused ? "opacity-100" : "opacity-0"}`}
      />

      <Face
        width={w}
        height={h}
        transform={`rotateY(180deg) translateZ(${d / 2}px)`}
        className="rounded-l-[8px] rounded-r-[3px]"
        style={{ background: b.spine, filter: "brightness(0.8)" }}
      >
        {ribbon && <Ribbon color={ribbon} />}
      </Face>

      <Face
        width={d}
        height={h}
        transform={`rotateY(-90deg) translateZ(${w / 2}px)`}
        className="grid place-items-center overflow-hidden"
        style={{ background: `linear-gradient(90deg, ${b.spine}, color-mix(in srgb, ${b.spine} 70%, #000))` }}
      >
        <span className="rotate-180 whitespace-nowrap text-[12px] font-semibold uppercase tracking-[0.12em] text-white/85 [writing-mode:vertical-rl]">
          {b.title}
        </span>
      </Face>

      <Face width={d} height={h - 6} transform={`rotateY(90deg) translateZ(${w / 2 - 2}px)`} style={{ background: SIDE_PAGES }} />
      <Face width={w - 4} height={d} transform={`rotateX(90deg) translateZ(${h / 2 - 2}px)`} style={{ background: TOP_PAGES }} />
      <Face width={w - 4} height={d} transform={`rotateX(-90deg) translateZ(${h / 2 - 2}px)`} style={{ background: BOTTOM_PAGES }} />
    </div>
  );
});
