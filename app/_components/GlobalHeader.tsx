// The one header for every page: the home page header (logo, pill nav, Log-in / Sign-up),
// sticky, sliding away while scrolling down and back on any scroll up.
// Pages only choose the strip's background so it blends with their own.

import { HideOnScroll } from "./HideOnScroll";
import { HomeHeader } from "./HomeHeader";

export function GlobalHeader({ background = "bg-[#FDDAA6]" }: { background?: string }) {
  return (
    <HideOnScroll className={`z-40 ${background}`}>
      <HomeHeader />
    </HideOnScroll>
  );
}
