import * as THREE from "three";
import { getFinish, shade } from "../materials";
import { rugTexture, weave, woodGrain } from "./textures";

/**
 * Shared materials. Furniture finishes are cached per finish and tone so a
 * room full of oak chairs uses one material; they are never disposed.
 */

const cache = new Map<string, THREE.Material>();
const cached = <T extends THREE.Material>(key: string, make: () => T): T => {
  let m = cache.get(key) as T | undefined;
  if (!m) {
    m = make();
    cache.set(key, m);
  }
  return m;
};

/**
 * Material for a finish. `tone` darkens (negative) or lightens it, used for
 * carcasses behind doors so the gaps between fronts read.
 */
export function finishMaterial(id: string, tone = 0): THREE.MeshStandardMaterial {
  return cached(`finish:${id}:${tone}`, () => {
    const f = getFinish(id);
    const color = new THREE.Color(tone ? shade(f.color, tone) : f.color);
    switch (f.kind) {
      case "wood":
        return new THREE.MeshStandardMaterial({ color, map: woodGrain(), roughness: 0.62 });
      case "fabric":
        return new THREE.MeshStandardMaterial({ color, map: weave(), roughness: 0.96 });
      case "leather":
        return new THREE.MeshStandardMaterial({ color, roughness: 0.42 });
      case "metal":
        return new THREE.MeshStandardMaterial({ color, metalness: id === "brass" ? 0.8 : 0.45, roughness: id === "brass" ? 0.3 : 0.42 });
      case "ceramic":
        return new THREE.MeshStandardMaterial({ color, roughness: 0.38 });
      case "rug":
        return new THREE.MeshStandardMaterial({ color, roughness: 1 });
      default:
        return new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
    }
  }) as THREE.MeshStandardMaterial;
}

export function rugMaterial(id: string, round: boolean) {
  return cached(`rug:${id}:${round}`, () => new THREE.MeshStandardMaterial({ color: getFinish(id).color, map: rugTexture(round), roughness: 1 }));
}

export const shared = {
  linen: () => cached("linen", () => new THREE.MeshStandardMaterial({ color: "#f3f1ec", map: weave(), roughness: 0.95 })),
  duvet: () => cached("duvet", () => new THREE.MeshStandardMaterial({ color: "#e9e5dd", map: weave(), roughness: 0.95 })),
  darkLeg: () => cached("darkLeg", () => new THREE.MeshStandardMaterial({ color: "#2b2622", roughness: 0.5 })),
  oakLeg: () => cached("oakLeg", () => new THREE.MeshStandardMaterial({ color: "#b98e60", map: woodGrain(), roughness: 0.6 })),
  blackMetal: () => cached("blackMetal", () => new THREE.MeshStandardMaterial({ color: "#232323", metalness: 0.6, roughness: 0.4 })),
  chrome: () => cached("chrome", () => new THREE.MeshStandardMaterial({ color: "#d8d8d8", metalness: 0.95, roughness: 0.18 })),
  glass: () => cached("glass", () => new THREE.MeshStandardMaterial({ color: "#dfeef2", transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, depthWrite: false })),
  mirror: () => cached("mirror", () => new THREE.MeshStandardMaterial({ color: "#e6edf0", metalness: 1, roughness: 0.04 })),
  shadeLit: () => cached("shadeLit", () => new THREE.MeshStandardMaterial({ color: "#f4ecdc", emissive: "#ffdca6", emissiveIntensity: 0.55, roughness: 0.9, side: THREE.DoubleSide })),
  bulb: () => cached("bulb", () => new THREE.MeshStandardMaterial({ color: "#fff7e6", emissive: "#fff1d0", emissiveIntensity: 2 })),
  soil: () => cached("soil", () => new THREE.MeshStandardMaterial({ color: "#3d2e22", roughness: 1 })),
  stem: () => cached("stem", () => new THREE.MeshStandardMaterial({ color: "#5b4a33", roughness: 0.9 })),
  leaf: () => cached("leaf", () => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.7, side: THREE.DoubleSide })),
  interior: () => cached("interior", () => new THREE.MeshStandardMaterial({ color: "#3a3532", roughness: 0.9 })),
  insert: () => cached("insert", () => new THREE.MeshStandardMaterial({ color: "#cbbba1", map: weave(), roughness: 0.95 })),
  insertDark: () => cached("insertDark", () => new THREE.MeshStandardMaterial({ color: "#59606a", map: weave(), roughness: 0.95 })),
  ceramicWhite: () => cached("ceramicWhite", () => new THREE.MeshStandardMaterial({ color: "#efece6", roughness: 0.3 })),
  book: (i: number) => {
    const colors = ["#8e3b2e", "#2f4b5f", "#c9a24a", "#3f5a43", "#d9d2c3", "#6b4b6e", "#1f1f1f", "#b6642f"];
    return cached(`book:${i % colors.length}`, () => new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.8 }));
  },
};
