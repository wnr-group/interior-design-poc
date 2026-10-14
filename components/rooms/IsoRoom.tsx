import type { RoomShell } from "@/lib/rooms";
import { isoFrame, pts, wallRect } from "@/lib/iso";

const H = 2.6; // wall height, metres
const VIEW = { w: 320, h: 200, pad: 18 };

/**
 * A dollhouse-style empty room: floor, two back walls with white wall caps,
 * windows, an optional door and a patch of sunlight. Pure SVG, so the empty
 * room grid costs no image requests at all.
 */
export default function IsoRoom({ shell, title }: { shell: RoomShell; title?: string }) {
  const { depth: D, width: W } = shell;
  const f = isoFrame(D, W, H, VIEW);
  const { p } = f;
  const L = p(D, 0), B = p(0, 0), R = p(0, W), F = p(D, W);
  const slab = 5;

  const planks: string[] = [];
  for (let d = 0.32; d < D; d += 0.32) {
    const a = p(d, 0), b = p(d, W);
    planks.push(`M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`);
  }

  const openings = (shell.windows ?? []).map((win, i) => {
    const len = win.wall === "left" ? D : W;
    const size = win.size ?? 1;
    const c = win.at * len;
    const frame = wallRect(f, win.wall, c - size / 2, c + size / 2, 0.85, 2.15);
    const glass = wallRect(f, win.wall, c - size / 2 + 0.07, c + size / 2 - 0.07, 0.92, 2.08);
    const mid = wallRect(f, win.wall, c - 0.02, c + 0.02, 0.92, 2.08);
    return (
      <g key={i}>
        <polygon points={pts(frame)} fill="#fbfbfa" />
        <polygon points={pts(glass)} fill="#dfe8ee" />
        <polygon points={pts(mid)} fill="#fbfbfa" />
      </g>
    );
  });

  let door = null;
  if (shell.door) {
    const len = shell.door.wall === "left" ? D : W;
    const c = shell.door.at * len;
    door = (
      <g>
        <polygon points={pts(wallRect(f, shell.door.wall, c - 0.48, c + 0.48, 0, 2.12))} fill="#fbfbfa" />
        <polygon points={pts(wallRect(f, shell.door.wall, c - 0.4, c + 0.4, 0, 2.05))} fill="#f1f0ec" stroke="#d9d8d3" strokeWidth={0.6} />
      </g>
    );
  }

  // Sunlight falls from the first right-wall window across the floor.
  const sunWin = shell.sunlight ? shell.windows?.find((w) => w.wall === "right") ?? shell.windows?.[0] : undefined;
  let sun = null;
  if (sunWin) {
    const len = sunWin.wall === "left" ? D : W;
    const size = sunWin.size ?? 1;
    const c = sunWin.at * len;
    const a = Math.max(0.1, c - size / 2), b = Math.min(len - 0.1, c + size / 2);
    const reach = Math.min(sunWin.wall === "right" ? D : W, 2.4);
    const poly =
      sunWin.wall === "right"
        ? [p(0.5, a), p(0.5, b), p(reach, b + 0.6), p(reach, a + 0.6)]
        : [p(a, 0.5), p(b, 0.5), p(b + 0.6, reach), p(a + 0.6, reach)];
    sun = <polygon points={pts(poly)} fill="#fff8e6" opacity={0.42} />;
  }

  return (
    <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="h-full w-full" role="img" aria-label={title ?? "Empty room illustration"}>
      {/* floor slab edge */}
      <polygon points={pts([L, F, R, [R[0], R[1] + slab], [F[0], F[1] + slab], [L[0], L[1] + slab]])} fill="#f6f6f4" />
      {/* floor */}
      <polygon points={pts([B, L, F, R])} fill={shell.floor} />
      <path d={planks.join("")} stroke="#000" strokeOpacity={0.14} strokeWidth={0.7} />
      {sun}
      {/* walls: the left one is in shade */}
      <polygon points={pts([L, B, p(0, 0, H), p(D, 0, H)])} fill={shell.wallLeft} />
      <polygon points={pts([L, B, p(0, 0, H), p(D, 0, H)])} fill="#000" opacity={0.06} />
      <polygon points={pts([B, R, p(0, W, H), p(0, 0, H)])} fill={shell.wallRight} />
      {/* skirting */}
      <polygon points={pts([L, B, p(0, 0, 0.08), p(D, 0, 0.08)])} fill="#fff" opacity={0.7} />
      <polygon points={pts([B, R, p(0, W, 0.08), p(0, 0, 0.08)])} fill="#fff" opacity={0.7} />
      {openings}
      {door}
      {/* wall caps and floor edge drawn as thick white strokes */}
      <polyline
        points={pts([L, p(D, 0, H), p(0, 0, H), p(0, W, H), R])}
        fill="none"
        stroke="#fff"
        strokeWidth={3.2}
        strokeLinejoin="round"
      />
      <polyline points={pts([L, F, R])} fill="none" stroke="#fff" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}
