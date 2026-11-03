// The home hero's background, shared with the footer so the page opens and closes
// on the same surface: brand peach plus a soft white glow (a radial highlight a little
// above the middle, faded in from the top).
// Plain module (no "use client") so both server and client components can import it.

export const HERO_PEACH = "bg-[#FDDAA6]";

/** Put on an absolutely positioned, aria-hidden layer inside a `relative` parent. */
export const HERO_GLOW =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_36%,rgb(255_255_255/0.6),transparent_62%)] [mask-image:linear-gradient(to_bottom,transparent,black_30%)]";
