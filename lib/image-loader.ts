"use client";

import type { ImageLoaderProps } from "next/image";

/**
 * next/image loader for Unsplash's imgix-backed CDN. next/image asks for one
 * URL per srcset width; the CDN returns that width, cropped by CSS
 * (object-cover) on our side, in the best format the browser accepts.
 */
export default function unsplashLoader({ src, width, quality }: ImageLoaderProps) {
  if (!src.startsWith("https://images.unsplash.com/")) return src;
  const url = new URL(src);
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "max");
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 70));
  return url.href;
}
