"use client";

import { useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getProduct } from "@/lib/designer/catalog";
import { halfExtents, itemDims, supportOf, wallGaps } from "@/lib/designer/geometry";
import { getFinish, getFloor, shade } from "@/lib/designer/materials";
import type { Opening, PlacedItem, Room, WallSide } from "@/lib/designer/types";
import { PlanShape } from "./planShapes";
import type { ViewProps } from "./views";

const T = 12; // wall thickness, cm
const MARGIN = 85;
const BRAND = "#b4502c";
const WARN = "#d08a00";

type View = { zoom: number; cx: number; cy: number };

const wallFrame = (side: WallSide, room: Room) => {
  const { width: W, length: L } = room;
  switch (side) {
    case "north": return { o: [0, 0], a: [1, 0], n: [0, 1] };
    case "east": return { o: [W, 0], a: [0, 1], n: [-1, 0] };
    case "south": return { o: [0, L], a: [1, 0], n: [0, -1] };
    case "west": return { o: [0, 0], a: [0, 1], n: [1, 0] };
  }
};

function OpeningMark({ o, room, floorFill }: { o: Opening; room: Room; floorFill: string }) {
  const { o: org, a, n } = wallFrame(o.wall, room);
  const P = (u: number, v: number) => [org[0] + a[0] * u + n[0] * v, org[1] + a[1] * u + n[1] * v];
  const u0 = o.offset - o.width / 2;
  const u1 = o.offset + o.width / 2;
  const quad = [P(u0, 0), P(u1, 0), P(u1, -T), P(u0, -T)].map((p) => p.join(",")).join(" ");
  if (o.kind === "window") {
    const g1 = [P(u0, -T * 0.35), P(u1, -T * 0.35)];
    const g2 = [P(u0, -T * 0.65), P(u1, -T * 0.65)];
    return (
      <g>
        <polygon points={quad} fill="#ffffff" stroke="#3d3a36" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <line x1={g1[0][0]} y1={g1[0][1]} x2={g1[1][0]} y2={g1[1][1]} stroke="#6b8ea0" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
        <line x1={g2[0][0]} y1={g2[0][1]} x2={g2[1][0]} y2={g2[1][1]} stroke="#6b8ea0" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
      </g>
    );
  }
  const hinge = P(u0, 0);
  const leaf = P(u0, o.width);
  const end = P(u1, 0);
  const sweep = a[0] * n[1] - a[1] * n[0] > 0 ? 1 : 0;
  return (
    <g>
      <polygon points={quad} fill={floorFill} stroke="none" />
      <line x1={hinge[0]} y1={hinge[1]} x2={leaf[0]} y2={leaf[1]} stroke="#3d3a36" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      <path d={`M ${end[0]} ${end[1]} A ${o.width} ${o.width} 0 0 ${sweep} ${leaf[0]} ${leaf[1]}`} fill="none" stroke="#3d3a36" strokeWidth={1} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
    </g>
  );
}

/** Draw order: rugs, then larger floor pieces under smaller ones, then stacked pieces, then pendants. */
function layer(item: PlacedItem, items: PlacedItem[]) {
  const p = getProduct(item.productId);
  const { w, d } = itemDims(item, p);
  if (p?.flat) return 0;
  if (p?.ceiling) return 3e6;
  if (supportOf(item, items)) return 2e6;
  return 1e6 - w * d;
}

type Drag =
  | { kind: "move"; uid: string; ox: number; oz: number; sx: number; sy: number; started: boolean; pointerId: number }
  | { kind: "rotate"; uid: string; pointerId: number }
  | { kind: "resize"; uid: string; pointerId: number; round: boolean }
  | { kind: "pan"; pointerId: number; sx: number; sy: number; start: View; moved: boolean; ctm: DOMMatrix };

export default function PlanView({ design, selectedId, clashing, onSelect, gesture, ref }: ViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { room, items } = design;
  // Pan is stored relative to the room centre, so resizing the room keeps it framed.
  const [pan, setPan] = useState<View>({ zoom: 1, cx: 0, cy: 0 });
  const view: View = { zoom: pan.zoom, cx: room.width / 2 + pan.cx, cy: room.length / 2 + pan.cy };
  const setView = (next: View | ((v: View) => View)) =>
    setPan((p) => {
      const cur = { zoom: p.zoom, cx: room.width / 2 + p.cx, cy: room.length / 2 + p.cy };
      const v = typeof next === "function" ? next(cur) : next;
      return { zoom: v.zoom, cx: v.cx - room.width / 2, cy: v.cy - room.length / 2 };
    });
  const [box, setBox] = useState({ w: 800, h: 600 });
  const drag = useRef<Drag | null>(null);
  const [activeDrag, setActiveDrag] = useState<Drag["kind"] | null>(null);

  useLayoutEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width || 1, h: e.contentRect.height || 1 }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fit the room (plus margin) to the viewport, then apply zoom around the view centre.
  const fitW = room.width + MARGIN * 2;
  const fitH = room.length + MARGIN * 2;
  const scale0 = Math.min(box.w / fitW, box.h / fitH);
  const pxPerCm = scale0 * view.zoom;
  const vbW = box.w / pxPerCm;
  const vbH = box.h / pxPerCm;
  const viewBox = `${view.cx - vbW / 2} ${view.cy - vbH / 2} ${vbW} ${vbH}`;
  const font = (px: number) => px / pxPerCm;

  const toRoom = (clientX: number, clientY: number, ctm?: DOMMatrix) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const m = ctm ?? svg.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return { x: p.x, z: p.y };
  };

  const zoomAt = (factor: number, at?: { x: number; z: number }) => {
    setView((v) => {
      const zoom = Math.min(8, Math.max(0.5, v.zoom * factor));
      const k = v.zoom / zoom;
      if (!at) return { ...v, zoom };
      return { zoom, cx: at.x - (at.x - v.cx) * k, cy: at.z - (at.z - v.cy) * k };
    });
  };

  useImperativeHandle(ref, () => ({
    zoom: (dir) => zoomAt(dir > 0 ? 1.25 : 0.8),
    reset: () => setView({ zoom: 1, cx: room.width / 2, cy: room.length / 2 }),
    floorPointAt: (x, y) => toRoom(x, y),
    capture: (maxWidth) => exportSvg(svgRef.current, room, maxWidth),
  }));

  // Wheel zoom needs a non-passive listener to stop the page from scrolling.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = toRoom(e.clientX, e.clientY);
      zoomAt(Math.exp(-e.deltaY * 0.0015), p ?? undefined);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  });

  const startItemDrag = (e: React.PointerEvent, item: PlacedItem) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect(item.uid);
    const p = toRoom(e.clientX, e.clientY);
    if (!p) return;
    svgRef.current?.setPointerCapture(e.pointerId);
    drag.current = { kind: "move", uid: item.uid, ox: item.x - p.x, oz: item.z - p.z, sx: e.clientX, sy: e.clientY, started: false, pointerId: e.pointerId };
  };

  const startHandle = (e: React.PointerEvent, kind: "rotate" | "resize", item: PlacedItem) => {
    e.stopPropagation();
    svgRef.current?.setPointerCapture(e.pointerId);
    const p = getProduct(item.productId);
    drag.current = kind === "rotate"
      ? { kind, uid: item.uid, pointerId: e.pointerId }
      : { kind, uid: item.uid, pointerId: e.pointerId, round: p?.model === "roundRug" };
    gesture.start();
    setActiveDrag(kind);
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (drag.current || (e.button !== 0 && e.button !== 1)) return;
    const ctm = svgRef.current?.getScreenCTM();
    if (!ctm) return;
    svgRef.current?.setPointerCapture(e.pointerId);
    drag.current = { kind: "pan", pointerId: e.pointerId, sx: e.clientX, sy: e.clientY, start: view, moved: false, ctm };
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const targetUid = d.kind === "pan" ? null : d.uid;
    const item = items.find((i) => i.uid === targetUid);
    if (d.kind === "pan") {
      const a = toRoom(d.sx, d.sy, d.ctm);
      const b = toRoom(e.clientX, e.clientY, d.ctm);
      if (!a || !b) return;
      if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 4) return;
      d.moved = true;
      setView({ ...d.start, cx: d.start.cx - (b.x - a.x), cy: d.start.cy - (b.z - a.z) });
      return;
    }
    const p = toRoom(e.clientX, e.clientY);
    if (!p || !item) return;
    if (d.kind === "move") {
      if (!d.started) {
        if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 3) return;
        d.started = true;
        gesture.start();
        setActiveDrag("move");
      }
      gesture.preview(d.uid, { x: p.x + d.ox, z: p.z + d.oz });
    } else if (d.kind === "rotate") {
      // Point the back of the piece at the pointer; snap to 15° unless Shift is held.
      const deg = (Math.atan2(-(p.x - item.x), -(p.z - item.z)) * 180) / Math.PI;
      const snap = e.shiftKey ? 1 : 15;
      gesture.preview(d.uid, { rotation: Math.round(deg / snap) * snap });
    } else {
      const r = (item.rotation * Math.PI) / 180;
      const dx = p.x - item.x;
      const dz = p.z - item.z;
      const lx = Math.abs(dx * Math.cos(r) - dz * Math.sin(r));
      const lz = Math.abs(dx * Math.sin(r) + dz * Math.cos(r));
      const prod = getProduct(item.productId);
      const lim = prod?.resizable;
      if (!lim) return;
      const snap5 = (v: number) => Math.round(v / 5) * 5;
      const w = Math.min(lim.max[0], Math.max(lim.min[0], snap5(lx * 2)));
      const dd = d.round ? w : Math.min(lim.max[1], Math.max(lim.min[1], snap5(lz * 2)));
      gesture.preview(d.uid, { w, d: dd });
    }
  };

  const endDrag = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drag.current = null;
    setActiveDrag(null);
    if (svgRef.current?.hasPointerCapture(e.pointerId)) svgRef.current.releasePointerCapture(e.pointerId);
    if (d.kind === "pan") {
      if (!d.moved) onSelect(null);
      return;
    }
    if (d.kind === "move" && !d.started) return;
    gesture.end();
  };

  const sorted = useMemo(() => [...items].sort((a, b) => layer(a, items) - layer(b, items)), [items]);
  const floor = getFloor(room.floor);
  const selected = items.find((i) => i.uid === selectedId);

  return (
    <svg
      ref={svgRef}
      viewBox={viewBox}
      className="absolute inset-0 size-full touch-none select-none"
      style={{ cursor: activeDrag === "pan" ? "grabbing" : activeDrag ? "grabbing" : undefined }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      role="application"
      aria-label={`Floor plan of ${design.name}, ${room.width} by ${room.length} cm. Drag furniture to move it; use the round handle to rotate.`}
      fontFamily="Noto Sans, system-ui, sans-serif"
    >
      <defs>
        <pattern id="plan-grid" width={50} height={50} patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#000000" strokeOpacity={0.08} strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
        </pattern>
      </defs>
      <rect data-export-bg x={view.cx - vbW / 2} y={view.cy - vbH / 2} width={vbW} height={vbH} fill="#efede8" />

      {/* Walls, floor and grid */}
      <rect x={-T} y={-T} width={room.width + 2 * T} height={room.length + 2 * T} fill="#3d3a36" />
      <rect x={0} y={0} width={room.width} height={room.length} fill={shade(floor.color, 0.35)} />
      <rect x={0} y={0} width={room.width} height={room.length} fill="url(#plan-grid)" />
      {room.openings.map((o) => <OpeningMark key={o.id} o={o} room={room} floorFill={shade(floor.color, 0.35)} />)}

      {/* Room dimensions */}
      <g fill="#484848" fontSize={font(12)} textAnchor="middle">
        <line x1={0} y1={-T - font(16)} x2={room.width} y2={-T - font(16)} stroke="#929292" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <text x={room.width / 2} y={-T - font(22)}>{room.width} cm</text>
        <line x1={-T - font(16)} y1={0} x2={-T - font(16)} y2={room.length} stroke="#929292" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <text transform={`translate(${-T - font(22)} ${room.length / 2}) rotate(-90)`}>{room.length} cm</text>
      </g>

      {/* Furniture */}
      {sorted.map((item) => {
        const product = getProduct(item.productId);
        if (!product) return null;
        const { w, d } = itemDims(item, product);
        const isSel = item.uid === selectedId;
        const color = getFinish(item.finish).color;
        return (
          <g
            key={item.uid}
            transform={`translate(${item.x} ${item.z}) rotate(${-item.rotation})`}
            onPointerDown={(e) => startItemDrag(e, item)}
            style={{ cursor: "grab" }}
            role="button"
            tabIndex={0}
            aria-pressed={isSel}
            aria-label={`${product.name}, ${Math.round(item.x)} cm from the west wall, ${Math.round(item.z)} cm from the north wall`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(item.uid);
              }
            }}
            opacity={product.ceiling && !isSel ? 0.75 : 1}
            className="outline-none"
          >
            <PlanShape model={product.model} w={w} d={d} color={color} />
            {isSel && (
              <rect data-ui x={-w / 2 - 4} y={-d / 2 - 4} width={w + 8} height={d + 8} rx={3} fill="none" stroke={clashing ? WARN : BRAND} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeDasharray={product.ceiling ? "5 4" : undefined} />
            )}
          </g>
        );
      })}

      {/* Labels stay upright, on top of the furniture */}
      <g pointerEvents="none" fontSize={font(11)} textAnchor="middle" fill="#111111">
        {items.map((item) => {
          const product = getProduct(item.productId);
          if (!product || product.flat || product.stackable || product.ceiling) return null;
          const { w, d } = itemDims(item, product);
          const { ex, ez } = halfExtents(w, d, item.rotation);
          const label = product.name.split(" ").slice(1).join(" ");
          // Only label pieces the text fits inside (about 6 px per character).
          if (ex * 2 * pxPerCm < label.length * 6 + 8 || ez * 2 * pxPerCm < 22) return null;
          return (
            <text key={item.uid} x={item.x} y={item.z + font(4)} paintOrder="stroke" stroke="#ffffff" strokeWidth={font(3)} strokeOpacity={0.85}>
              {label}
            </text>
          );
        })}
      </g>

      {selected && <SelectionOverlay item={selected} room={room} pxPerCm={pxPerCm} clashing={clashing} onHandle={startHandle} />}
    </svg>
  );
}

/** Wall-gap dimensions plus rotate and resize handles for the selected piece. */
function SelectionOverlay({ item, room, pxPerCm, clashing, onHandle }: {
  item: PlacedItem;
  room: Room;
  pxPerCm: number;
  clashing: boolean;
  onHandle: (e: React.PointerEvent, kind: "rotate" | "resize", item: PlacedItem) => void;
}) {
  const product = getProduct(item.productId);
  const { w, d } = itemDims(item, product);
  const { ex, ez } = halfExtents(w, d, item.rotation);
  const gaps = wallGaps(item, room);
  const px = (n: number) => n / pxPerCm;
  const color = clashing ? WARN : BRAND;
  const dims: { x1: number; y1: number; x2: number; y2: number; v: number }[] = [
    { x1: 0, y1: item.z, x2: item.x - ex, y2: item.z, v: gaps.west },
    { x1: item.x + ex, y1: item.z, x2: room.width, y2: item.z, v: gaps.east },
    { x1: item.x, y1: 0, x2: item.x, y2: item.z - ez, v: gaps.north },
    { x1: item.x, y1: item.z + ez, x2: item.x, y2: room.length, v: gaps.south },
  ];
  const r = (item.rotation * Math.PI) / 180;
  const handleDist = d / 2 + px(26);
  // Behind the piece: local (0, -handleDist) rotated into room space.
  const hx = item.x - Math.sin(r) * handleDist;
  const hz = item.z - Math.cos(r) * handleDist;
  const corner = { x: item.x + (w / 2) * Math.cos(r) + (d / 2) * Math.sin(r), z: item.z - (w / 2) * Math.sin(r) + (d / 2) * Math.cos(r) };

  return (
    <g data-ui>
      <g pointerEvents="none" fontSize={px(11)} textAnchor="middle" fontWeight={700}>
        {dims.filter((g) => g.v > 0).map((g, i) => (
          <g key={i}>
            <line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke={color} strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
            <g transform={`translate(${(g.x1 + g.x2) / 2} ${(g.y1 + g.y2) / 2})`}>
              <rect x={-px(22)} y={-px(9)} width={px(44)} height={px(18)} rx={px(9)} fill="#ffffff" stroke={color} strokeWidth={1} vectorEffect="non-scaling-stroke" />
              <text y={px(4)} fill={color}>{g.v}</text>
            </g>
          </g>
        ))}
      </g>
      <line x1={item.x - Math.sin(r) * (d / 2)} y1={item.z - Math.cos(r) * (d / 2)} x2={hx} y2={hz} stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" pointerEvents="none" />
      <g transform={`translate(${hx} ${hz})`} onPointerDown={(e) => onHandle(e, "rotate", item)} style={{ cursor: "grab" }}>
        <circle r={px(14)} fill="transparent" />
        <circle r={px(9)} fill="#ffffff" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        <path d={`M ${px(-4)} ${px(-1)} A ${px(4.5)} ${px(4.5)} 0 1 1 ${px(1)} ${px(4)}`} fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        <title>Drag to rotate (hold Shift for 1° steps)</title>
      </g>
      {product?.resizable && (
        <g transform={`translate(${corner.x} ${corner.z})`} onPointerDown={(e) => onHandle(e, "resize", item)} style={{ cursor: "nwse-resize" }}>
          <circle r={px(14)} fill="transparent" />
          <rect x={px(-7)} y={px(-7)} width={px(14)} height={px(14)} rx={px(2)} fill={color} stroke="#ffffff" strokeWidth={2} vectorEffect="non-scaling-stroke" />
          <title>Drag to resize</title>
        </g>
      )}
    </g>
  );
}

/** Rasterise the plan, fitted to the room, without selection overlays. */
async function exportSvg(svg: SVGSVGElement | null, room: Room, maxWidth?: number): Promise<string> {
  if (!svg) return "";
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.querySelectorAll("[data-ui]").forEach((n) => n.remove());
  const m = MARGIN;
  const vb = { x: -m, y: -m, w: room.width + m * 2, h: room.length + m * 2 };
  clone.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  const bg = clone.querySelector("[data-export-bg]");
  if (bg) {
    bg.setAttribute("x", String(vb.x));
    bg.setAttribute("y", String(vb.y));
    bg.setAttribute("width", String(vb.w));
    bg.setAttribute("height", String(vb.h));
  }
  const outW = maxWidth ?? Math.min(2400, Math.round(vb.w * 3));
  const outH = Math.round((vb.h / vb.w) * outW);
  clone.setAttribute("width", String(outW));
  clone.setAttribute("height", String(outH));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.removeAttribute("class");
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = outW;
    c.height = outH;
    c.getContext("2d")!.drawImage(img, 0, 0, outW, outH);
    return maxWidth ? c.toDataURL("image/jpeg", 0.82) : c.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}
