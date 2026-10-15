"use client";

import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { getProduct } from "@/lib/designer/catalog";
import { itemDims } from "@/lib/designer/geometry";
import { DesignerEngine } from "@/lib/designer/three/engine";
import type { ViewProps } from "./views";

/**
 * Interactive 3D room. Orbit with drag, pan with right-drag or two fingers,
 * zoom with the wheel or pinch. Dragging a piece moves it across the floor.
 */
export default function Viewport3D({ design, selectedId, clashing, onSelect, gesture, ref, onUnavailable }: ViewProps & { onUnavailable: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<DesignerEngine | null>(null);
  const [dragging, setDragging] = useState(false);
  // Latest callbacks for the engine, which is created once.
  const live = useRef({ onSelect, gesture, onUnavailable });
  useEffect(() => {
    live.current = { onSelect, gesture, onUnavailable };
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let engine: DesignerEngine;
    try {
      engine = new DesignerEngine(host, {
        select: (uid) => live.current.onSelect(uid),
        dragStart: () => {
          setDragging(true);
          live.current.gesture.start();
        },
        drag: (uid, x, z) => live.current.gesture.preview(uid, { x, z }),
        dragEnd: () => {
          setDragging(false);
          live.current.gesture.end();
        },
      });
    } catch {
      live.current.onUnavailable();
      return;
    }
    engineRef.current = engine;
    engine.setLabel(labelRef.current);
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.update(design, selectedId, clashing);
  }, [design, selectedId, clashing]);

  useImperativeHandle(ref, () => ({
    zoom: (dir) => engineRef.current?.zoom(dir),
    reset: () => engineRef.current?.resetView(true),
    capture: async (maxWidth) => engineRef.current?.capture(maxWidth) ?? "",
    floorPointAt: (x, y) => engineRef.current?.floorPointAt(x, y) ?? null,
  }), []);

  const selected = design.items.find((i) => i.uid === selectedId);
  const product = selected && getProduct(selected.productId);
  const dims = selected && itemDims(selected, product);

  return (
    <div className="absolute inset-0">
      <div
        ref={hostRef}
        className="absolute inset-0"
        role="img"
        aria-label={`3D view of ${design.name}: a ${design.room.width} by ${design.room.length} cm room with ${design.items.length} pieces of furniture. Drag to orbit, drag furniture to move it.`}
      />
      <div
        ref={labelRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 rounded-full bg-ink px-2.5 py-1 text-xs font-bold whitespace-nowrap text-white shadow-card"
        style={{ visibility: "hidden" }}
      >
        {selected && dims && (dragging
          ? `${Math.round(selected.x)} , ${Math.round(selected.z)} cm`
          : `${product?.name.split(" ").slice(1).join(" ") || product?.name} · ${dims.w} × ${dims.d}${product?.flat ? "" : ` × ${dims.h}`} cm`)}
        {clashing && !dragging && <span className="ml-1.5 text-[#ffd27a]">· overlaps</span>}
      </div>
    </div>
  );
}
