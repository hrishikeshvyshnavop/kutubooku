export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kutubooku.com").replace(/\/$/, "");
export const SITE_NAME = "KutuBooku";
export const SITE_DESCRIPTION =
  "Books for children aged 0–14, picked for your child by age, reading stage and interests, each with a reason. Add them to your box and buy on Amazon.in.";

export const abs = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
