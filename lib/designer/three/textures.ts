import * as THREE from "three";
import { getFloor, shade, type FloorMaterial } from "../materials";

/**
 * Procedural canvas textures, so the designer needs no image assets. Each is
 * generated once and shared. Textures repeat; geometry gets world-scaled UVs
 * (see planarUV) so one texture tiles evenly over pieces of any size.
 */

/** Small deterministic PRNG so textures look the same on every load. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  return { c, ctx };
}

function toTexture(c: HTMLCanvasElement, color = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Sprinkle low-alpha specks for surface noise. */
function speckle(ctx: CanvasRenderingContext2D, size: number, count: number, rand: () => number, dark: string, light: string, maxR = 1.6) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = rand() < 0.5 ? dark : light;
    ctx.globalAlpha = 0.05 + rand() * 0.08;
    const r = 0.4 + rand() * maxR;
    ctx.fillRect(rand() * size, rand() * size, r, r);
  }
  ctx.globalAlpha = 1;
}

const cache = new Map<string, THREE.Texture>();
const cached = (key: string, make: () => THREE.Texture) => {
  let t = cache.get(key);
  if (!t) {
    t = make();
    cache.set(key, t);
  }
  return t;
};

/** Real-world size (m) one floor texture tile covers. */
export const FLOOR_TILE = 2.4;

function planks(f: FloorMaterial) {
  const size = 1024;
  const { c, ctx } = canvas(size);
  const rand = rng(f.id.length * 977 + f.color.charCodeAt(2));
  const rows = 12; // 20 cm boards over 2.4 m
  const rowH = size / rows;
  ctx.fillStyle = shade(f.color, -0.35);
  ctx.fillRect(0, 0, size, size);
  for (let r = 0; r < rows; r++) {
    let x = -rand() * size * 0.5;
    while (x < size) {
      const len = size * (0.32 + rand() * 0.34);
      const tone = shade(f.color, (rand() - 0.5) * 0.16);
      for (const dx of [0, size, -size]) {
        const px = x + dx;
        if (px + len < 0 || px > size) continue;
        ctx.fillStyle = tone;
        ctx.fillRect(px + 1, r * rowH + 1, len - 2, rowH - 2);
        // Grain: long, slightly wavy strokes along the board.
        const g = rng(Math.floor(x * 13 + r * 7919));
        for (let k = 0; k < 9; k++) {
          ctx.strokeStyle = g() < 0.6 ? shade(f.color, -0.25) : shade(f.color, 0.18);
          ctx.globalAlpha = 0.08 + g() * 0.12;
          ctx.lineWidth = 0.6 + g() * 1.4;
          const y0 = r * rowH + 3 + g() * (rowH - 6);
          ctx.beginPath();
          ctx.moveTo(px + 2, y0);
          for (let s = 1; s <= 6; s++) ctx.lineTo(px + (len * s) / 6, y0 + (g() - 0.5) * 3);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      x += len;
    }
  }
  return toTexture(c);
}

function tiles(f: FloorMaterial) {
  const size = 1024;
  const { c, ctx } = canvas(size);
  const rand = rng(31);
  const n = 4; // 60 cm tiles over 2.4 m
  const t = size / n;
  ctx.fillStyle = shade(f.color, 0.25);
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      ctx.fillStyle = shade(f.color, (rand() - 0.5) * 0.06);
      ctx.fillRect(i * t + 2, j * t + 2, t - 4, t - 4);
    }
  }
  speckle(ctx, size, 26000, rand, shade(f.color, -0.4), shade(f.color, 0.4));
  return toTexture(c);
}

function concrete(f: FloorMaterial) {
  const size = 1024;
  const { c, ctx } = canvas(size);
  const rand = rng(77);
  ctx.fillStyle = f.color;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 70; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 60 + rand() * 200;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, rand() < 0.5 ? shade(f.color, -0.12) : shade(f.color, 0.1));
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = grad;
    for (const dx of [0, size, -size]) for (const dy of [0, size, -size]) {
      ctx.save();
      ctx.translate(dx, dy);
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
  speckle(ctx, size, 30000, rand, shade(f.color, -0.35), shade(f.color, 0.35), 1.2);
  return toTexture(c);
}

function carpet(f: FloorMaterial) {
  const size = 512;
  const { c, ctx } = canvas(size);
  const rand = rng(5);
  ctx.fillStyle = f.color;
  ctx.fillRect(0, 0, size, size);
  speckle(ctx, size, 60000, rand, shade(f.color, -0.3), shade(f.color, 0.3), 1.8);
  return toTexture(c);
}

export function floorTexture(id: string) {
  const f = getFloor(id);
  return cached(`floor:${f.id}`, () =>
    f.pattern === "planks" ? planks(f) : f.pattern === "tiles" ? tiles(f) : f.pattern === "concrete" ? concrete(f) : carpet(f),
  );
}

/** Real-world width (m) one wall texture tile covers. */
export const WALL_TILE = 1.2;

/** Near-white wall textures; the material colour tints them. */
export function wallTexture(finish: string): THREE.Texture | null {
  if (finish === "panelling") {
    return cached("wall:panelling", () => {
      const size = 512;
      const { c, ctx } = canvas(size);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      const boards = 8; // 15 cm boards over 1.2 m
      const bw = size / boards;
      for (let i = 0; i < boards; i++) {
        const x = i * bw;
        ctx.fillStyle = "#9a9a9a";
        ctx.fillRect(x, 0, 3, size);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x + 3, 0, 2, size);
        const g = ctx.createLinearGradient(x + 5, 0, x + bw, 0);
        g.addColorStop(0, "#f6f6f6");
        g.addColorStop(1, "#ececec");
        ctx.fillStyle = g;
        ctx.fillRect(x + 5, 0, bw - 5, size);
      }
      return toTexture(c);
    });
  }
  if (finish === "limewash") {
    return cached("wall:limewash", () => {
      const size = 512;
      const { c, ctx } = canvas(size);
      const rand = rng(11);
      ctx.fillStyle = "#f4f4f4";
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 140; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const r = 30 + rand() * 120;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, rand() < 0.55 ? "rgba(150,150,150,0.22)" : "rgba(255,255,255,0.5)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        for (const dx of [0, size, -size]) for (const dy of [0, size, -size]) ctx.fillRect(x - r + dx, y - r + dy, r * 2, r * 2);
      }
      return toTexture(c);
    });
  }
  return null;
}

/** Grain for wooden furniture: near-white, tinted by the finish colour. */
export function woodGrain() {
  return cached("wood", () => {
    const size = 512;
    const { c, ctx } = canvas(size);
    const rand = rng(3);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 160; i++) {
      ctx.strokeStyle = rand() < 0.7 ? "#a8a8a8" : "#ffffff";
      ctx.globalAlpha = 0.08 + rand() * 0.18;
      ctx.lineWidth = 0.5 + rand() * 2;
      const y0 = rand() * size;
      ctx.beginPath();
      ctx.moveTo(0, y0);
      for (let s = 1; s <= 8; s++) ctx.lineTo((size * s) / 8, y0 + Math.sin(s + y0) * 3 * rand());
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    return toTexture(c);
  });
}

/** Fine woven texture for upholstery and bedding. */
export function weave() {
  return cached("weave", () => {
    const size = 256;
    const { c, ctx } = canvas(size);
    const rand = rng(9);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 2) {
      ctx.fillStyle = y % 4 === 0 ? "#efefef" : "#fafafa";
      ctx.fillRect(0, y, size, 1);
    }
    for (let x = 0; x < size; x += 3) {
      ctx.fillStyle = "#f2f2f2";
      ctx.globalAlpha = 0.6;
      ctx.fillRect(x, 0, 1, size);
    }
    ctx.globalAlpha = 1;
    speckle(ctx, size, 9000, rand, "#b0b0b0", "#ffffff", 1.2);
    return toTexture(c);
  });
}

/** Rug face with a woven border; the material colour tints it. */
export function rugTexture(round: boolean) {
  return cached(`rug:${round}`, () => {
    const size = 512;
    const { c, ctx } = canvas(size);
    const rand = rng(round ? 21 : 22);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "#8c8c8c";
    if (round) {
      for (const [r, w] of [[236, 10], [214, 4], [120, 3]] as const) {
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      for (const [inset, w] of [[22, 12], [44, 4]] as const) {
        ctx.lineWidth = w;
        ctx.strokeRect(inset, inset, size - inset * 2, size - inset * 2);
      }
      ctx.lineWidth = 2;
      for (let i = 80; i < size - 80; i += 28) {
        ctx.beginPath();
        ctx.moveTo(i, 80);
        ctx.lineTo(i + 14, 96);
        ctx.lineTo(i + 28, 80);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(i, size - 80);
        ctx.lineTo(i + 14, size - 96);
        ctx.lineTo(i + 28, size - 80);
        ctx.stroke();
      }
    }
    speckle(ctx, size, 30000, rand, "#9a9a9a", "#ffffff", 1.6);
    const t = toTexture(c);
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  });
}

/**
 * Replace a geometry's UVs with a planar projection in world units, choosing
 * the projection plane per vertex from its normal, so textures keep their
 * real-world scale on any size of box.
 */
export function planarUV(geo: THREE.BufferGeometry, tile: number, offset = new THREE.Vector3()) {
  const pos = geo.getAttribute("position");
  const nor = geo.getAttribute("normal");
  const uv = geo.getAttribute("uv");
  if (!pos || !nor || !uv) return geo;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + offset.x;
    const y = pos.getY(i) + offset.y;
    const z = pos.getZ(i) + offset.z;
    const ax = Math.abs(nor.getX(i));
    const ay = Math.abs(nor.getY(i));
    const az = Math.abs(nor.getZ(i));
    if (ay >= ax && ay >= az) uv.setXY(i, x / tile, z / tile);
    else if (ax >= az) uv.setXY(i, z / tile, y / tile);
    else uv.setXY(i, x / tile, y / tile);
  }
  uv.needsUpdate = true;
  return geo;
}
