"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { lazy, Suspense, useEffect, useRef } from "react";
import { MOCK_BOOKS } from "../../_data/curation-mock";
import { BOOK_PARAM, bookIdFromHref, closeBook, loadedSheetContent, onSheetHistory, openBook, preloadCover, preloadSheet } from "../../_lib/book-sheet";
import { BookSheet } from "./BookSheet";

const LazyContent = lazy(() => import("./BookSheetContent"));

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

  const wasOpen = useRef(false);
  useEffect(() => {
    if (id) wasOpen.current = true;
    else if (wasOpen.current) {
      wasOpen.current = false;
      window.dispatchEvent(new Event("kb:book-sheet-closed"));
    }
  }, [id]);

  useEffect(() => {
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    ric(() => preloadSheet());
  }, []);

  useEffect(() => {
    const linkOf = (e: Event) => (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;

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

  if (!id) return null;
  return (
    <BookSheet key={pathname} bookId={id} onClose={closeBook}>
      <Suspense fallback={<div aria-busy className="h-[70vh] bg-[#f4efe6]" />}>
        <SheetContent key={id} id={id} />
      </Suspense>
    </BookSheet>
  );
}
