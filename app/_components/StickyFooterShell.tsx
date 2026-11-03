"use client";

// The <footer> element for GlobalFooter, with the "reveal" behaviour:
// it sits underneath the page (z-0) and sticks to the bottom of the screen, so the
// page content (rounded bottom corners, see REVEAL_ABOVE) slides up off it and the
// footer is uncovered from its top edge down.
//
// Only pins when the whole footer fits on screen. A taller footer would be uncovered
// from the middle (its top hidden under the page), which reads as broken, so on
// short screens it just scrolls normally. Until measured (and without JS) it's normal too.

import { useEffect, useRef, useState } from "react";

export function StickyFooterShell({ className = "", children, ...rest }: React.ComponentProps<"footer">) {
  const ref = useRef<HTMLElement>(null);
  const [fits, setFits] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setFits(el.offsetHeight <= window.innerHeight);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <footer ref={ref} className={`z-0 ${fits ? "sticky bottom-0" : "relative"} ${className}`} {...rest}>
      {children}
    </footer>
  );
}
