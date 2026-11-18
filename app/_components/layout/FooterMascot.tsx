"use client";

import { useEffect, useRef } from "react";

export function FooterMascot({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <div aria-hidden className={`flex justify-center ${className}`}>
      <video
        ref={ref}
        className="block aspect-[580/400] w-[clamp(300px,36vw,640px)] select-none mix-blend-multiply"
        width={1160}
        height={800}
        poster="/brand/mascot/kutu-peek-poster.webp"
        src="/brand/mascot/kutu-peek.mp4"
        muted
        loop
        playsInline
        preload="none"
        disablePictureInPicture
        tabIndex={-1}
      />
    </div>
  );
}
