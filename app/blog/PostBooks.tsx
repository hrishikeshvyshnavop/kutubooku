"use client";

import { BookCard } from "../_components/book/BookCard";
import { useAddToBox } from "../_components/useAddToBox";
import type { MockBook } from "../_data/curation-mock";

export function PostBooks({ books }: { books: MockBook[] }) {
  const { cardProps, toastEl } = useAddToBox();

  return (
    <>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5">
        {books.map((b, i) => (
          <li key={b.id} className="[perspective:1400px]">
            <BookCard book={b} index={i} titleAs="h3" href={`/books/${b.id}`} box={cardProps(b.id)} compact />
          </li>
        ))}
      </ul>
      {toastEl}
    </>
  );
}
