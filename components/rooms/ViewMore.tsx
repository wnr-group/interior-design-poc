"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/icons";

/** Reveal-in-batches state for a long grid ("View 8 more" / "View less"). */
export function useViewMore(total: number, initial: number, step = initial) {
  const [shown, setShown] = useState(initial);
  const visible = Math.min(shown, total);
  return {
    visible,
    remaining: total - visible,
    more: () => setShown((s) => s + step),
    reset: () => setShown(initial),
    step,
    canCollapse: visible > initial,
  };
}

export function ViewMoreButton({
  remaining,
  step,
  canCollapse,
  onMore,
  onLess,
  controls,
}: {
  remaining: number;
  step: number;
  canCollapse: boolean;
  onMore: () => void;
  onLess: () => void;
  controls: string;
}) {
  if (remaining <= 0 && !canCollapse) return null;
  const expanding = remaining > 0;
  return (
    <div className="mt-8 flex justify-center md:mt-10">
      <button
        type="button"
        onClick={expanding ? onMore : onLess}
        aria-controls={controls}
        className="btn-soft h-12 px-6"
      >
        <ChevronDownIcon size={18} className={expanding ? "" : "rotate-180"} />
        {expanding ? `View ${Math.min(step, remaining)} more` : "View less"}
      </button>
    </div>
  );
}
