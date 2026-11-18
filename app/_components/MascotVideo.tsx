"use client";

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
  name: string;
  poster: string;
  width: number;
  height: number;
  play: "always" | "hover";
  active?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<{ url: string; blend: boolean } | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const wk = webkitOnly();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time, browser-only choice
    setSrc({ url: `/brand/mascot/${name}.${wk ? "mp4" : "webm"}`, blend: wk });
  }, [name]);

  useEffect(() => {
    const v = ref.current;
    if (!v || !src || play !== "always") return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()));
    io.observe(v);
    return () => io.disconnect();
  }, [src, play]);

  useEffect(() => {
    const v = ref.current;
    if (!v || !src || play !== "hover") return;
    if (active) {
      v.loop = true;
      v.play().catch(() => {});
      return;
    }
    v.loop = false;
    const rest = () => {
      v.pause();
      v.currentTime = 0;
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
