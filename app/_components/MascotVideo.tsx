"use client";

// A short looping mascot clip with a transparent background (the header logo's book worm, the AI
// avatar). Sources, from Figma, in public/brand/mascot/<name>.{webm,mp4} + a still poster:
// - .webm: VP9 with alpha, for Chrome / Edge / Firefox.
// - .mp4: same clip on white, for Safari and every iOS browser (WebKit can't show WebM alpha);
//   mix-blend-multiply drops the white into whatever is behind it.
// The source is chosen after mount, so the server HTML is just the poster (no layout shift).
// play="always": loops while on screen (paused off screen). play="hover": still until `active`,
// then plays; when `active` ends it finishes the current loop and rests on the first frame.
// Reduced motion: the poster only.

import { useEffect, useRef, useState } from "react";

const webkitOnly = () => {
  const ua = navigator.userAgent;
  return /iP(hone|ad|od)/.test(ua) || (/Safari/.test(ua) && !/Chrome|Chromium|Edg|Android|Firefox/.test(ua));
};

export function MascotVideo({
  name,
  poster,
  width,
  height,
  play,
  active = false,
  className = "",
}: {
  /** File name in public/brand/mascot, without extension. */
  name: string;
  poster: string;
  width: number;
  height: number;
  play: "always" | "hover";
  /** play="hover": whether the hover / focus target is active. */
  active?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<{ url: string; blend: boolean } | null>(null);

  // Pick the source once mounted (needs the user agent); never with reduced motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const wk = webkitOnly();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time, browser-only choice
    setSrc({ url: `/brand/mascot/${name}.${wk ? "mp4" : "webm"}`, blend: wk });
  }, [name]);

  // Always: loop while on screen.
  useEffect(() => {
    const v = ref.current;
    if (!v || !src || play !== "always") return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()));
    io.observe(v);
    return () => io.disconnect();
  }, [src, play]);

  // Hover: play while active; afterwards finish the loop and rest on the first frame.
  useEffect(() => {
    const v = ref.current;
    if (!v || !src || play !== "hover") return;
    if (active) {
      v.loop = true;
      v.play().catch(() => {});
      return;
    }
    v.loop = false; // let the current loop run out…
    const rest = () => {
      v.pause();
      v.currentTime = 0; // …then back to the still
    };
    if (v.paused) rest();
    v.addEventListener("ended", rest, { once: true });
    return () => v.removeEventListener("ended", rest);
  }, [active, src, play]);

  return (
    <video
      ref={ref}
      aria-hidden
      tabIndex={-1}
      width={width}
      height={height}
      poster={poster}
      src={src?.url}
      muted
      playsInline
      loop={play === "always"}
      preload={play === "always" ? "auto" : "metadata"}
      disablePictureInPicture
      className={`select-none ${src?.blend ? "mix-blend-multiply" : ""} ${className}`}
    />
  );
}
