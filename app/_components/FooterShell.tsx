"use client";

import { useEffect, useRef, useState } from "react";

export function FooterShell({ className = "", children, ...rest }: React.ComponentProps<"footer">) {
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
