"use client";

// A <Link> that prefetches on intent (pointer over it, keyboard focus, touch) instead of when it
// scrolls into view. For long lists of book links (cards, collections, the box): prefetching every
// card that scrolled past made the browser parse a book page's data on the main thread mid-scroll,
// which showed as scroll stutter (frames of up to 0.6s). Pattern from the Next.js docs
// ("prefetch only on hover"); the page still loads ahead of the click.

import Link from "next/link";
import { useState } from "react";

export function IntentLink({ onPointerEnter, onFocus, onTouchStart, ...props }: React.ComponentProps<typeof Link>) {
  const [intent, setIntent] = useState(false);
  return (
    <Link
      {...props}
      prefetch={intent ? null : false}
      onPointerEnter={(e) => {
        setIntent(true);
        onPointerEnter?.(e);
      }}
      onFocus={(e) => {
        setIntent(true);
        onFocus?.(e);
      }}
      onTouchStart={(e) => {
        setIntent(true);
        onTouchStart?.(e);
      }}
    />
  );
}
