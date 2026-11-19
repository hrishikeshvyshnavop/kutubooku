"use client";

import { BookCard } from "../../_components/book/BookCard";
import { useAddToBox } from "../../_components/useAddToBox";
import type { MockBook } from "../../_data/curation-mock";

export function SimilarBooks({ books, title, onOpenBook }: { books: MockBook[]; title: string; onOpenBook?: (id: string) => void }) {
  const { cardProps, toastEl } = useAddToBox();

  return (
    <>
      <ul
        aria-label={`Books like ${title}`}
        className="mx-[calc(var(--gutter)*-1)] mt-10 flex snap-x snap-mandatory scroll-px-[var(--gutter)] gap-4 overflow-x-auto px-page pb-6 pt-2 [scrollbar-width:none] sm:mt-14 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0"
      >
        {books.map((b, i) => (
          <li key={b.id} className="w-[min(78vw,320px)] shrink-0 snap-start lg:w-auto [perspective:1400px]">
            <BookCard
              book={b}
              index={i + 1}
              titleAs="h3"
              {...(onOpenBook ? { onOpen: () => onOpenBook(b.id) } : { href: `/books/${b.id}` })}
              box={cardProps(b.id)}
            />
          </li>
        ))}
      </ul>
      {toastEl}
    </>
  );
}
