import Link from "next/link";
import { postDate, topicOf, type BlogPost } from "../_data/blog";
import { PostArt } from "./PostArt";

export function TopicPill({ post }: { post: BlogPost }) {
  const topic = topicOf(post.topic);
  return (
    <span className="w-fit rounded-full px-3 py-1 type-caption-strong text-[#1d2838]" style={{ backgroundColor: topic.tone }}>
      {topic.label}
    </span>
  );
}

export function PostMeta({ post, className = "" }: { post: BlogPost; className?: string }) {
  return (
    <p className={`type-body-sm text-[#1d2838]/60 ${className}`}>
      <time dateTime={post.date}>{postDate(post.date)}</time> · {post.readMinutes} min read
    </p>
  );
}

export function PostCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  const Heading = featured ? "h2" : "h3";

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group flex h-full rounded-[32px] bg-[#fffdf8] p-3 shadow-[0_18px_30px_-24px_rgba(29,40,56,0.6)] transition-[translate,rotate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1.5 hover:-rotate-[0.5deg] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1d2838] motion-reduce:transition-none ${
        featured ? "flex-col gap-6 lg:flex-row lg:items-center lg:gap-10 lg:p-4" : "flex-col"
      }`}
    >
      <div className={featured ? "lg:w-[56%] lg:shrink-0" : ""}>
        <PostArt post={post} size={featured ? "(min-width: 1024px) 22vw, 40vw" : "(min-width: 1024px) 12vw, 30vw"} priority={featured} />
      </div>
      <div className={`flex flex-1 flex-col ${featured ? "px-3 pb-4 lg:px-0 lg:pr-6" : "px-2 pb-3 pt-4"}`}>
        <TopicPill post={post} />
        <Heading className={`mt-3 ${featured ? "type-display-sm" : "type-title"}`}>
          <span className="link-underline">{post.title}</span>
        </Heading>
        <p className={`mt-3 text-[#1d2838]/75 ${featured ? "type-body-lg" : "line-clamp-3 type-body"}`}>{post.excerpt}</p>
        <PostMeta post={post} className="mt-auto pt-5" />
      </div>
    </Link>
  );
}
