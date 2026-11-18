"use client";

import { useEffect, useRef } from "react";
import { MascotVideo } from "./MascotVideo";

export function AiAvatar({
  size = 36,
  thinking = false,
  className = "",
}: {
  size?: number;
  thinking?: boolean;
  className?: string;
}) {
  const faceRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = faceRef.current;
    if (!el || !thinking || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const a = el.animate(
      [
        { transform: "translateY(0) rotate(0deg)" },
        { transform: "translateY(-6%) rotate(-7deg)" },
        { transform: "translateY(0) rotate(0deg)" },
        { transform: "translateY(-6%) rotate(7deg)" },
        { transform: "translateY(0) rotate(0deg)" },
      ],
      { duration: 1400, iterations: Infinity, easing: "ease-in-out" },
    );
    return () => a.cancel();
  }, [thinking]);

  return (
    <span
      aria-hidden
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#ffd0b2] ${className}`}
      style={{ width: size, height: size }}
    >
      <span ref={faceRef} className="block size-full origin-bottom">
        <MascotVideo
          name="kutu-chat"
          poster="/brand/mascot/kutu-chat-poster.webp"
          width={192}
          height={192}
          play="always"
          className="size-full translate-y-[6%] scale-[1.08] object-cover"
        />
      </span>
    </span>
  );
}
