import type { EditionArt } from "../_data/editions";

/**
 * Original illustrated cover art for each monthly Edition, built from CSS/SVG
 * so there are no image assets to license. Replace with commissioned art later.
 */
export function EditionCover({ art, title }: { art: EditionArt; title: string }) {
  return (
    <div className="@container relative size-full overflow-hidden" aria-hidden>
      {covers[art](title)}
    </div>
  );
}

function Stars({ count, seed, className = "bg-white" }: { count: number; seed: number; className?: string }) {
  // Deterministic pseudo-random positions so server and client render match.
  const dots = Array.from({ length: count }, (_, i) => {
    const x = ((i * 37 + seed * 13) % 97) + 1;
    const y = ((i * 53 + seed * 29) % 95) + 2;
    const s = (i % 3) + 1;
    return { x, y, s };
  });
  return (
    <>
      {dots.map((d, i) => (
        <span
          key={i}
          className={`absolute rounded-full ${className}`}
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.s * 2, height: d.s * 2 }}
        />
      ))}
    </>
  );
}

const covers: Record<EditionArt, (title: string) => React.ReactNode> = {
  starry: (title) => (
    <div className="size-full bg-[#1b2fd8]">
      <Stars count={28} seed={3} />
      <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M58 22 L72 40 L66 62 L84 76" stroke="white" strokeOpacity=".5" strokeWidth=".4" fill="none" />
      </svg>
      <p className="absolute bottom-3 left-2 origin-bottom-left font-anton text-[17.5cqw] leading-none whitespace-nowrap text-white" style={{ transform: "rotate(-90deg) translateY(100%)" }}>
        {title}
      </p>
      <span className="absolute right-[8%] top-[8%] grid w-[30%] aspect-square place-items-center rounded-full bg-[conic-gradient(from_0deg,#ffd6f5,#c9f0ff,#fff3c4,#ffd6f5)] text-center font-sans text-[6.1cqw] font-extrabold uppercase leading-tight text-[#1b2fd8] shadow-md rotate-12">
        This
        <br />
        month
      </span>
    </div>
  ),

  monsoon: (title) => (
    <div className="size-full bg-gradient-to-b from-[#0f5c5a] via-[#1d8a6d] to-[#6cc08b]">
      <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {Array.from({ length: 22 }, (_, i) => (
          <line key={i} x1={(i * 9) % 100} y1={(i * 17) % 60} x2={((i * 9) % 100) - 4} y2={((i * 17) % 60) + 14} stroke="#d8fff0" strokeOpacity=".55" strokeWidth=".6" />
        ))}
        <path d="M0 82 Q25 72 50 82 T100 80 V100 H0Z" fill="#0b3f3d" opacity=".6" />
      </svg>
      <p className="absolute inset-x-0 top-[42%] text-center font-display text-[19.8cqw] italic text-white drop-shadow">
        {title}
      </p>
    </div>
  ),

  explorers: (title) => (
    <div className="size-full bg-[#f6b42c]">
      <svg className="absolute inset-0 size-full" viewBox="0 0 100 100">
        <path d="M12 82 C30 60, 20 40, 45 42 S70 20, 86 16" stroke="#1d2838" strokeWidth="1.4" strokeDasharray="3 3" fill="none" />
        <circle cx="12" cy="82" r="3" fill="#e5634a" />
        <path d="M84 10 l4 8 h-8z" fill="#e5634a" />
        <circle cx="70" cy="70" r="12" fill="none" stroke="#1d2838" strokeWidth="1.2" />
        <path d="M70 60 L72 70 L70 80 L68 70Z" fill="#1d2838" />
      </svg>
      <p className="absolute left-[7%] top-[7%] max-w-[70%] font-anton text-[21.3cqw] uppercase leading-[0.95] text-[#1d2838]">
        {title}
      </p>
    </div>
  ),

  feelings: (title) => (
    <div className="size-full bg-gradient-to-br from-[#ffb3a1] via-[#f47c8a] to-[#b45ad6]">
      <span className="absolute left-[10%] top-[18%] w-[36%] aspect-square rounded-full bg-[#ffe066]/90" />
      <span className="absolute right-[8%] top-[30%] w-[28%] aspect-square rounded-full bg-[#7fd6ff]/80" />
      <span className="absolute bottom-[10%] left-[30%] w-[32%] aspect-square rounded-full bg-white/50" />
      <p className="absolute inset-x-0 bottom-[12%] text-center font-script text-[25.8cqw] leading-none text-white drop-shadow-md">
        {title}
      </p>
    </div>
  ),

  dino: (title) => (
    <div className="size-full bg-[#e9f5d0]">
      <svg className="absolute inset-x-0 bottom-0 h-[70%] w-full" viewBox="0 0 100 70" preserveAspectRatio="xMidYMax meet">
        <path d="M8 62 C10 40, 30 32, 48 36 C58 20, 70 14, 80 18 C88 20, 90 28, 84 30 C78 31, 74 30, 70 34 C76 44, 74 56, 70 62 L64 62 L62 52 L46 52 L44 62 L38 62 L36 50 C26 52, 16 58, 8 62Z" fill="#2e7a58" />
        {[30, 40, 50, 60].map((x, i) => (
          <path key={x} d={`M${x} ${36 - i * 3} l4 -8 l4 8z`} fill="#f4a836" />
        ))}
        <circle cx="80" cy="22" r="1.4" fill="#e9f5d0" />
        <rect x="0" y="62" width="100" height="8" fill="#1d2838" />
      </svg>
      <p className="absolute left-[7%] top-[7%] font-anton text-[25.8cqw] uppercase leading-none text-[#1d2838]">
        {title}
      </p>
    </div>
  ),

  myths: (title) => (
    <div className="size-full bg-[#3b1d4f]">
      <span className="absolute left-1/2 top-[30%] w-[38%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-[#ffd36b] to-[#e8902a] shadow-[0_0_60px_10px_rgba(255,190,80,0.45)]" />
      <svg className="absolute inset-x-0 bottom-0 h-1/2 w-full" viewBox="0 0 100 50" preserveAspectRatio="none">
        <path d="M0 30 L20 12 L34 26 L52 6 L70 28 L84 16 L100 30 V50 H0Z" fill="#1e0f2b" />
      </svg>
      <p className="absolute inset-x-0 bottom-[8%] text-center font-display text-[12.2cqw] font-semibold tracking-[0.12em] text-[#ffd36b] uppercase">
        {title}
      </p>
    </div>
  ),

  mystery: (title) => (
    <div className="size-full bg-[#f2f0ea]">
      <div className="absolute inset-[7%] flex flex-col border-2 border-[#1d2838] bg-white">
        <p className="border-b-2 border-[#1d2838] px-2 py-1 font-mono text-[8.4cqw] text-[#1d2838]">
          {title}
        </p>
        <div className="relative flex-1 bg-[#1d2838]">
          <span className="absolute left-[30%] top-[14%] w-[36%] aspect-square rounded-full border-[6px] border-[#f4a836] bg-[#f4a836]/20" />
          <span className="absolute left-[58%] top-[48%] h-[8%] w-[26%] origin-left rotate-45 rounded-full bg-[#f4a836]" />
          <span className="absolute bottom-2 left-2 font-mono text-[5cqw] text-white/60">CASE NO. 05</span>
        </div>
      </div>
    </div>
  ),

  words: (title) => (
    <div className="size-full bg-[#fffaf0]">
      {[
        ["A", "8%", "6%", "#e5634a", "-12deg"],
        ["b", "72%", "4%", "#5687d1", "10deg"],
        ["C", "74%", "66%", "#2e7a58", "-6deg"],
        ["?", "12%", "64%", "#76508a", "14deg"],
        ["z", "44%", "72%", "#f4a836", "-18deg"],
      ].map(([ch, x, y, c, r]) => (
        <span key={ch} className="absolute font-display text-[27.4cqw] font-bold" style={{ left: x, top: y, color: c, rotate: r }}>
          {ch}
        </span>
      ))}
      <p className="absolute inset-x-0 top-[40%] text-center font-sans text-[16.7cqw] font-black uppercase tracking-tight text-[#1d2838]">
        {title}
      </p>
    </div>
  ),

  wild: (title) => (
    <div className="size-full bg-[#ff8a1f]">
      <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[10, 26, 44, 62, 80].map((x, i) => (
          <path key={x} d={`M${x} 0 C${x + 8} 30, ${x - 6} 60, ${x + 4} 100`} stroke="#1d2838" strokeWidth={4 - (i % 2)} fill="none" />
        ))}
      </svg>
      <p className="absolute inset-x-[6%] bottom-[8%] bg-[#1d2838] px-2 py-1 text-center font-anton text-[18.2cqw] uppercase text-[#ff8a1f]">
        {title}
      </p>
    </div>
  ),

  chapters: (title) => (
    <div className="size-full bg-gradient-to-b from-[#cfe3ff] to-[#9cc3f5]">
      <div className="absolute inset-x-[18%] bottom-[8%] space-y-1">
        {["#e5634a", "#2e7a58", "#f4a836", "#76508a", "#1d2838"].map((c, i) => (
          <span key={c} className="block h-[5cqw] rounded-sm" style={{ background: c, marginLeft: `${(i % 2) * 8}%`, width: `${90 - i * 6}%` }} />
        ))}
      </div>
      <p className="absolute left-[8%] top-[8%] font-display text-[16.0cqw] font-semibold leading-tight text-[#1d2838]">
        {title}
      </p>
    </div>
  ),
};
