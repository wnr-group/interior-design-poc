import * as THREE from "three";
import { getFloor } from "../materials";
import type { Opening, Room, WallSide } from "../types";
import { FLOOR_TILE, WALL_TILE, floorTexture, planarUV, wallTexture } from "./textures";

/**
 * Builds the room shell: floor, base slab and four walls with real openings
 * for doors and windows. Each wall is modelled in its own frame (running
 * along +x, interior face at z = 0, thickness towards -z) and then rotated
 * into place.
 */

export const WALL_T = 0.12;

export type WallInfo = {
  side: WallSide;
  full: THREE.Group;
  stub: THREE.Mesh;
  /** Points into the room. */
  normal: THREE.Vector3;
  center: THREE.Vector3;
};

export type RoomBuild = { group: THREE.Group; walls: WallInfo[]; dispose: () => void };

const neutral = new THREE.MeshStandardMaterial({ color: "#e9e6e0", roughness: 0.9 });
const cap = new THREE.MeshStandardMaterial({ color: "#b9b2a7", roughness: 0.9 });
const trim = new THREE.MeshStandardMaterial({ color: "#f7f5f1", roughness: 0.5 });
const doorLeaf = new THREE.MeshStandardMaterial({ color: "#f3f1ec", roughness: 0.45 });
const glass = new THREE.MeshStandardMaterial({ color: "#cfe4ec", transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.2, depthWrite: false });
const handle = new THREE.MeshStandardMaterial({ color: "#c8c8c8", metalness: 0.9, roughness: 0.25 });
const slab = new THREE.MeshStandardMaterial({ color: "#d5d0c7", roughness: 0.95 });

function boxAt(geos: THREE.BufferGeometry[], parent: THREE.Object3D, mat: THREE.Material | THREE.Material[], u0: number, u1: number, y0: number, y1: number, z0: number, z1: number, uvTile?: number) {
  const geo = new THREE.BoxGeometry(u1 - u0, y1 - y0, z1 - z0);
  geo.translate((u0 + u1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  if (uvTile) planarUV(geo, uvTile);
  geos.push(geo);
  const mesh = new THREE.Mesh(geo, mat);
  parent.add(mesh);
  return mesh;
}

/** Wall frame: rotation, origin and how an opening's offset maps onto it. */
function frameFor(side: WallSide, W: number, L: number) {
  switch (side) {
    case "north": return { rot: 0, pos: new THREE.Vector3(0, 0, 0), len: W, u: (o: number) => o, normal: new THREE.Vector3(0, 0, 1), center: new THREE.Vector3(W / 2, 0, 0) };
    case "east": return { rot: -Math.PI / 2, pos: new THREE.Vector3(W, 0, 0), len: L, u: (o: number) => o, normal: new THREE.Vector3(-1, 0, 0), center: new THREE.Vector3(W, 0, L / 2) };
    case "south": return { rot: Math.PI, pos: new THREE.Vector3(W, 0, L), len: W, u: (o: number) => W - o, normal: new THREE.Vector3(0, 0, -1), center: new THREE.Vector3(W / 2, 0, L) };
    case "west": return { rot: Math.PI / 2, pos: new THREE.Vector3(0, 0, L), len: L, u: (o: number) => L - o, normal: new THREE.Vector3(1, 0, 0), center: new THREE.Vector3(0, 0, L / 2) };
  }
}

function openingDetail(geos: THREE.BufferGeometry[], g: THREE.Group, o: Opening, u0: number, u1: number) {
  const t = WALL_T;
  const s = o.sill / 100;
  const top = s + o.height / 100;
  const f = 0.05;
  // Frame (jambs and head) through the wall thickness.
  boxAt(geos, g, trim, u0, u0 + f, s, top, -t - 0.01, 0.012);
  boxAt(geos, g, trim, u1 - f, u1, s, top, -t - 0.01, 0.012);
  boxAt(geos, g, trim, u0, u1, top - f, top, -t - 0.01, 0.012);
  if (o.kind === "window") {
    boxAt(geos, g, trim, u0, u1, s, s + f, -t - 0.01, 0.012);
    boxAt(geos, g, trim, u0 - 0.04, u1 + 0.04, s - 0.025, s, -0.02, 0.06);
    boxAt(geos, g, glass, u0 + f, u1 - f, s + f, top - f, -t / 2 - 0.004, -t / 2 + 0.004);
    if (u1 - u0 > 1) {
      const mid = (u0 + u1) / 2;
      boxAt(geos, g, trim, mid - 0.02, mid + 0.02, s + f, top - f, -t / 2 - 0.02, -t / 2 + 0.02);
    }
  } else {
    boxAt(geos, g, doorLeaf, u0 + f, u1 - f, 0, top - f, -t / 2 - 0.02, -t / 2 + 0.02);
    for (const z of [-t / 2 + 0.035, -t / 2 - 0.035]) boxAt(geos, g, handle, u1 - f - 0.16, u1 - f - 0.04, 1.0, 1.02, z - 0.012, z + 0.012);
  }
}

export function buildRoom(room: Room): RoomBuild {
  const W = room.width / 100;
  const L = room.length / 100;
  const H = room.height / 100;
  const t = WALL_T;
  const group = new THREE.Group();
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];

  // Floor with world-scaled UVs so boards keep their size in any room.
  const floorGeo = new THREE.PlaneGeometry(W, L);
  floorGeo.rotateX(-Math.PI / 2);
  floorGeo.translate(W / 2, 0, L / 2);
  planarUV(floorGeo, FLOOR_TILE);
  geos.push(floorGeo);
  const pattern = getFloor(room.floor).pattern;
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTexture(room.floor),
    roughness: pattern === "carpet" ? 1 : pattern === "tiles" ? 0.4 : pattern === "concrete" ? 0.5 : 0.62,
  });
  mats.push(floorMat);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.receiveShadow = true;
  floor.name = "floor";
  group.add(floor);

  const base = boxAt(geos, group, slab, -t, W + t, -0.1, -0.001, -t, L + t);
  base.receiveShadow = true;

  const finishTex = wallTexture(room.wallFinish);
  const wallMat = new THREE.MeshStandardMaterial({
    color: room.wallColor,
    map: finishTex,
    roughness: room.wallFinish === "satin" ? 0.42 : room.wallFinish === "panelling" ? 0.6 : 0.94,
  });
  mats.push(wallMat);
  // BoxGeometry groups: +x, -x, +y, -y, +z (room side), -z.
  const faces = [neutral, neutral, cap, cap, wallMat, neutral];

  const walls: WallInfo[] = (["north", "east", "south", "west"] as WallSide[]).map((side) => {
    const fr = frameFor(side, W, L);
    const full = new THREE.Group();
    const openings = room.openings
      .filter((o) => o.wall === side)
      .map((o) => {
        const c = fr.u(o.offset) / 100;
        return { o, u0: c - o.width / 200, u1: c + o.width / 200 };
      })
      .sort((a, b) => a.u0 - b.u0);

    const piece = (u0: number, u1: number, y0: number, y1: number, skirting: boolean) => {
      if (u1 - u0 < 0.001 || y1 - y0 < 0.001) return;
      const m = boxAt(geos, full, faces, u0, u1, y0, y1, -t, 0, WALL_TILE);
      m.castShadow = true;
      m.receiveShadow = true;
      const s0 = Math.max(0, u0);
      if (skirting && u1 > s0) boxAt(geos, full, trim, s0, u1, 0, 0.07, 0, 0.012);
    };

    // The wall starts one thickness early so it closes the corner.
    let cursor = -t;
    for (const { o, u0, u1 } of openings) {
      piece(cursor, u0, 0, H, true);
      if (o.sill > 0) piece(u0, u1, 0, o.sill / 100, true);
      piece(u0, u1, (o.sill + o.height) / 100, H, false);
      openingDetail(geos, full, o, u0, u1);
      cursor = Math.max(cursor, u1);
    }
    piece(cursor, fr.len, 0, H, true);

    const stub = boxAt(geos, new THREE.Group(), faces, -t, fr.len, 0, 0.1, -t, 0, WALL_TILE);
    stub.visible = false;
    const holder = new THREE.Group();
    holder.add(full, stub);
    holder.rotation.y = fr.rot;
    holder.position.copy(fr.pos);
    group.add(holder);
    return { side, full, stub, normal: fr.normal, center: fr.center.clone().setY(H / 2) };
  });

  return {
    group,
    walls,
    dispose() {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
    },
  };
}
