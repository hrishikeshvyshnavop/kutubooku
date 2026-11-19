"use client";

import { useState } from "react";
import { BLOG_TOPICS, type BlogPost, type BlogTopic } from "../_data/blog";
import { PostCard } from "./PostCard";

export function BlogGrid({ posts }: { posts: BlogPost[] }) {
  const [topic, setTopic] = useState<BlogTopic | null>(null);
  const shown = topic ? posts.filter((p) => p.topic === topic) : posts;
  const used = BLOG_TOPICS.filter((t) => posts.some((p) => p.topic === t.value));

  return (
    <>
      <div role="group" aria-label="Filter by topic" className="flex flex-wrap gap-2">
        <FilterPill label="All posts" pressed={topic === null} onClick={() => setTopic(null)} />
        {used.map((t) => (
          <FilterPill key={t.value} label={t.label} tone={t.tone} pressed={topic === t.value} onClick={() => setTopic(topic === t.value ? null : t.value)} />
        ))}
      </div>

      <ul aria-live="polite" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {shown.map((p) => (
          <li key={p.slug} className="animate-q-in">
            <PostCard post={p} />
          </li>
        ))}
      </ul>
    </>
  );
}

function FilterPill({ label, tone, pressed, onClick }: { label: string; tone?: string; pressed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      style={pressed ? undefined : tone ? { backgroundColor: tone } : undefined}
      className={`h-11 rounded-full px-5 type-label transition-[background-color,color,scale] duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838] ${
        pressed ? "bg-[#1d2838] text-[#fffdf8]" : tone ? "text-[#1d2838] hover:brightness-95" : "bg-[#f4eee3] text-[#1d2838] hover:bg-[#ece3d3]"
      }`}
    >
      {label}
    </button>
  );
}
