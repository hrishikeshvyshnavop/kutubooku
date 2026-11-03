// The KutuBooku mascot (mint, hugging a book) peeking up over the footer.
// Figma: Hrishi's Workspace, node 1433:7. There the image (980×389) is masked to a
// 949×368 rectangle from its top-left, which trims the right edge and cuts the bottom
// flat. Here the same crop is an overflow-hidden box with the image scaled up by the
// same ratio (980/949, 389/368), so the art and the cut match at every size.
//
// Place it as the LAST thing in a page's <main> (flush with its bottom edge): the flat
// cut then sits right on the edge the page lifts off the footer from, so it looks like
// the mascot is peeking over the footer. `className` sets the strip's background so it
// matches the section above.
// Idle life (breathing, a peek when you stop scrolling, a wiggle on hover): FooterMascotMotion.

import Image from "next/image";
import { FooterMascotMotion } from "./FooterMascotMotion";

export function FooterMascot({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`flex justify-center ${className}`}>
      {/* Clips only the bottom edge (the flat cut), so the idle hop never crops the sprout on top. */}
      <div className="relative aspect-[949/368] w-[clamp(300px,46vw,760px)] [clip-path:inset(-40%_-20%_0_-20%)]">
        <FooterMascotMotion>
          <Image
            src="/brand/mascot/kutu-peek.png"
            alt=""
            width={1991}
            height={790}
            sizes="(min-width: 1652px) 785px, 48vw"
            className="absolute left-0 top-0 h-[105.71%] w-[103.27%] max-w-none select-none"
            draggable={false}
          />
        </FooterMascotMotion>
      </div>
    </div>
  );
}
