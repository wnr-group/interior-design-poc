import { isoFrame, pts, wallRect } from "@/lib/iso";

const VIEW = { w: 480, h: 270, pad: 24 };
const D = 4.2, W = 5.4, H = 2.4;

/**
 * Illustration for "draw your own floor plan": a white room shell with
 * measured walls and one wall selected for editing, the way a planner shows
 * a wall you are dragging. Hovering the card nudges the drag handle.
 */
export default function FloorPlanSketch() {
  const f = isoFrame(D, W, H, VIEW);
  const { p } = f;
  const L = p(D, 0), B = p(0, 0), R = p(0, W), F = p(D, W);
  const topL = p(D, 0, H), topB = p(0, 0, H), topR = p(0, W, H);

  // Selected wall: the right wall's top edge, from 1.4 m to 4.2 m.
  const s0 = p(0, 1.4, H), s1 = p(0, 4.2, H);
  const dimOffset = 16;

  return (
    <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="h-full w-full" role="img" aria-label="Floor plan drawing with wall measurements">
      <rect width={VIEW.w} height={VIEW.h} fill="#eeeeec" />
      {/* grid */}
      <g stroke="#000" strokeOpacity={0.05}>
        {Array.from({ length: 24 }, (_, i) => (
          <path key={i} d={`M${i * 22} 0V${VIEW.h}M0 ${i * 22}H${VIEW.w}`} />
        ))}
      </g>
      {/* nudged right and down, clear of the card tag */}
      <g transform="translate(26 14)">
      <polygon points={pts([B, L, F, R])} fill="#c9a57d" />
      <polygon points={pts([L, B, topB, topL])} fill="#e9e9e6" />
      <polygon points={pts([B, R, topR, topB])} fill="#f6f6f4" />
      <polygon points={pts(wallRect(f, "left", 1.4, 2.6, 0.9, 2.0))} fill="#dfe8ee" stroke="#fff" strokeWidth={2} />
      <polygon points={pts(wallRect(f, "right", 0.5, 1.2, 0, 2.0))} fill="#fff" stroke="#d6d6d2" />
      <polygon points={pts(wallRect(f, "right", 4.5, 5.1, 0.9, 2.0))} fill="#dfe8ee" stroke="#fff" strokeWidth={2} />

      {/* wall caps */}
      <polyline points={pts([L, topL, topB, topR, R])} fill="none" stroke="#111" strokeWidth={5} strokeLinejoin="round" />
      <polyline points={pts([L, F, R])} fill="none" stroke="#111" strokeWidth={2} strokeOpacity={0.35} />

      {/* selected wall */}
      <line x1={s0[0]} y1={s0[1]} x2={s1[0]} y2={s1[1]} stroke="var(--color-brand)" strokeWidth={6} strokeLinecap="round" />
      <g className="transition-transform duration-500 ease-out group-hover:-translate-y-1.5">
        <circle cx={s0[0]} cy={s0[1]} r={6} fill="#fff" stroke="#111" strokeWidth={1.5} />
        <circle cx={s1[0]} cy={s1[1]} r={6} fill="#fff" stroke="#111" strokeWidth={1.5} />
      </g>

      {/* dimension lines */}
      <g stroke="#111" strokeWidth={1} fill="#111" fontSize={13} fontFamily="var(--font-noto-sans), sans-serif" fontWeight={700}>
        {/* Depth is measured along the front-right floor edge, which keeps it
            clear of the card's tag in the top-left corner. */}
        <line x1={F[0] + 12} y1={F[1] + 7} x2={R[0] + 12} y2={R[1] + 7} />
        <text x={(F[0] + R[0]) / 2 + 18} y={(F[1] + R[1]) / 2 + 20} stroke="none">4.2 m</text>
        <line x1={topB[0] + dimOffset} y1={topB[1] - dimOffset * 0.58} x2={topR[0] + dimOffset} y2={topR[1] - dimOffset * 0.58} />
        <text x={(topB[0] + topR[0]) / 2 + 8} y={(topB[1] + topR[1]) / 2 - 16} stroke="none">5.4 m</text>
      </g>
      </g>
    </svg>
  );
}
