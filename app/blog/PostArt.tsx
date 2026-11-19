import Image from "next/image";
import { topicOf, type BlogPost } from "../_data/blog";
import { MOCK_BOOKS } from "../_data/curation-mock";

const BY_ID = new Map(MOCK_BOOKS.map((b) => [b.id, b]));

const PLACES = [
  "left-[8%] top-[18%] w-[38%] -rotate-[8deg]",
  "left-[34%] top-[8%] z-10 w-[40%] rotate-[3deg]",
  "right-[6%] top-[22%] w-[36%] rotate-[10deg]",
];

export function PostArt({ post, size, priority = false }: { post: BlogPost; size: string; priority?: boolean }) {
  const covers = post.books.map((id) => BY_ID.get(id)).filter((b) => !!b).slice(0, 3);

  return (
    <div aria-hidden className="relative aspect-[4/3] overflow-hidden rounded-[22px]" style={{ backgroundColor: topicOf(post.topic).tone }}>
      <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgb(255_255_255/0.55),transparent_65%)]" />
      {covers.map((b, i) => (
        <span
          key={b.id}
          className={`absolute aspect-square overflow-hidden rounded-r-[8px] rounded-l-[3px] shadow-[0_18px_30px_-16px_rgba(29,40,56,0.65)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1.5 ${PLACES[i]}`}
        >
          <Image src={b.cover} alt="" fill sizes={size} priority={priority && i === 1} className="object-cover" />
        </span>
      ))}
    </div>
  );
}
