import Image from "next/image";
import type { MockBook } from "../../_data/curation-mock";

export function BookCover({ book, className = "" }: { book: MockBook; className?: string }) {
  return (
    <div className={`relative aspect-square overflow-hidden rounded-r-[10px] rounded-l-[3px] bg-white shadow-[0_10px_20px_-12px_rgba(29,40,56,0.6)] ${className}`}>
      <Image
        src={book.cover}
        alt={`Cover of ${book.title}`}
        fill
        sizes="(max-width: 639px) calc(100vw - 64px), (max-width: 1279px) 40vw, (max-width: 1535px) 26vw, 360px"
        className="object-cover"
      />
    </div>
  );
}
