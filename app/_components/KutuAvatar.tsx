"use client";

// The KutuBooku AI assistant's face: the same flat book worm clip as the header logo (Figma's
// blinking clip, cropped to head + book), in a peach circle. Always plays (it glances around and
// blinks; MascotVideo, transparent, paused off screen). Used wherever the AI speaks or works (hero chat, AI summaries, curation),
// in place of the generic sparkle icon.
// `thinking`: a gentle reading wiggle (bob + tilt) while the AI works. Driven by the
// Web Animations API, so it needs no global CSS. Off with reduced motion.

import { useEffect, useRef } from "react";
import { MascotVideo } from "./MascotVideo";

export function KutuAvatar({
  size = 36,
  thinking = false,
  className = "",
}: {
  /** Diameter in px. */
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
          // a touch larger than the circle and nudged down, so the face fills it and the sprout shows on top
          className="size-full translate-y-[6%] scale-[1.08] object-cover"
        />
      </span>
    </span>
  );
}
