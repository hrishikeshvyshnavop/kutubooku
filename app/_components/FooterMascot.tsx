"use client";

// The KutuBooku book worm (mint, hugging a book) peeking up over the footer, as a short looping
// video: it glances around and blinks. Figma: Kutubooku Website, "Section / Final CTA / Personalized
// Book Box" (node 1362:24), exported as MP4 and cropped to the mascot (1160×800 from the 2× export, ~130 KB).
//
// Place it as the LAST thing in a page's <main> (flush with its bottom edge): the video's flat
// bottom cut sits on the edge the page lifts off the footer from, so it peeks over the footer.
// `className` sets the strip's background so it matches the section above.
//
// The video's background is white; mix-blend-multiply drops it into the strip's colour (no
// alpha video needed). Don't put clip-path / isolation / opacity between the video and the strip:
// they isolate the blend and the white box comes back.
// Loads and plays only once on screen (preload="none"), pauses off screen. Reduced motion: the
// still first frame (poster) instead.

import { useEffect, useRef } from "react";

export function FooterMascot({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    // Reduced motion: never played, so the poster stays (and preload="none" fetches nothing).
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {}); // autoplay blocked: the poster stays
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
