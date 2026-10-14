/** Furniture finishes, floor materials and wall paints for the room designer. */

export type FinishKind = "wood" | "paint" | "fabric" | "leather" | "metal" | "rug" | "ceramic";

export type Finish = { id: string; name: string; color: string; kind: FinishKind };

const list: Finish[] = [
  { id: "white", name: "White", color: "#f1efea", kind: "paint" },
  { id: "birch", name: "Birch", color: "#dcc39d", kind: "wood" },
  { id: "oak", name: "Oak", color: "#c39a6b", kind: "wood" },
  { id: "walnut", name: "Walnut", color: "#6e4a33", kind: "wood" },
  { id: "black-brown", name: "Black-brown", color: "#3b322d", kind: "wood" },
  { id: "sage-paint", name: "Sage", color: "#8d9c85", kind: "paint" },
  { id: "light-grey", name: "Light grey", color: "#c9c7c2", kind: "fabric" },
  { id: "dark-grey", name: "Dark grey", color: "#5c5d60", kind: "fabric" },
  { id: "beige", name: "Beige", color: "#d9c9ae", kind: "fabric" },
  { id: "sage", name: "Sage green", color: "#8a9a7b", kind: "fabric" },
  { id: "terracotta", name: "Terracotta", color: "#b4643f", kind: "fabric" },
  { id: "navy", name: "Navy", color: "#2f3c55", kind: "fabric" },
  { id: "mustard", name: "Mustard", color: "#c8962e", kind: "fabric" },
  { id: "cognac", name: "Cognac leather", color: "#8a5330", kind: "leather" },
  { id: "black-metal", name: "Black", color: "#2a2a2a", kind: "metal" },
  { id: "white-metal", name: "White", color: "#ebebe8", kind: "paint" },
  { id: "brass", name: "Brass", color: "#b99654", kind: "metal" },
  { id: "rug-natural", name: "Natural", color: "#d9cbb2", kind: "rug" },
  { id: "rug-grey", name: "Grey", color: "#9b9a96", kind: "rug" },
  { id: "rug-terracotta", name: "Rust", color: "#b0684a", kind: "rug" },
  { id: "rug-blue", name: "Blue", color: "#5a6f8a", kind: "rug" },
  { id: "pot-white", name: "White pot", color: "#ecebe6", kind: "ceramic" },
  { id: "pot-clay", name: "Clay pot", color: "#b5643c", kind: "ceramic" },
  { id: "pot-black", name: "Black pot", color: "#2d2d2d", kind: "ceramic" },
];

export const finishes: Record<string, Finish> = Object.fromEntries(list.map((f) => [f.id, f]));

export const getFinish = (id: string): Finish => finishes[id] ?? finishes.white;

export type FloorPattern = "planks" | "tiles" | "concrete" | "carpet";

export type FloorMaterial = { id: string; name: string; color: string; pattern: FloorPattern };

export const floors: FloorMaterial[] = [
  { id: "natural-oak", name: "Natural oak", color: "#c6a582", pattern: "planks" },
  { id: "light-ash", name: "Light ash", color: "#dbc4a0", pattern: "planks" },
  { id: "honey-oak", name: "Honey oak", color: "#c09060", pattern: "planks" },
  { id: "walnut", name: "Walnut", color: "#7a5236", pattern: "planks" },
  { id: "greywash", name: "Grey-washed oak", color: "#a99f93", pattern: "planks" },
  { id: "stone-tile", name: "Stone tiles", color: "#c4c0b8", pattern: "tiles" },
  { id: "concrete", name: "Polished concrete", color: "#a8a49e", pattern: "concrete" },
  { id: "wool-carpet", name: "Wool carpet", color: "#cbbfae", pattern: "carpet" },
];

export const getFloor = (id: string): FloorMaterial => floors.find((f) => f.id === id) ?? floors[0];

export const wallColors: { name: string; color: string }[] = [
  { name: "Soft white", color: "#f1efea" },
  { name: "Warm grey", color: "#d9d4cc" },
  { name: "Greige", color: "#c9bfb1" },
  { name: "Sage", color: "#a3b199" },
  { name: "Mist blue", color: "#aab9c3" },
  { name: "Blush", color: "#dfbcb0" },
  { name: "Clay", color: "#c99d80" },
  { name: "Butter", color: "#eed99b" },
  { name: "Forest", color: "#4f6650" },
  { name: "Charcoal", color: "#4b4c4f" },
];

export type WallFinish = { id: string; name: string; description: string };

export const wallFinishes: WallFinish[] = [
  { id: "matt", name: "Matt paint", description: "Flat, chalky and soft" },
  { id: "satin", name: "Satin paint", description: "A gentle sheen" },
  { id: "panelling", name: "Wood panelling", description: "Painted vertical boards" },
  { id: "limewash", name: "Limewash", description: "Cloudy, hand-brushed" },
];

export const getWallFinish = (id: string): WallFinish => wallFinishes.find((f) => f.id === id) ?? wallFinishes[0];

/** Mix a hex colour towards black (amount < 0) or white (amount > 0). */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount),
  );
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** Relative luminance, used to pick legible text over a swatch. */
export function isDark(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 140;
}
