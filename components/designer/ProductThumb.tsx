"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/designer/catalog";
import { getFinish } from "@/lib/designer/materials";
import clsx from "@/lib/clsx";

/**
 * Product preview rendered from the 3D model. three.js loads lazily, so the
 * card shows a tinted placeholder for a moment first.
 */
export default function ProductThumb({ product, finish, variant = 0, className }: { product: Product; finish: string; variant?: number; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    import("@/lib/designer/three/thumbs").then(({ productThumb }) =>
      productThumb(product, finish, variant).then((url) => live && setSrc(url || "")),
    );
    return () => {
      live = false;
    };
  }, [product, finish, variant]);

  return (
    <div className={clsx("relative overflow-hidden bg-[#f3f2ef]", className)}>
      {src ? (
        // A data URL rendered on the client; next/image adds nothing here.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" draggable={false} className="size-full object-contain" />
      ) : (
        <div aria-hidden="true" className="grid size-full place-items-center">
          <span className="size-1/3 animate-pulse rounded-full opacity-40" style={{ backgroundColor: getFinish(finish).color }} />
        </div>
      )}
    </div>
  );
}
