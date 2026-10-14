import { getProduct, type Product } from "./catalog";
import type { Opening, PlacedItem, Room, WallSide } from "./types";

/** Footprint and height of a placed item, in cm. */
export type Dims = { w: number; d: number; h: number };

export function itemDims(item: PlacedItem, product = getProduct(item.productId)): Dims {
  if (!product) return { w: 50, d: 50, h: 50 };
  const size = product.sizes[item.variant] ?? product.sizes[0];
  return product.resizable ? { w: item.w ?? size.w, d: item.d ?? size.d, h: size.h } : { w: size.w, d: size.d, h: size.h };
}

/** Price of one placed item; resizable rugs are priced by area. */
export function itemPrice(item: PlacedItem, product = getProduct(item.productId)): number {
  if (!product) return 0;
  const size = product.sizes[item.variant] ?? product.sizes[0];
  const base = size.price ?? product.price;
  if (!product.resizable) return base;
  const { w, d } = itemDims(item, product);
  return Math.max(990, Math.round((base * (w * d)) / (size.w * size.d) / 10) * 10);
}

export const normDeg = (deg: number) => ((Math.round(deg) % 360) + 360) % 360;

/** Half-extents of the axis-aligned box around a rotated footprint. */
export function halfExtents(w: number, d: number, rotation: number) {
  const r = (rotation * Math.PI) / 180;
  const c = Math.abs(Math.cos(r));
  const s = Math.abs(Math.sin(r));
  return { ex: (w / 2) * c + (d / 2) * s, ez: (w / 2) * s + (d / 2) * c };
}

/** Keep a footprint fully inside the room (centred if it is wider than the room). */
export function clampToRoom(x: number, z: number, dims: Dims, rotation: number, room: Room) {
  const { ex, ez } = halfExtents(dims.w, dims.d, rotation);
  const cx = ex * 2 >= room.width ? room.width / 2 : Math.min(room.width - ex, Math.max(ex, x));
  const cz = ez * 2 >= room.length ? room.length / 2 : Math.min(room.length - ez, Math.max(ez, z));
  return { x: Math.round(cx), z: Math.round(cz) };
}

export function clampItem(item: PlacedItem, room: Room): PlacedItem {
  const { x, z } = clampToRoom(item.x, item.z, itemDims(item), item.rotation, room);
  return x === item.x && z === item.z ? item : { ...item, x, z };
}

type Pt = [number, number];

/** Footprint corners in room space. Rotation follows three.js: local +z maps to (sin r, cos r). */
export function corners(x: number, z: number, w: number, d: number, rotation: number): Pt[] {
  const r = (rotation * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return ([[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]] as Pt[]).map(
    ([lx, lz]) => [x + lx * c + lz * s, z - lx * s + lz * c],
  );
}

/** Separating-axis test for two convex quads. */
function quadsOverlap(a: Pt[], b: Pt[], margin = 1): boolean {
  for (const poly of [a, b]) {
    for (let i = 0; i < 4; i++) {
      const [x1, y1] = poly[i];
      const [x2, y2] = poly[(i + 1) % 4];
      const nx = y2 - y1;
      const ny = x1 - x2;
      const len = Math.hypot(nx, ny) || 1;
      const project = (p: Pt) => (p[0] * nx + p[1] * ny) / len;
      const pa = a.map(project);
      const pb = b.map(project);
      if (Math.max(...pa) - margin <= Math.min(...pb) || Math.max(...pb) - margin <= Math.min(...pa)) return false;
    }
  }
  return true;
}

const footprint = (item: PlacedItem) => {
  const { w, d } = itemDims(item);
  return corners(item.x, item.z, w, d, item.rotation);
};

/** Does a point lie inside an item's footprint? */
function contains(item: PlacedItem, px: number, pz: number): boolean {
  const { w, d } = itemDims(item);
  const r = (item.rotation * Math.PI) / 180;
  const dx = px - item.x;
  const dz = pz - item.z;
  // Inverse rotation back into the item's local frame.
  const lx = dx * Math.cos(r) - dz * Math.sin(r);
  const lz = dx * Math.sin(r) + dz * Math.cos(r);
  return Math.abs(lx) <= w / 2 && Math.abs(lz) <= d / 2;
}

/**
 * The piece a stackable item stands on, if any: the tallest surface under
 * its centre.
 */
export function supportOf(item: PlacedItem, items: PlacedItem[]): PlacedItem | undefined {
  const product = getProduct(item.productId);
  if (!product?.stackable) return undefined;
  let best: PlacedItem | undefined;
  let bestH = 0;
  for (const other of items) {
    if (other.uid === item.uid || !getProduct(other.productId)?.surface) continue;
    const h = itemDims(other).h;
    if (h > bestH && contains(other, item.x, item.z)) {
      best = other;
      bestH = h;
    }
  }
  return best;
}

/** Height the item stands at: 0 on the floor, the host's height when stacked. */
export function elevationOf(item: PlacedItem, items: PlacedItem[]): number {
  const host = supportOf(item, items);
  return host ? itemDims(host).h : 0;
}

/** Products that may share floor space without counting as a clash. */
const ignoresClash = (p: Product | undefined) => !p || p.flat || p.ceiling;

/** Other items whose footprints collide with this one (rugs, pendants and stacked pieces excluded). */
export function clashesWith(item: PlacedItem, items: PlacedItem[]): PlacedItem[] {
  const product = getProduct(item.productId);
  if (ignoresClash(product) || supportOf(item, items)) return [];
  const mine = footprint(item);
  return items.filter((other) => {
    if (other.uid === item.uid) return false;
    const op = getProduct(other.productId);
    if (ignoresClash(op) || supportOf(other, items)) return false;
    return quadsOverlap(mine, footprint(other));
  });
}

/** First spot near the room centre where a new piece doesn't collide with anything. */
export function findFreeSpot(item: PlacedItem, items: PlacedItem[], room: Room): { x: number; z: number } {
  const dims = itemDims(item);
  const product = getProduct(item.productId);
  const cx = room.width / 2;
  const cz = room.length / 2;
  if (ignoresClash(product)) return clampToRoom(cx, cz, dims, item.rotation, room);
  const step = 20;
  for (let ring = 0; ring < 30; ring++) {
    for (let i = -ring; i <= ring; i++) {
      for (let j = -ring; j <= ring; j++) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== ring) continue;
        const spot = clampToRoom(cx + i * step, cz + j * step, dims, item.rotation, room);
        const probe = { ...item, ...spot };
        if (product?.stackable ? !supportOf(probe, items) && clashesWith(probe, items).length === 0 : clashesWith(probe, items).length === 0) {
          return spot;
        }
      }
    }
  }
  return clampToRoom(cx, cz, dims, item.rotation, room);
}

export const wallLength = (room: Room, wall: WallSide) => (wall === "north" || wall === "south" ? room.width : room.length);

/** Keep an opening on its wall after the room or opening is resized. */
export function clampOpening(o: Opening, room: Room): Opening {
  const len = wallLength(room, o.wall);
  const width = Math.min(o.width, len - 20);
  const height = Math.min(o.height, room.height - o.sill - 10);
  const offset = Math.min(len - width / 2 - 5, Math.max(width / 2 + 5, o.offset));
  return { ...o, width, height, offset: Math.round(offset) };
}

/** Distance from each side of the item's bounding box to the walls. */
export function wallGaps(item: PlacedItem, room: Room) {
  const { w, d } = itemDims(item);
  const { ex, ez } = halfExtents(w, d, item.rotation);
  return {
    west: Math.round(item.x - ex),
    east: Math.round(room.width - item.x - ex),
    north: Math.round(item.z - ez),
    south: Math.round(room.length - item.z - ez),
  };
}

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
