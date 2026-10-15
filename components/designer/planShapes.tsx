import type { Model } from "@/lib/designer/catalog";
import { shade } from "@/lib/designer/materials";

/**
 * Top-down drawings for the floor plan, in local cm with the footprint
 * centred on the origin and the front facing +y (down the page at 0°).
 * Presentation attributes only (no CSS), so the SVG exports cleanly.
 */

type P = { model: Model; w: number; d: number; color: string };

const LINEN = "#f6f4ef";

export function PlanShape({ model, w, d, color }: P) {
  const stroke = shade(color, -0.4);
  const sw = { stroke, strokeWidth: 1.2, vectorEffect: "non-scaling-stroke" as const };
  const x0 = -w / 2;
  const y0 = -d / 2;
  const rect = (x: number, y: number, rw: number, rh: number, fill: string, r = 2, extra: Record<string, unknown> = {}) => (
    <rect x={x} y={y} width={Math.max(0.5, rw)} height={Math.max(0.5, rh)} rx={r} fill={fill} {...sw} {...extra} />
  );

  switch (model) {
    case "bed": {
      const pillows = w >= 120 ? 2 : 1;
      const pw = (w - 24) / pillows - 6;
      return (
        <g>
          {rect(x0, y0, w, d, color, 3)}
          {rect(x0 + 4, y0 + 10, w - 8, d - 14, LINEN, 4)}
          {Array.from({ length: pillows }, (_, i) => rect(x0 + 12 + i * (pw + 12), y0 + 16, pw, 30, "#ffffff", 8))}
          {rect(x0 + 2, y0 + d * 0.36, w - 4, d * 0.64 - 4, "#e8e4dc", 4)}
          {rect(x0 + 2, y0 + d - 40, w - 4, 34, shade(color, -0.1), 3)}
        </g>
      );
    }
    case "mattress":
      return (
        <g>
          {rect(x0, y0, w, d, LINEN, 6)}
          {rect(x0 + w / 2 - Math.min(30, w / 2 - 10), y0 + 12, Math.min(60, w - 20), 28, "#ffffff", 8)}
        </g>
      );
    case "sofa":
    case "armchair": {
      const arm = model === "sofa" ? 20 : 14;
      const n = model === "armchair" ? 1 : w > 200 ? 3 : 2;
      const cw = (w - arm * 2) / n;
      return (
        <g>
          {rect(x0, y0, w, d, color, 8)}
          {rect(x0 + arm, y0, w - arm * 2, 22, shade(color, -0.12), 6)}
          {Array.from({ length: n }, (_, i) => rect(x0 + arm + i * cw + 1, y0 + 24, cw - 2, d - 28, shade(color, 0.08), 6))}
        </g>
      );
    }
    case "chair":
      return (
        <g>
          {rect(x0 + 2, y0 + 6, w - 4, d - 8, color, 4)}
          {rect(x0, y0, w, 6, shade(color, -0.15), 3)}
        </g>
      );
    case "officeChair":
      return (
        <g>
          <circle r={w / 2} fill="none" {...sw} strokeDasharray="3 3" />
          {rect(-26, -22, 52, 50, color, 10)}
          {rect(-24, -32, 48, 10, shade(color, -0.2), 5)}
        </g>
      );
    case "roundTable":
    case "roundCoffeeTable":
      return (
        <g>
          <circle r={w / 2} fill={color} {...sw} />
          <circle r={w / 2 - 4} fill="none" stroke={shade(color, -0.2)} strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
        </g>
      );
    case "wardrobe": {
      const n = Math.max(2, Math.round(w / 50));
      return (
        <g>
          {rect(x0, y0, w, d, color, 1)}
          {Array.from({ length: n - 1 }, (_, i) => (
            <line key={i} x1={x0 + ((i + 1) * w) / n} y1={y0 + d - 6} x2={x0 + ((i + 1) * w) / n} y2={y0 + d} {...sw} />
          ))}
          <line x1={x0 + 6} y1={y0 + 10} x2={x0 + w - 6} y2={y0 + 10} {...sw} strokeDasharray="4 3" />
        </g>
      );
    }
    case "bookcase":
    case "cubeShelf":
    case "cabinet":
      return (
        <g>
          {rect(x0, y0, w, d, color, 1)}
          {rect(x0 + 3, y0 + 3, w - 6, d - 6, shade(color, model === "cabinet" ? 0.25 : -0.15), 1)}
        </g>
      );
    case "floorLamp":
    case "tableLamp":
      return (
        <g>
          <circle r={w / 2} fill="#f4ecdc" {...sw} />
          <circle r={w / 6} fill={color} {...sw} />
        </g>
      );
    case "pendant":
      return (
        <g>
          <circle r={w / 2} fill={color} fillOpacity={0.25} {...sw} strokeDasharray="4 3" />
          <circle r={3} fill={color} />
        </g>
      );
    case "rug":
      return (
        <g>
          {rect(x0, y0, w, d, color, 2, { fillOpacity: 0.9 })}
          {rect(x0 + 8, y0 + 8, w - 16, d - 16, "none", 1, { stroke: shade(color, -0.25), strokeDasharray: "6 4" })}
        </g>
      );
    case "roundRug":
      return (
        <g>
          <circle r={w / 2} fill={color} fillOpacity={0.9} {...sw} />
          <circle r={w / 2 - 10} fill="none" stroke={shade(color, -0.25)} strokeWidth={1.2} vectorEffect="non-scaling-stroke" strokeDasharray="6 4" />
        </g>
      );
    case "plant":
    case "smallPlant": {
      const r = w / 2;
      return (
        <g>
          {Array.from({ length: 7 }, (_, i) => {
            const a = (i / 7) * Math.PI * 2;
            return <ellipse key={i} cx={Math.cos(a) * r * 0.5} cy={Math.sin(a) * r * 0.5} rx={r * 0.5} ry={r * 0.28} transform={`rotate(${(a * 180) / Math.PI} ${Math.cos(a) * r * 0.5} ${Math.sin(a) * r * 0.5})`} fill={i % 2 ? "#5d8f4f" : "#4c7d43"} stroke="#2f4f2a" strokeWidth={0.8} vectorEffect="non-scaling-stroke" />;
          })}
          <circle r={r * 0.32} fill={color} {...sw} />
        </g>
      );
    }
    case "mirror":
      return (
        <g>
          {rect(x0, y0, w, d, color, 1)}
          {rect(x0 + 3, y0 + 2, w - 6, d - 4, "#dfe9ee", 0.5)}
        </g>
      );
    case "desk":
      return (
        <g>
          {rect(x0, y0, w, d, color, 2)}
          {rect(x0 + w * 0.2, y0 + d * 0.3, 32, 22, "#d8d8d8", 2)}
        </g>
      );
    case "tvBench":
      return (
        <g>
          {rect(x0, y0, w, d, color, 2)}
          {rect(-Math.min(62, w * 0.37), y0 + d * 0.3, Math.min(124, w * 0.74), 5, "#222222", 1)}
        </g>
      );
    default:
      return (
        <g>
          {rect(x0, y0, w, d, color, 2)}
          {rect(x0 + 4, y0 + 4, w - 8, d - 8, "none", 1, { stroke: shade(color, -0.2), strokeWidth: 0.8 })}
        </g>
      );
  }
}
