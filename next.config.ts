import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AVIF first (usually 20–30% smaller than WebP), WebP for browsers without it.
  images: { formats: ["image/avif", "image/webp"] },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
