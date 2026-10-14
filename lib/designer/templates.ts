import { getRoom } from "@/lib/rooms";
import { clampItem, clampOpening, uid } from "./geometry";
import { floors } from "./materials";
import type { Design, Opening, PlacedItem, Room, RoomType, StartKind } from "./types";

export const roomTypes: { id: RoomType; label: string; blurb: string }[] = [
  { id: "bedroom", label: "Bedroom", blurb: "Beds, wardrobes and bedside storage" },
  { id: "living", label: "Living room", blurb: "Sofas, rugs and media storage" },
  { id: "dining", label: "Dining room", blurb: "Tables, chairs and sideboards" },
  { id: "office", label: "Home office", blurb: "Desks, chairs and shelving" },
];

export const roomTypeLabel = (t: RoomType) => roomTypes.find((r) => r.id === t)?.label ?? "Room";

const door = (wall: Opening["wall"], offset: number, width = 85): Opening => ({ id: uid(), kind: "door", wall, offset, width, height: 205, sill: 0 });
const win = (wall: Opening["wall"], offset: number, width = 120, sill = 90, height = 130): Opening => ({ id: uid(), kind: "window", wall, offset, width, height, sill });

type Seed = [productId: string, x: number, z: number, rotation: number, finish: string, variant?: number, size?: [number, number]];

const place = (seeds: Seed[]): PlacedItem[] =>
  seeds.map(([productId, x, z, rotation, finish, variant = 0, size]) => ({
    uid: uid(), productId, x, z, rotation, finish, variant, ...(size ? { w: size[0], d: size[1] } : {}),
  }));

type Template = { room: Omit<Room, "openings" | "type">; openings: () => Opening[]; items: () => PlacedItem[]; name: string };

const templates: Record<RoomType, Template> = {
  bedroom: {
    name: "My bedroom",
    room: { width: 380, length: 420, height: 260, floor: "natural-oak", wallColor: "#d9d4cc", wallFinish: "matt" },
    openings: () => [win("east", 120), door("south", 230)],
    items: () => place([
      ["dune-rug", 190, 190, 90, "rug-natural", 0, [170, 240]],
      ["rowan-bed", 190, 105, 0, "light-grey", 1],
      ["nook-bedside", 83, 22, 0, "oak"],
      ["nook-bedside", 297, 22, 0, "oak"],
      ["zephyr-table-lamp", 83, 22, 0, "white-metal"],
      ["zephyr-table-lamp", 297, 22, 0, "white-metal"],
      ["tarn-wardrobe", 30, 320, 90, "white", 1],
      ["vale-drawers", 355, 300, 270, "oak"],
      ["fig-plant", 345, 390, 0, "pot-clay"],
      ["juniper-pendant", 190, 210, 0, "white-metal"],
    ]),
  },
  living: {
    name: "My living room",
    room: { width: 450, length: 520, height: 270, floor: "light-ash", wallColor: "#f1efea", wallFinish: "matt" },
    openings: () => [win("north", 300, 160, 60, 160), door("south", 120, 90)],
    items: () => place([
      ["dune-rug", 280, 260, 90, "rug-grey", 0, [200, 300]],
      ["moor-tv-bench", 21, 260, 90, "walnut", 1],
      ["brae-sofa", 404, 260, 270, "beige", 1],
      ["pebble-coffee-table", 270, 260, 90, "oak"],
      ["cove-armchair", 320, 430, 200, "terracotta"],
      ["cove-armchair", 320, 90, 340, "sage"],
      ["sorrel-bookcase", 100, 16, 0, "walnut"],
      ["kestrel-floor-lamp", 420, 120, 0, "brass"],
      ["isle-round-coffee-table", 420, 400, 0, "walnut"],
      ["sprig-plant", 420, 400, 0, "pot-white"],
      ["fig-plant", 40, 480, 0, "pot-white"],
    ]),
  },
  dining: {
    name: "My dining room",
    room: { width: 400, length: 420, height: 260, floor: "honey-oak", wallColor: "#aab9c3", wallFinish: "satin" },
    openings: () => [win("north", 200, 180), door("east", 350)],
    items: () => place([
      ["dune-rug", 200, 210, 0, "rug-natural", 0, [300, 220]],
      ["glen-dining-table", 200, 210, 0, "oak", 1],
      ["fern-chair", 160, 150, 0, "oak"],
      ["fern-chair", 240, 150, 0, "oak"],
      ["fern-chair", 160, 270, 180, "oak"],
      ["fern-chair", 240, 270, 180, "oak"],
      ["fern-chair", 105, 210, 90, "oak"],
      ["fern-chair", 295, 210, 270, "oak"],
      ["umber-sideboard", 23, 210, 90, "walnut"],
      ["willow-display-cabinet", 379, 150, 270, "oak"],
      ["juniper-pendant", 200, 210, 0, "black-metal", 1],
      ["fig-plant", 360, 40, 0, "pot-clay"],
    ]),
  },
  office: {
    name: "My home office",
    room: { width: 300, length: 340, height: 260, floor: "greywash", wallColor: "#a3b199", wallFinish: "panelling" },
    openings: () => [win("north", 160, 120, 95, 120), door("south", 90)],
    items: () => place([
      ["dune-round-rug", 150, 230, 0, "rug-terracotta", 0, [160, 160]],
      ["linnet-desk", 160, 36, 0, "oak", 1],
      ["quill-office-chair", 160, 105, 180, "dark-grey"],
      ["zephyr-table-lamp", 215, 22, 0, "black-metal"],
      ["sorrel-bookcase", 16, 200, 90, "white"],
      ["yarrow-cube-shelf", 280, 210, 270, "white"],
      ["cove-armchair", 210, 290, 225, "mustard"],
      ["kestrel-floor-lamp", 275, 310, 0, "black-metal"],
      ["fig-plant", 35, 40, 0, "pot-black"],
    ]),
  },
};

export function createDesign(type: RoomType, start: StartKind): Design {
  const t = templates[type];
  const room: Room = { ...t.room, type, openings: t.openings() };
  return { name: t.name, room, items: start === "furnished" ? t.items().map((i) => clampItem(i, room)) : [] };
}

/** Pick the floor finish closest in colour to a landing-page room's floor. */
function nearestFloor(hex: string): string {
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r, g, b] = rgb(hex);
  let best = floors[0];
  let bestD = Infinity;
  for (const f of floors) {
    const [fr, fg, fb] = rgb(f.color);
    const d = (r - fr) ** 2 + (g - fg) ** 2 + (b - fb) ** 2;
    if (d < bestD) {
      best = f;
      bestD = d;
    }
  }
  return best.id;
}

const kitchenAsDining = { kitchen: "dining", living: "living", bedroom: "bedroom", office: "office", dining: "dining" } as const;

/**
 * Start from one of the landing page's rooms. Empty rooms carry their shell
 * (size, colours, windows); furnished photos map to that room type's
 * furnished template.
 */
export function designFromLandingRoom(slug: string, fallbackType: RoomType = "bedroom"): Design | null {
  const source = getRoom(slug);
  if (!source) return null;
  if (source.kind === "furnished") {
    const design = createDesign(kitchenAsDining[source.category], "furnished");
    return { ...design, name: source.name };
  }
  const { shell } = source;
  // The illustration's left wall runs along the room's depth (west wall),
  // the right wall along its width (north wall).
  const width = Math.round(shell.width * 100);
  const length = Math.round(shell.depth * 100);
  const room: Room = {
    type: fallbackType,
    width,
    length,
    height: 260,
    floor: nearestFloor(shell.floor),
    wallColor: shell.wallRight,
    wallFinish: "matt",
    openings: [],
  };
  for (const w of shell.windows ?? []) {
    const wall = w.wall === "left" ? "west" : "north";
    const len = wall === "west" ? length : width;
    const size = Math.round((w.size ?? 1) * 110);
    room.openings.push(clampOpening(win(wall, Math.round(w.at * len), size, 85, 140), room));
  }
  if (shell.door) {
    const wall = shell.door.wall === "left" ? "west" : "north";
    const len = wall === "west" ? length : width;
    room.openings.push(clampOpening(door(wall, Math.round(shell.door.at * len)), room));
  }
  return { name: source.name, room, items: [] };
}
