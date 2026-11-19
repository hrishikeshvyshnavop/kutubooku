import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "./_data/blog";
import { MOCK_BOOKS } from "./_data/curation-mock";
import { abs } from "./_lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: abs("/"), changeFrequency: "weekly", priority: 1 },
    { url: abs("/books"), changeFrequency: "weekly", priority: 0.9 },
    { url: abs("/reading-preferences"), changeFrequency: "monthly", priority: 0.8 },
    { url: abs("/curators"), changeFrequency: "monthly", priority: 0.6 },
    { url: abs("/gifting"), changeFrequency: "monthly", priority: 0.7 },
    { url: abs("/blog"), changeFrequency: "weekly", priority: 0.7 },
    ...BLOG_POSTS.map((p) => ({ url: abs(`/blog/${p.slug}`), lastModified: p.date, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...MOCK_BOOKS.map((b) => ({
      url: abs(`/books/${b.id}`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      images: [abs(b.cover)],
    })),
  ];
}
