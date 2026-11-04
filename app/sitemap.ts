import type { MetadataRoute } from "next";
import { MOCK_BOOKS } from "./_data/curation-mock";
import { abs } from "./_lib/site";

// Public, indexable pages only. Private ones (box, sign-in, children, curation) are noindex and
// left out; /home is the same page as / (canonical), so it's left out too.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: abs("/"), changeFrequency: "weekly", priority: 1 },
    { url: abs("/books"), changeFrequency: "weekly", priority: 0.9 },
    { url: abs("/reading-preferences"), changeFrequency: "monthly", priority: 0.8 },
    ...MOCK_BOOKS.map((b) => ({
      url: abs(`/books/${b.id}`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      images: [abs(b.cover)],
    })),
  ];
}
