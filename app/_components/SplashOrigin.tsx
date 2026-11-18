"use client";

import { useEffect } from "react";

export function SplashOrigin() {
  useEffect(() => {
    const root = document.documentElement.style;
    const onDown = (e: PointerEvent) => {
      root.setProperty("--pt-x", `${e.clientX}px`);
      root.setProperty("--pt-y", `${e.clientY}px`);
    };
    const onKey = () => {
      root.removeProperty("--pt-x");
      root.removeProperty("--pt-y");
    };
    window.addEventListener("pointerdown", onDown, { capture: true, passive: true });
    window.addEventListener("keydown", onKey, { capture: true, passive: true });
    return () => {
      window.removeEventListener("pointerdown", onDown, { capture: true });
      window.removeEventListener("keydown", onKey, { capture: true });
    };
  }, []);
  return null;
}
