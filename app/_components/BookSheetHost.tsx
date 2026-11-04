"use client";

// Mounted once in the root layout. Shows the book sheet when the URL has ?book=<id>, and turns
// clicks on plain /books/<id> links anywhere in the app into the sheet (see app/_lib/book-sheet.ts).
// Hovering, focusing or touching a book link warms the sheet's code and the cover image.

import { usePathname, useSearchParams } from "next/navigation";
import { lazy, Suspense, useEffect, useRef } from "react";
import { MOCK_BOOKS } from "../_data/curation-mock";
import { BOOK_PARAM, bookIdFromHref, closeBook, loadedSheetContent, onSheetHistory, openBook, preloadCover, preloadSheet } from "../_lib/book-sheet";
import { BookSheet } from "./BookSheet";

const LazyContent = lazy(() => import("./BookSheetContent"));

/** The sheet's content: rendered directly once its code is loaded (idle or hover), so opening
 *  never waits; lazy (with a fallback) only if someone is faster than the preload. */
function SheetContent({ id }: { id: string }) {
  const Loaded = loadedSheetContent();
  // eslint-disable-next-line react-hooks/static-components -- a module-level component, loaded once and never recreated
  return Loaded ? <Loaded id={id} /> : <LazyContent id={id} />;
}

const COVERS = new Map(MOCK_BOOKS.map((b) => [b.id, b.cover]));

function warm(id: string | null) {
  if (!id) return;
  preloadSheet();
  const cover = COVERS.get(id);
  if (cover) preloadCover(cover);
}

export function BookSheetHost() {
  const params = useSearchParams();
  const pathname = usePathname();
  const id = params.get(BOOK_PARAM);

  // Tell the page when the sheet has closed, so it can put things back (e.g. the hero's lifted book).
  const wasOpen = useRef(false);
  useEffect(() => {
    if (id) wasOpen.current = true;
    else if (wasOpen.current) {
      wasOpen.current = false;
      window.dispatchEvent(new Event("kb:book-sheet-closed"));
    }
  }, [id]);

  // Load the sheet's code once the page is idle, so the first click opens it without waiting.
  useEffect(() => {
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    ric(() => preloadSheet());
  }, []);

  useEffect(() => {
    const linkOf = (e: Event) => (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;

    // Capture phase on window: runs before Next's <Link> handler, so the link opens the sheet instead.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = linkOf(e);
      if (!a || (a.target && a.target !== "_self")) return;
      const bookId = bookIdFromHref(a.getAttribute("href"));
      if (!bookId) return;
      e.preventDefault();
      e.stopPropagation();
      openBook(bookId, a);
    };
    const onWarm = (e: Event) => warm(bookIdFromHref(linkOf(e)?.getAttribute("href") ?? null));
    const onPop = () => onSheetHistory(new URL(window.location.href).searchParams.has(BOOK_PARAM));

    window.addEventListener("click", onClick, true);
    window.addEventListener("pointerover", onWarm, { passive: true });
    window.addEventListener("focusin", onWarm);
    window.addEventListener("touchstart", onWarm, { passive: true });
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("pointerover", onWarm);
      window.removeEventListener("focusin", onWarm);
      window.removeEventListener("touchstart", onWarm);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  // A full book page shows the book already; ?book on it opens "Read more like this" picks.
  if (!id) return null;
  return (
    <BookSheet key={pathname} bookId={id} onClose={closeBook}>
      <Suspense fallback={<div aria-busy className="h-[70vh] bg-[#f4efe6]" />}>
        <SheetContent key={id} id={id} />
      </Suspense>
    </BookSheet>
  );
}
