// Site identity for SEO: absolute URLs (canonical links, sitemap, share cards, structured data).
// The live domain stays kutubooku.com (docs/CONTEXT.md). Previews can set NEXT_PUBLIC_SITE_URL.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kutubooku.com").replace(/\/$/, "");
export const SITE_NAME = "KutuBooku";
export const SITE_TAGLINE = "Books picked for your child";
export const SITE_DESCRIPTION =
  "Books for children aged 0–14, picked for your child by age, reading stage and interests, each with a reason. Add them to your box and buy on Amazon.in.";

export const abs = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** JSON-LD as a script string, with "<" escaped so content can't close the tag (Next's JSON-LD guide). */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
