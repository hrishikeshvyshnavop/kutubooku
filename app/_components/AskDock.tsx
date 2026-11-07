"use client";

// The home hero's "Ask KutuBooku AI" box, kept on hand down the whole home page.
// - In the hero: exactly where it always was (the hero fills the screen below the header, so its
//   bottom is the screen's bottom), suggestions above it.
// - Once the sections below start sliding over the hero: it floats over them, pinned to the
//   bottom of the screen, as just the pill (no suggestions) with a soft shadow. It slides down out
//   of the way while the page scrolls and comes back once scrolling stops.
// - Stays put while you're using it (typing, focused, or the chat card open), and steps aside
//   for the footer at the end of the page.
// Rendered in a portal on <body>: the hero is a sticky layer under the later sections, so
// anything inside it can't float above them. A placeholder keeps the hero's layout unchanged.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { HeroAsk } from "./HeroAsk";

const SETTLE_MS = 450; // scroll quiet this long = stopped
const noop = () => () => {};

export function AskDock({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const client = useSyncExternalStore(noop, () => true, () => false);
  const slotRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const [docked, setDocked] = useState(false); // floating over the later sections
  const openRef = useRef(false);

  const handleOpen = useCallback(
    (o: boolean) => {
      openRef.current = o;
      onOpenChange?.(o);
    },
    [onOpenChange],
  );

  useEffect(() => {
    const slot = slotRef.current;
    const dock = dockRef.current;
    if (!client || !slot || !dock) return;
    // The placeholder holds the bar's height (suggestions + pill), so the carousel keeps its size.
    const bar = dock.firstElementChild as HTMLElement;
    const ro = new ResizeObserver(() => {
      if (!dock.dataset.docked) slot.style.height = `${bar.offsetHeight}px`;
    });
    ro.observe(bar);

    const cover = document.querySelector<HTMLElement>("[data-covers-hero]");
    const main = dock.ownerDocument.querySelector("main");
    let raf = 0;
    let settle = 0;
    let wasDocked = false;
    const engaged = () => openRef.current || dock.matches(":focus-within") || !!dock.querySelector<HTMLInputElement>("input")?.value;
    const setHidden = (h: boolean) => {
      if (h) dock.dataset.hidden = "";
      else delete dock.dataset.hidden;
    };
    const update = (scrolling: boolean) => {
      const vh = window.innerHeight;
      const isDocked = !!cover && cover.getBoundingClientRect().top < vh - 4;
      if (isDocked !== wasDocked) {
        wasDocked = isDocked;
        if (isDocked) dock.dataset.docked = "";
        else delete dock.dataset.docked;
        setDocked(isDocked);
      }
      // End of the page: the footer slides out from under <main>; don't sit on it.
      const atFooter = !!main && main.getBoundingClientRect().bottom < vh - 4;
      setHidden(atFooter || (isDocked && scrolling && !engaged()));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => update(true));
      clearTimeout(settle);
      settle = window.setTimeout(() => update(false), SETTLE_MS);
    };
    update(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(settle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [client]);

  const ask = <HeroAsk onOpenChange={handleOpen} docked={docked} />;

  return (
    <>
      {/* In the hero: the bar itself before hydration, then a same-height placeholder. */}
      <div ref={slotRef} className="relative z-20 flex-none px-page pb-6 sm:pb-10">
        {!client && ask}
      </div>
      {client &&
        createPortal(
          <div
            ref={dockRef}
            data-toast-avoid
            // pointer-events-none on the full-width strip; the bar inside takes clicks.
            className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-page pb-6 transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[hidden]:pointer-events-none data-[hidden]:translate-y-[calc(100%+16px)] data-[hidden]:opacity-0 motion-reduce:transition-none sm:pb-10 [&[data-hidden]_*]:!pointer-events-none"
          >
            <div className="pointer-events-auto mx-auto w-full max-w-[760px]">{ask}</div>
          </div>,
          document.body,
        )}
    </>
  );
}
