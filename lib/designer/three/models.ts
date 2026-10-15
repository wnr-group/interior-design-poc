import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Model } from "../catalog";
import { getFinish } from "../materials";
import { finishMaterial, rugMaterial, shared } from "./materials3d";
import { planarUV } from "./textures";

/**
 * Procedural furniture. Every model is built in metres with its origin at
 * the centre of its footprint on the floor, front facing +z.
 */

type Mat = THREE.Material;
const TILE = 0.6;

function add(g: THREE.Group, geo: THREE.BufferGeometry, mat: Mat, x: number, y: number, z: number) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  g.add(m);
  return m;
}

/** Box resting on y (bottom face at y). */
function box(g: THREE.Group, w: number, h: number, d: number, mat: Mat, x = 0, y = 0, z = 0) {
  return add(g, planarUV(new THREE.BoxGeometry(w, h, d), TILE), mat, x, y + h / 2, z);
}

/** Rounded box resting on y. */
function rbox(g: THREE.Group, w: number, h: number, d: number, r: number, mat: Mat, x = 0, y = 0, z = 0) {
  const radius = Math.max(0.002, Math.min(r, w / 2, h / 2, d / 2) * 0.98);
  return add(g, planarUV(new RoundedBoxGeometry(w, h, d, 3, radius), TILE), mat, x, y + h / 2, z);
}

/** Cylinder resting on y. */
function cyl(g: THREE.Group, rTop: number, rBot: number, h: number, mat: Mat, x = 0, y = 0, z = 0, seg = 28, open = false) {
  return add(g, new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, open), mat, x, y + h / 2, z);
}

function legs(g: THREE.Group, w: number, d: number, h: number, inset: number, mat: Mat, r = 0.018, square = false) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (w / 2 - inset);
    const z = sz * (d / 2 - inset);
    if (square) box(g, r * 2, h, r * 2, mat, x, 0, z);
    else cyl(g, r, r * 0.8, h, mat, x, 0, z, 12);
  }
}

function rand(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** A run of books standing on a shelf, filling some of the given width. */
function books(g: THREE.Group, x0: number, width: number, y: number, maxH: number, depth: number, z: number, seed: number) {
  const r = rand(seed);
  let x = x0 + 0.02;
  const end = x0 + width * (0.45 + r() * 0.45);
  let i = Math.floor(r() * 8);
  while (x < end) {
    const t = 0.018 + r() * 0.026;
    const h = Math.min(maxH - 0.02, 0.17 + r() * 0.1);
    box(g, t, h, depth * (0.7 + r() * 0.2), shared.book(i++), x + t / 2, y, z);
    x += t + 0.002;
  }
}

type Ctx = { w: number; d: number; h: number; finish: string; roomHeight: number; seed: number };

const builders: Record<Model, (g: THREE.Group, c: Ctx) => void> = {
  bed(g, { w, d, h, finish }) {
    const mat = finishMaterial(finish);
    const kind = getFinish(finish).kind;
    const wooden = kind === "wood" || kind === "paint";
    const legH = 0.1;
    const baseH = wooden ? 0.16 : 0.26;
    const top = legH + baseH;
    if (wooden) {
      box(g, w, baseH, d - 0.06, mat, 0, legH, 0.03);
      legs(g, w, d - 0.06, legH, 0.04, mat, 0.03, true);
      // Slatted headboard between two posts.
      box(g, 0.06, h, 0.06, mat, -w / 2 + 0.03, 0, -d / 2 + 0.03);
      box(g, 0.06, h, 0.06, mat, w / 2 - 0.03, 0, -d / 2 + 0.03);
      box(g, w - 0.12, 0.06, 0.04, mat, 0, h - 0.08, -d / 2 + 0.03);
      const slats = Math.max(3, Math.round(w / 0.12));
      for (let i = 0; i < slats; i++) {
        const x = -w / 2 + 0.06 + ((i + 0.5) * (w - 0.12)) / slats;
        box(g, 0.035, h - top - 0.12, 0.025, mat, x, top + 0.04, -d / 2 + 0.03);
      }
    } else {
      rbox(g, w, baseH, d - 0.08, 0.03, mat, 0, legH, 0.04);
      rbox(g, w + 0.02, h, 0.1, 0.04, mat, 0, 0.02, -d / 2 + 0.05);
      legs(g, w - 0.1, d - 0.2, legH, 0.03, shared.darkLeg(), 0.02);
    }
    const mattD = d - 0.14;
    rbox(g, w - 0.05, 0.2, mattD, 0.05, shared.linen(), 0, top, 0.04);
    const duvetD = mattD * 0.66;
    rbox(g, w - 0.01, 0.06, duvetD, 0.03, shared.duvet(), 0, top + 0.17, d / 2 - duvetD / 2 - 0.02);
    // A folded throw in the frame colour across the foot of the bed.
    rbox(g, w + 0.01, 0.075, 0.34, 0.03, finishMaterial(wooden ? "beige" : finish, -0.12), 0, top + 0.17, d / 2 - 0.26);
    const count = w >= 1.2 ? 2 : 1;
    const pw = (w - 0.16) / count - 0.04;
    for (let i = 0; i < count; i++) {
      const x = -w / 2 + 0.08 + pw / 2 + i * (pw + 0.08);
      const p = rbox(g, pw, 0.13, 0.36, 0.06, shared.linen(), x, top + 0.19, -d / 2 + 0.34);
      p.rotation.x = -0.25;
    }
  },

  mattress(g, { w, d, h, finish }) {
    rbox(g, w, h, d, 0.05, finishMaterial(finish), 0, 0, 0);
    const p = rbox(g, Math.min(0.6, w - 0.2), 0.12, 0.36, 0.06, shared.linen(), 0, h, -d / 2 + 0.3);
    p.rotation.x = -0.2;
  },

  sofa(g, c) {
    seating(g, c, c.w > 2 ? 3 : 2, 0.2);
  },

  armchair(g, c) {
    seating(g, c, 1, 0.14);
  },

  chair(g, { w, d, h, finish }) {
    const mat = finishMaterial(finish);
    const seatY = 0.44;
    box(g, w, 0.035, d - 0.04, mat, 0, seatY, 0.02);
    for (const sx of [-1, 1]) {
      box(g, 0.032, seatY, 0.032, mat, sx * (w / 2 - 0.03), 0, d / 2 - 0.04);
      box(g, 0.032, h, 0.032, mat, sx * (w / 2 - 0.03), 0, -d / 2 + 0.04);
    }
    const back = box(g, w - 0.02, 0.13, 0.022, mat, 0, h - 0.16, -d / 2 + 0.04);
    back.rotation.x = 0.08;
    box(g, w - 0.08, 0.04, 0.02, mat, 0, seatY + 0.18, -d / 2 + 0.04);
  },

  officeChair(g, { h, finish }) {
    const fab = finishMaterial(finish);
    const metal = shared.blackMetal();
    for (let i = 0; i < 5; i++) {
      const arm = box(g, 0.3, 0.03, 0.04, metal, 0, 0.06, 0);
      arm.rotation.y = (i * Math.PI * 2) / 5;
      arm.position.set(Math.cos(arm.rotation.y) * 0.15, 0.075, -Math.sin(arm.rotation.y) * 0.15);
      const a = arm.rotation.y;
      const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 8), metal);
      wheel.position.set(Math.cos(a) * 0.29, 0.03, -Math.sin(a) * 0.29);
      g.add(wheel);
    }
    cyl(g, 0.025, 0.03, 0.36, shared.chrome(), 0, 0.08, 0, 16);
    rbox(g, 0.52, 0.09, 0.5, 0.04, fab, 0, 0.44, 0.02);
    const back = rbox(g, 0.47, h - 0.62, 0.07, 0.035, fab, 0, 0.6, -0.23);
    back.rotation.x = -0.1;
    box(g, 0.03, 0.3, 0.03, metal, 0, 0.42, -0.24);
    for (const sx of [-1, 1]) {
      box(g, 0.025, 0.2, 0.025, metal, sx * 0.25, 0.5, 0.0);
      rbox(g, 0.06, 0.03, 0.26, 0.012, metal, sx * 0.25, 0.7, 0.02);
    }
  },

  bench(g, { w, d, h, finish }) {
    const mat = finishMaterial(finish);
    box(g, w, 0.045, d, mat, 0, h - 0.045, 0);
    legs(g, w, d, h - 0.045, 0.05, mat, 0.02, true);
    box(g, w - 0.14, 0.025, 0.03, mat, 0, 0.12, 0);
  },

  table(g, { w, d, h, finish }) {
    const mat = finishMaterial(finish);
    box(g, w, 0.035, d, mat, 0, h - 0.035, 0);
    box(g, w - 0.16, 0.07, d - 0.16, finishMaterial(finish, -0.08), 0, h - 0.105, 0);
    legs(g, w, d, h - 0.035, 0.06, mat, 0.026, true);
  },

  roundTable(g, { w, h, finish }) {
    const mat = finishMaterial(finish);
    cyl(g, w / 2, w / 2, 0.035, mat, 0, h - 0.035, 0, 48);
    cyl(g, 0.05, 0.06, h - 0.07, mat, 0, 0.035, 0, 20);
    cyl(g, 0.24, 0.26, 0.035, mat, 0, 0, 0, 32);
  },

  coffeeTable(g, { w, d, h, finish }) {
    const mat = finishMaterial(finish);
    box(g, w, 0.035, d, mat, 0, h - 0.035, 0);
    box(g, w - 0.08, 0.02, d - 0.08, mat, 0, 0.12, 0);
    legs(g, w, d, h - 0.035, 0.035, mat, 0.022, true);
  },

  roundCoffeeTable(g, { w, h, finish }) {
    const mat = finishMaterial(finish);
    cyl(g, w / 2, w / 2, 0.03, mat, 0, h - 0.03, 0, 48);
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      const leg = cyl(g, 0.016, 0.012, h - 0.02, mat, Math.cos(a) * w * 0.3, 0, Math.sin(a) * w * 0.3, 10);
      leg.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12);
    }
  },

  desk(g, { w, d, h, finish }) {
    const mat = finishMaterial(finish);
    box(g, w, 0.03, d, mat, 0, h - 0.03, 0);
    box(g, 0.03, h - 0.03, d - 0.04, mat, -w / 2 + 0.035, 0, 0);
    box(g, 0.03, h - 0.03, d - 0.04, mat, w / 2 - 0.035, 0, 0);
    box(g, w - 0.1, 0.32, 0.015, finishMaterial(finish, -0.08), 0, h - 0.36, -d / 2 + 0.06);
    // A closed laptop and a mug make the scale readable.
    rbox(g, 0.32, 0.018, 0.22, 0.006, shared.chrome(), -w * 0.12, h, 0.02);
    cyl(g, 0.04, 0.04, 0.09, shared.ceramicWhite(), w * 0.3, h, 0.08, 16);
  },

  bedside(g, { w, d, h, finish }) {
    const mat = finishMaterial(finish);
    const carcass = finishMaterial(finish, -0.12);
    const legH = 0.1;
    legs(g, w, d, legH, 0.03, mat, 0.015);
    box(g, w, 0.025, d, mat, 0, h - 0.025, 0);
    box(g, w, 0.02, d, mat, 0, legH, 0);
    box(g, 0.02, h - legH - 0.025, d, mat, -w / 2 + 0.01, legH, 0);
    box(g, 0.02, h - legH - 0.025, d, mat, w / 2 - 0.01, legH, 0);
    box(g, w - 0.04, h - legH, 0.01, carcass, 0, legH, -d / 2 + 0.005);
    box(g, w - 0.045, 0.15, 0.02, mat, 0, h - 0.18, d / 2 - 0.01);
    cyl(g, 0.012, 0.012, 0.02, shared.blackMetal(), 0, h - 0.11, d / 2 + 0.005, 10).rotation.x = Math.PI / 2;
  },

  wardrobe(g, { w, d, h, finish }) {
    const mat = finishMaterial(finish);
    box(g, w - 0.02, 0.07, d - 0.06, finishMaterial(finish, -0.25), 0, 0, -0.02);
    box(g, w, h - 0.07, d - 0.025, finishMaterial(finish, -0.14), 0, 0.07, -0.0125);
    const n = Math.max(2, Math.round(w / 0.5));
    const dw = w / n;
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + dw * (i + 0.5);
      box(g, dw - 0.006, h - 0.08, 0.022, mat, x, 0.075, d / 2 - 0.011);
      // Handles sit at the meeting edge of each pair of doors.
      const edge = i % 2 === 0 ? 1 : -1;
      box(g, 0.012, 0.28, 0.02, shared.blackMetal(), x + edge * (dw / 2 - 0.05), 0.95, d / 2 + 0.01);
    }
  },

  drawers(g, { w, d, h, finish }) {
    const mat = finishMaterial(finish);
    const legH = 0.1;
    legs(g, w, d, legH, 0.035, mat, 0.017);
    box(g, w, h - legH, d - 0.02, finishMaterial(finish, -0.14), 0, legH, -0.01);
    const n = 4;
    const fh = (h - legH - 0.01) / n;
    for (let i = 0; i < n; i++) {
      const y = legH + 0.005 + i * fh;
      box(g, w - 0.006, fh - 0.006, 0.02, mat, 0, y, d / 2 - 0.01);
      for (const sx of [-0.22, 0.22]) {
        const k = cyl(g, 0.012, 0.012, 0.02, shared.blackMetal(), sx * w, y + fh / 2 - 0.01, d / 2 + 0.005, 10);
        k.rotation.x = Math.PI / 2;
      }
    }
    box(g, w, 0.02, d, mat, 0, h - 0.02, 0);
  },

  sideboard(g, { w, d, h, finish }) {
    const mat = finishMaterial(finish);
    const legH = 0.16;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, 0.02, 0.012, legH, mat, sx * (w / 2 - 0.06), 0, sz * (d / 2 - 0.06), 10);
    box(g, w, h - legH, d - 0.02, finishMaterial(finish, -0.14), 0, legH, -0.01);
    const n = 3;
    const dw = w / n;
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + dw * (i + 0.5);
      box(g, dw - 0.006, h - legH - 0.01, 0.02, mat, x, legH + 0.005, d / 2 - 0.01);
      box(g, 0.1, 0.012, 0.02, shared.blackMetal(), x, h - 0.08, d / 2 + 0.01);
    }
    box(g, w + 0.01, 0.022, d + 0.01, mat, 0, h - 0.022, 0);
  },

  tvBench(g, { w, d, h, finish }) {
    const mat = finishMaterial(finish);
    const legH = 0.08;
    legs(g, w, d, legH, 0.05, shared.blackMetal(), 0.012);
    box(g, w, h - legH, d - 0.02, finishMaterial(finish, -0.14), 0, legH, -0.01);
    const side = w * 0.32;
    box(g, side - 0.006, h - legH - 0.01, 0.02, mat, -w / 2 + side / 2, legH + 0.005, d / 2 - 0.01);
    box(g, side - 0.006, h - legH - 0.01, 0.02, mat, w / 2 - side / 2, legH + 0.005, d / 2 - 0.01);
    box(g, w - 2 * side - 0.01, h - legH - 0.05, 0.01, shared.interior(), 0, legH + 0.02, d / 2 - 0.06);
    box(g, w, 0.02, d, mat, 0, h - 0.02, 0);
    // A slim TV on top.
    const tvW = Math.min(1.25, w * 0.75);
    box(g, 0.2, 0.015, 0.12, shared.blackMetal(), 0, h, 0);
    box(g, 0.04, 0.08, 0.03, shared.blackMetal(), 0, h, -0.02);
    box(g, tvW, tvW * 0.57, 0.03, shared.blackMetal(), 0, h + 0.07, -0.02);
  },

  bookcase(g, { w, d, h, finish, seed }) {
    const mat = finishMaterial(finish);
    const t = 0.018;
    box(g, t, h, d, mat, -w / 2 + t / 2, 0, 0);
    box(g, t, h, d, mat, w / 2 - t / 2, 0, 0);
    box(g, w - 2 * t, h, 0.008, finishMaterial(finish, -0.1), 0, 0, -d / 2 + 0.004);
    const shelves = 6;
    const gap = (h - 0.06) / (shelves - 1);
    for (let i = 0; i < shelves; i++) {
      const y = i === 0 ? 0.06 : 0.06 + i * gap - t;
      box(g, w - 2 * t, t, d - 0.01, mat, 0, y, 0.005);
      if (i < shelves - 1 && (i + seed) % 3 !== 2) books(g, -w / 2 + t, w - 2 * t, y + t, gap - t, d - 0.08, 0.0, seed * 31 + i);
    }
    box(g, w - 2 * t, 0.06, 0.015, mat, 0, 0, d / 2 - 0.01);
  },

  cubeShelf(g, { w, d, h, finish, seed }) {
    const mat = finishMaterial(finish);
    const cols = w > h ? 4 : 2;
    const rows = w > h ? 2 : 4;
    const t = 0.035;
    const cw = (w - t) / cols;
    const ch = (h - t) / rows;
    for (let i = 0; i <= cols; i++) box(g, t, h, d, mat, -w / 2 + t / 2 + i * cw, 0, 0);
    for (let j = 0; j <= rows; j++) box(g, w, t, d, mat, 0, j * ch, 0);
    box(g, w, h, 0.006, finishMaterial(finish, -0.12), 0, 0, -d / 2 + 0.003);
    const r = rand(seed + 7);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const x = -w / 2 + t + cw * i + (cw - t) / 2;
      const y = t + j * ch;
      const pick = r();
      if (pick < 0.35) rbox(g, cw - t - 0.02, ch - t - 0.02, d - 0.04, 0.02, r() < 0.5 ? shared.insert() : shared.insertDark(), x, y, 0.01);
      else if (pick < 0.7) books(g, x - (cw - t) / 2, cw - t, y, ch - t, d - 0.08, 0, seed + i * 5 + j);
    }
  },

  cabinet(g, { w, d, h, finish }) {
    const mat = finishMaterial(finish);
    const t = 0.02;
    box(g, w, 0.08, d - 0.02, finishMaterial(finish, -0.2), 0, 0, -0.01);
    box(g, t, h, d, mat, -w / 2 + t / 2, 0, 0);
    box(g, t, h, d, mat, w / 2 - t / 2, 0, 0);
    box(g, w, t, d, mat, 0, h - t, 0);
    box(g, w - 2 * t, h, 0.01, finishMaterial(finish, 0.1), 0, 0, -d / 2 + 0.005);
    for (let i = 0; i < 4; i++) {
      const y = 0.08 + i * ((h - 0.1) / 4);
      box(g, w - 2 * t, 0.015, d - 0.04, i === 0 ? mat : shared.glass(), 0, y, 0);
      if (i > 0) {
        cyl(g, 0.045, 0.035, 0.16, shared.ceramicWhite(), -w * 0.2, y + 0.015, -0.02, 18);
        cyl(g, 0.09, 0.05, 0.05, finishMaterial("pot-clay"), w * 0.18, y + 0.015, -0.02, 22);
      }
    }
    for (const sx of [-1, 1]) {
      const x = sx * (w / 4);
      const fw = w / 2 - 0.006;
      box(g, fw, 0.03, 0.02, mat, x, 0.08, d / 2 - 0.01);
      box(g, fw, 0.03, 0.02, mat, x, h - 0.05, d / 2 - 0.01);
      box(g, 0.03, h - 0.1, 0.02, mat, x - fw / 2 + 0.015, 0.08, d / 2 - 0.01);
      box(g, 0.03, h - 0.1, 0.02, mat, x + fw / 2 - 0.015, 0.08, d / 2 - 0.01);
      box(g, fw - 0.06, h - 0.16, 0.006, shared.glass(), x, 0.11, d / 2 - 0.01);
    }
  },

  floorLamp(g, { h, finish }) {
    const metal = finishMaterial(finish);
    cyl(g, 0.13, 0.14, 0.025, metal, 0, 0, 0, 32);
    cyl(g, 0.011, 0.011, h - 0.3, metal, 0, 0.025, 0, 10);
    cyl(g, 0.17, 0.21, 0.3, shared.shadeLit(), 0, h - 0.32, 0, 32, true);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), shared.bulb());
    bulb.position.set(0, h - 0.2, 0);
    g.add(bulb);
  },

  tableLamp(g, { h, finish }) {
    const metal = finishMaterial(finish);
    cyl(g, 0.06, 0.075, 0.03, metal, 0, 0, 0, 24);
    cyl(g, 0.008, 0.008, h - 0.2, metal, 0, 0.03, 0, 8);
    cyl(g, 0.09, 0.125, 0.19, shared.shadeLit(), 0, h - 0.19, 0, 28, true);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), shared.bulb());
    bulb.position.set(0, h - 0.12, 0);
    g.add(bulb);
  },

  pendant(g, { w, h, finish, roomHeight }) {
    const metal = finishMaterial(finish);
    const drop = 0.8;
    const bottom = Math.max(1.6, roomHeight - drop - h);
    cyl(g, 0.004, 0.004, roomHeight - bottom - h, shared.blackMetal(), 0, bottom + h, 0, 6);
    cyl(g, 0.05, 0.05, 0.02, metal, 0, roomHeight - 0.02, 0, 16);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(w / 2, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), metal);
    dome.scale.y = (h / (w / 2)) * 0.95;
    dome.position.y = bottom;
    g.add(dome);
    const inner = new THREE.Mesh(new THREE.CircleGeometry(w / 2 - 0.01, 40), shared.shadeLit());
    inner.rotation.x = Math.PI / 2;
    inner.position.y = bottom + 0.005;
    g.add(inner);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), shared.bulb());
    bulb.position.y = bottom + 0.05;
    g.add(bulb);
  },

  rug(g, { w, d, finish }) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.01, d), rugMaterial(finish, false));
    m.position.y = 0.005;
    g.add(m);
  },

  roundRug(g, { w, finish }) {
    const geo = new THREE.CylinderGeometry(w / 2, w / 2, 0.01, 64);
    // Map the round face onto the square texture.
    const pos = geo.getAttribute("position");
    const uv = geo.getAttribute("uv");
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getZ(i) / w + 0.5);
    const m = new THREE.Mesh(geo, rugMaterial(finish, true));
    m.position.y = 0.005;
    g.add(m);
  },

  plant(g, { w, h, finish, seed }) {
    const pot = finishMaterial(finish);
    const pr = Math.min(0.2, w * 0.36);
    const ph = pr * 1.6;
    cyl(g, pr, pr * 0.78, ph, pot, 0, 0, 0, 28);
    cyl(g, pr * 0.93, pr * 0.93, 0.01, shared.soil(), 0, ph - 0.03, 0, 24);
    cyl(g, 0.012, 0.018, h * 0.6, shared.stem(), 0, ph - 0.02, 0, 8);
    foliage(g, 80, { x: 0, y: ph + (h - ph) * 0.62, z: 0 }, { rx: w * 0.45, ry: (h - ph) * 0.38 }, 0.11, seed);
  },

  smallPlant(g, { w, h, finish, seed }) {
    const pot = finishMaterial(finish);
    const pr = w * 0.42;
    cyl(g, pr, pr * 0.8, h * 0.45, pot, 0, 0, 0, 20);
    foliage(g, 18, { x: 0, y: h * 0.62, z: 0 }, { rx: w * 0.42, ry: h * 0.22 }, 0.07, seed);
  },

  mirror(g, { w, d, h, finish }) {
    const lean = new THREE.Group();
    const frame = finishMaterial(finish);
    box(lean, w, h, 0.03, frame, 0, 0, 0);
    box(lean, w - 0.07, h - 0.07, 0.005, shared.mirror(), 0, 0.035, 0.017);
    lean.rotation.x = -0.09;
    lean.position.z = d / 2 - 0.03;
    g.add(lean);
  },
};

/** Sofa or armchair with arms, back and seat cushions. */
function seating(g: THREE.Group, { w, d, h, finish }: Ctx, cushions: number, armW: number) {
  const mat = finishMaterial(finish);
  const legH = 0.1;
  const backD = 0.22;
  rbox(g, w, 0.26, d, 0.03, mat, 0, legH, 0);
  for (const sx of [-1, 1]) rbox(g, armW, 0.62 - legH, d, 0.06, mat, sx * (w / 2 - armW / 2), legH, 0);
  rbox(g, w - 2 * armW + 0.02, h - legH, backD, 0.06, mat, 0, legH, -d / 2 + backD / 2);
  const cw = (w - 2 * armW) / cushions;
  for (let i = 0; i < cushions; i++) {
    const x = -w / 2 + armW + cw * (i + 0.5);
    rbox(g, cw - 0.012, 0.14, d - backD - 0.03, 0.05, mat, x, legH + 0.26, backD / 2 - 0.0);
    const back = rbox(g, cw - 0.02, 0.4, 0.16, 0.07, mat, x, legH + 0.39, -d / 2 + backD + 0.05);
    back.rotation.x = -0.14;
  }
  legs(g, w - 0.06, d - 0.06, legH, 0.02, shared.oakLeg(), 0.017);
}

/** Instanced leaves scattered through an ellipsoid crown. */
function foliage(g: THREE.Group, count: number, c: { x: number; y: number; z: number }, size: { rx: number; ry: number }, leaf: number, seed: number) {
  const geo = new THREE.SphereGeometry(1, 10, 6);
  geo.scale(leaf * 0.62, leaf * 0.12, leaf);
  geo.translate(0, 0, leaf * 0.8);
  const mesh = new THREE.InstancedMesh(geo, shared.leaf(), count);
  const r = rand(seed * 97 + 13);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  const col = new THREE.Color();
  const greens = ["#3f6b3a", "#4c7d43", "#5d8f4f", "#36592f", "#6b9a55"];
  for (let i = 0; i < count; i++) {
    const a = r() * Math.PI * 2;
    const t = Math.sqrt(r());
    p.set(c.x + Math.cos(a) * size.rx * t * 0.8, c.y + (r() - 0.45) * 2 * size.ry, c.z + Math.sin(a) * size.rx * t * 0.8);
    e.set(-0.5 + r() * 0.9, a + Math.PI / 2 + (r() - 0.5), (r() - 0.5) * 0.6);
    q.setFromEuler(e);
    const k = 0.75 + r() * 0.5;
    s.set(k, k, k);
    m.compose(p, q, s);
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, col.set(greens[Math.floor(r() * greens.length)]));
  }
  g.add(mesh);
}

export type ModelSpec = { model: Model; w: number; d: number; h: number; finish: string; roomHeight: number; seed: number };

/** Build a model; dimensions in centimetres. */
export function buildModel(spec: ModelSpec): THREE.Group {
  const g = new THREE.Group();
  builders[spec.model](g, {
    w: spec.w / 100,
    d: spec.d / 100,
    h: spec.h / 100,
    finish: spec.finish,
    roomHeight: spec.roomHeight / 100,
    seed: spec.seed,
  });
  const flat = spec.model === "rug" || spec.model === "roundRug";
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      const mesh = o as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const glowing = mat.emissiveIntensity > 0 && mat.emissive?.getHex() !== 0;
      mesh.castShadow = !flat && !glowing && !mat.transparent;
      mesh.receiveShadow = true;
    }
  });
  return g;
}

/** Free a model's geometries (materials are shared and kept). */
export function disposeModel(g: THREE.Object3D) {
  g.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) mesh.geometry.dispose();
  });
}
