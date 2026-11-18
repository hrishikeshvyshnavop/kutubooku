"use client";

import { startTransition, useEffect, useLayoutEffect, useRef, useState } from "react";
import { MOCK_BOOKS } from "../../_data/curation-mock";
import { playMorph } from "../../_lib/book-sheet";
import { BookPdp, bookTheme } from "../../books/[id]/BookPdp";

export default function BookSheetContent({ id }: { id: string }) {
  const book = MOCK_BOOKS.find((b) => b.id === id);
  const ref = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !book) return;
    playMorph(book.id, el.querySelector<HTMLElement>("[data-book-cover]"));
  }, [book]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => startTransition(() => setFull(true)));
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!book) {
    return (
      <div className="grid h-[60vh] place-items-center p-8 text-center">
        <p className="text-2xl font-semibold">We couldn&apos;t find that book.</p>
      </div>
    );
  }

  return (
    <div ref={ref} style={bookTheme(book)}>
      <BookPdp book={book} sheet={{ lite: !full }} />
    </div>
  );
}
