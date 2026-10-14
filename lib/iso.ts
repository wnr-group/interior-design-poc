/**
 * Isometric helpers for the illustrated rooms. A room is a floor rhombus with
 * two back walls; points are addressed in room space (metres along the left
 * wall, metres along the right wall, height) and projected to SVG space.
 */

const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;

export type Pt = [number, number];

export type IsoFrame = {
  /** Project a room-space point (d along left wall, w along right wall, z up). */
  p: (d: number, w: number, z?: number) => Pt;
  depth: number;
  width: number;
  height: number;
};

/**
 * Fit a room of the given footprint (and wall height) into a viewBox,
 * centred, leaving `pad` on every side.
 */
export function isoFrame(
  depth: number,
  width: number,
  height: number,
  view: { w: number; h: number; pad: number },
): IsoFrame {
  const spanX = (depth + width) * COS;
  const spanY = height + (depth + width) * SIN;
  const s = Math.min((view.w - view.pad * 2) / spanX, (view.h - view.pad * 2) / spanY);
  // The back corner (d=0, w=0, z=0) sits `depth` units right of the left edge.
  const ox = (view.w - spanX * s) / 2 + depth * COS * s;
  const oy = (view.h - spanY * s) / 2 + height * s;
  const p = (d: number, w: number, z = 0): Pt => [
    ox + (w - d) * COS * s,
    oy + (d + w) * SIN * s - z * s,
  ];
  return { p, depth, width, height };
}

export const pts = (list: Pt[]) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

/** A rectangle lying on the left (d axis) or right (w axis) wall plane. */
export function wallRect(f: IsoFrame, wall: "left" | "right", from: number, to: number, z0: number, z1: number): Pt[] {
  const at = (t: number, z: number) => (wall === "left" ? f.p(t, 0, z) : f.p(0, t, z));
  return [at(from, z0), at(to, z0), at(to, z1), at(from, z1)];
}
