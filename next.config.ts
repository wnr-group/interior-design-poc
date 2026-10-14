import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Every photo comes from Unsplash's image CDN, which resizes and re-encodes
  // (AVIF/WebP) on the fly. A custom loader hands next/image's srcset widths
  // straight to that CDN, so the Next server never downloads or resizes the
  // originals itself.
  images: {
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
  },
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
