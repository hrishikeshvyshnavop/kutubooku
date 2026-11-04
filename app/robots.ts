import type { MetadataRoute } from "next";
import { abs } from "./_lib/site";

// Personal pages stay out of search (they're also marked noindex in their metadata).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/box", "/sign-in", "/children", "/curation"],
    },
    sitemap: abs("/sitemap.xml"),
  };
}
