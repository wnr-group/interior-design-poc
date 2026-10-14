import type { RoomType } from "./types";

/** Sample furniture range for the room designer. Names and prices are fictional. */

export type CategoryId = "beds" | "seating" | "tables" | "storage" | "shelving" | "lighting" | "decor";

export const categories: { id: CategoryId; label: string }[] = [
  { id: "beds", label: "Beds & mattresses" },
  { id: "seating", label: "Sofas & chairs" },
  { id: "tables", label: "Tables & desks" },
  { id: "storage", label: "Wardrobes & storage" },
  { id: "shelving", label: "Shelves & cabinets" },
  { id: "lighting", label: "Lighting" },
  { id: "decor", label: "Rugs & décor" },
];

/** Which 3D/plan drawing a product uses. */
export type Model =
  | "bed" | "mattress" | "sofa" | "armchair" | "chair" | "officeChair" | "bench"
  | "table" | "roundTable" | "coffeeTable" | "roundCoffeeTable" | "desk" | "bedside"
  | "wardrobe" | "drawers" | "sideboard" | "tvBench"
  | "bookcase" | "cubeShelf" | "cabinet"
  | "floorLamp" | "tableLamp" | "pendant"
  | "rug" | "roundRug" | "plant" | "smallPlant" | "mirror";

export type Size = { w: number; d: number; h: number; label?: string; price?: number };

export type Product = {
  id: string;
  name: string;
  category: CategoryId;
  model: Model;
  blurb: string;
  price: number;
  sizes: Size[];
  finishes: string[];
  rooms: RoomType[];
  /** Hangs from the ceiling rather than standing on the floor. */
  ceiling?: boolean;
  /** Small enough to stand on top of another piece (lamps, small plants). */
  stackable?: boolean;
  /** Has a usable top surface that stackable pieces can stand on. */
  surface?: boolean;
  /** Lies flat on the floor: other pieces may stand on it without overlapping. */
  flat?: boolean;
  /** Width and depth can be set freely within these limits. */
  resizable?: { min: [number, number]; max: [number, number] };
};

const WOOD = ["oak", "birch", "walnut", "white", "black-brown"];
const FABRIC = ["light-grey", "dark-grey", "beige", "sage", "terracotta", "navy"];

export const products: Product[] = [
  // Beds & mattresses
  {
    id: "rowan-bed", name: "Rowan upholstered bed", category: "beds", model: "bed",
    blurb: "Upholstered bed frame with a tall padded headboard.", price: 32990,
    sizes: [
      { w: 140, d: 206, h: 105, label: "140 × 200", price: 28990 },
      { w: 160, d: 206, h: 105, label: "160 × 200" },
      { w: 180, d: 206, h: 105, label: "180 × 200", price: 36990 },
    ],
    finishes: ["light-grey", "dark-grey", "beige", "sage", "navy"], rooms: ["bedroom"],
  },
  {
    id: "alder-bed", name: "Alder wooden bed", category: "beds", model: "bed",
    blurb: "Solid wood frame with a low, slatted headboard.", price: 24990,
    sizes: [
      { w: 90, d: 206, h: 85, label: "90 × 200 (single)", price: 14990 },
      { w: 160, d: 206, h: 85, label: "160 × 200" },
      { w: 180, d: 206, h: 85, label: "180 × 200", price: 27990 },
    ],
    finishes: ["birch", "oak", "walnut", "white", "black-brown"], rooms: ["bedroom"],
  },
  {
    id: "cloud-mattress", name: "Cloud pocket-spring mattress", category: "beds", model: "mattress",
    blurb: "Medium-firm mattress; use it on its own or with a frame.", price: 18990,
    sizes: [
      { w: 90, d: 200, h: 24, label: "90 × 200", price: 11990 },
      { w: 160, d: 200, h: 24, label: "160 × 200" },
      { w: 180, d: 200, h: 24, label: "180 × 200", price: 21990 },
    ],
    finishes: ["white", "light-grey"], rooms: ["bedroom"],
  },

  // Sofas & chairs
  {
    id: "brae-sofa", name: "Brae 3-seat sofa", category: "seating", model: "sofa",
    blurb: "Deep seats and soft cushions on slim oak legs.", price: 45990,
    sizes: [
      { w: 180, d: 92, h: 82, label: "2-seat", price: 37990 },
      { w: 228, d: 92, h: 82, label: "3-seat" },
    ],
    finishes: [...FABRIC, "cognac"], rooms: ["living", "office"],
  },
  {
    id: "cove-armchair", name: "Cove armchair", category: "seating", model: "armchair",
    blurb: "A compact armchair for reading corners.", price: 15990,
    sizes: [{ w: 80, d: 84, h: 86 }],
    finishes: [...FABRIC, "mustard", "cognac"], rooms: ["living", "bedroom", "office"],
  },
  {
    id: "fern-chair", name: "Fern dining chair", category: "seating", model: "chair",
    blurb: "Solid wood chair with a curved back rest.", price: 4490,
    sizes: [{ w: 45, d: 52, h: 82 }],
    finishes: WOOD, rooms: ["dining", "office"],
  },
  {
    id: "quill-office-chair", name: "Quill office chair", category: "seating", model: "officeChair",
    blurb: "Swivel chair with adjustable height and armrests.", price: 12990,
    sizes: [{ w: 66, d: 66, h: 108 }],
    finishes: ["dark-grey", "light-grey", "navy", "sage"], rooms: ["office"],
  },
  {
    id: "heath-bench", name: "Heath bench", category: "seating", model: "bench",
    blurb: "Simple bench for the end of a bed or a dining table.", price: 6990,
    sizes: [
      { w: 110, d: 38, h: 45, label: "110 cm", price: 5990 },
      { w: 140, d: 38, h: 45, label: "140 cm" },
    ],
    finishes: WOOD, rooms: ["bedroom", "dining"],
  },

  // Tables & desks
  {
    id: "glen-dining-table", name: "Glen dining table", category: "tables", model: "table",
    blurb: "Rectangular table seating four to eight.", price: 21990,
    sizes: [
      { w: 120, d: 80, h: 75, label: "120 × 80 (4 seats)", price: 15990 },
      { w: 160, d: 90, h: 75, label: "160 × 90 (6 seats)" },
      { w: 200, d: 95, h: 75, label: "200 × 95 (8 seats)", price: 27990 },
    ],
    finishes: WOOD, rooms: ["dining"], surface: true,
  },
  {
    id: "orchard-round-table", name: "Orchard round table", category: "tables", model: "roundTable",
    blurb: "Pedestal table for small dining corners.", price: 13990,
    sizes: [
      { w: 90, d: 90, h: 75, label: "Ø 90 cm" },
      { w: 115, d: 115, h: 75, label: "Ø 115 cm", price: 17990 },
    ],
    finishes: WOOD, rooms: ["dining"], surface: true,
  },
  {
    id: "pebble-coffee-table", name: "Pebble coffee table", category: "tables", model: "coffeeTable",
    blurb: "Low table with a shelf underneath.", price: 7990,
    sizes: [{ w: 110, d: 60, h: 42 }],
    finishes: WOOD, rooms: ["living"], surface: true,
  },
  {
    id: "isle-round-coffee-table", name: "Isle round coffee table", category: "tables", model: "roundCoffeeTable",
    blurb: "Round table on three splayed legs.", price: 6490,
    sizes: [
      { w: 50, d: 50, h: 50, label: "Ø 50 side table", price: 3490 },
      { w: 80, d: 80, h: 42, label: "Ø 80 coffee table" },
    ],
    finishes: WOOD, rooms: ["living", "bedroom"], surface: true,
  },
  {
    id: "linnet-desk", name: "Linnet desk", category: "tables", model: "desk",
    blurb: "Desk with a cable-managing back panel.", price: 11990,
    sizes: [
      { w: 120, d: 60, h: 75, label: "120 × 60", price: 9990 },
      { w: 140, d: 70, h: 75, label: "140 × 70" },
      { w: 160, d: 80, h: 75, label: "160 × 80", price: 13990 },
    ],
    finishes: WOOD, rooms: ["office", "bedroom"], surface: true,
  },
  {
    id: "nook-bedside", name: "Nook bedside table", category: "tables", model: "bedside",
    blurb: "One drawer and an open shelf.", price: 3990,
    sizes: [{ w: 45, d: 40, h: 55 }],
    finishes: WOOD, rooms: ["bedroom", "living"], surface: true,
  },

  // Wardrobes & storage
  {
    id: "tarn-wardrobe", name: "Tarn wardrobe", category: "storage", model: "wardrobe",
    blurb: "Hinged doors, a hanging rail and adjustable shelves.", price: 29990,
    sizes: [
      { w: 100, d: 58, h: 201, label: "100 cm, 2 doors", price: 19990 },
      { w: 150, d: 58, h: 201, label: "150 cm, 3 doors" },
      { w: 200, d: 58, h: 236, label: "200 cm, 4 doors, tall", price: 42990 },
    ],
    finishes: ["white", "oak", "walnut", "black-brown", "sage-paint"], rooms: ["bedroom"],
  },
  {
    id: "vale-drawers", name: "Vale chest of 4 drawers", category: "storage", model: "drawers",
    blurb: "Smooth-running drawers with pull-out stops.", price: 12990,
    sizes: [{ w: 80, d: 48, h: 95 }],
    finishes: ["white", "oak", "walnut", "black-brown", "sage-paint"], rooms: ["bedroom", "living"], surface: true,
  },
  {
    id: "umber-sideboard", name: "Umber sideboard", category: "storage", model: "sideboard",
    blurb: "Three doors on tapered legs.", price: 18990,
    sizes: [{ w: 160, d: 45, h: 80 }],
    finishes: WOOD, rooms: ["dining", "living"], surface: true,
  },
  {
    id: "moor-tv-bench", name: "Moor TV bench", category: "storage", model: "tvBench",
    blurb: "Low bench with two drawers and cable outlets.", price: 10990,
    sizes: [
      { w: 150, d: 40, h: 48, label: "150 cm", price: 9490 },
      { w: 180, d: 40, h: 48, label: "180 cm" },
    ],
    finishes: WOOD, rooms: ["living", "bedroom"], surface: true,
  },

  // Shelves & cabinets
  {
    id: "sorrel-bookcase", name: "Sorrel bookcase", category: "shelving", model: "bookcase",
    blurb: "Tall bookcase with five adjustable shelves.", price: 8990,
    sizes: [
      { w: 80, d: 30, h: 202, label: "80 × 202" },
      { w: 40, d: 30, h: 202, label: "40 × 202", price: 5490 },
    ],
    finishes: WOOD, rooms: ["living", "office", "bedroom"],
  },
  {
    id: "yarrow-cube-shelf", name: "Yarrow cube shelf", category: "shelving", model: "cubeShelf",
    blurb: "Eight open cubes for boxes, baskets and books.", price: 9990,
    sizes: [
      { w: 147, d: 39, h: 77, label: "4 × 2 cubes" },
      { w: 77, d: 39, h: 147, label: "2 × 4 cubes" },
    ],
    finishes: ["white", "birch", "oak", "black-brown"], rooms: ["living", "office", "bedroom"], surface: true,
  },
  {
    id: "willow-display-cabinet", name: "Willow glass-door cabinet", category: "shelving", model: "cabinet",
    blurb: "Display cabinet with glass doors and lit shelves.", price: 19990,
    sizes: [{ w: 81, d: 40, h: 180 }],
    finishes: ["white", "oak", "walnut", "black-brown"], rooms: ["dining", "living"],
  },

  // Lighting
  {
    id: "kestrel-floor-lamp", name: "Kestrel floor lamp", category: "lighting", model: "floorLamp",
    blurb: "Linen shade on a slender metal stand.", price: 4990,
    sizes: [{ w: 42, d: 42, h: 158 }],
    finishes: ["black-metal", "white-metal", "brass"], rooms: ["living", "bedroom", "office"],
  },
  {
    id: "zephyr-table-lamp", name: "Zephyr table lamp", category: "lighting", model: "tableLamp",
    blurb: "Small lamp for bedside tables and desks.", price: 1990,
    sizes: [{ w: 26, d: 26, h: 44 }],
    finishes: ["white-metal", "black-metal", "brass"], rooms: ["bedroom", "living", "office"], stackable: true,
  },
  {
    id: "juniper-pendant", name: "Juniper pendant lamp", category: "lighting", model: "pendant",
    blurb: "Dome pendant that hangs 80 cm below the ceiling.", price: 3490,
    sizes: [
      { w: 38, d: 38, h: 30, label: "Ø 38 cm" },
      { w: 50, d: 50, h: 36, label: "Ø 50 cm", price: 4490 },
    ],
    finishes: ["black-metal", "white-metal", "brass"], rooms: ["dining", "living", "bedroom", "office"], ceiling: true,
  },

  // Rugs & décor
  {
    id: "dune-rug", name: "Dune flatwoven rug", category: "decor", model: "rug",
    blurb: "Durable flatweave with a woven border. Any size from 60 × 90 cm.", price: 7990,
    sizes: [{ w: 170, d: 240, h: 1 }],
    finishes: ["rug-natural", "rug-grey", "rug-terracotta", "rug-blue"], rooms: ["living", "bedroom", "dining", "office"],
    flat: true, resizable: { min: [60, 60], max: [400, 500] },
  },
  {
    id: "dune-round-rug", name: "Dune round rug", category: "decor", model: "roundRug",
    blurb: "Round flatweave rug, 80 to 300 cm across.", price: 5990,
    sizes: [{ w: 160, d: 160, h: 1 }],
    finishes: ["rug-natural", "rug-grey", "rug-terracotta", "rug-blue"], rooms: ["living", "bedroom", "office"],
    flat: true, resizable: { min: [80, 80], max: [300, 300] },
  },
  {
    id: "fig-plant", name: "Fiddle-leaf fig in pot", category: "decor", model: "plant",
    blurb: "A large leafy plant in a ceramic pot.", price: 2490,
    sizes: [{ w: 55, d: 55, h: 150 }],
    finishes: ["pot-white", "pot-clay", "pot-black"], rooms: ["living", "bedroom", "dining", "office"],
  },
  {
    id: "sprig-plant", name: "Sprig potted plant", category: "decor", model: "smallPlant",
    blurb: "Small plant for shelves, desks and side tables.", price: 690,
    sizes: [{ w: 20, d: 20, h: 30 }],
    finishes: ["pot-white", "pot-clay", "pot-black"], rooms: ["living", "bedroom", "dining", "office"], stackable: true,
  },
  {
    id: "lumen-floor-mirror", name: "Lumen floor mirror", category: "decor", model: "mirror",
    blurb: "Full-length mirror that leans against the wall.", price: 5990,
    sizes: [{ w: 60, d: 12, h: 180 }],
    finishes: ["oak", "black-brown", "white", "brass"], rooms: ["bedroom", "living"],
  },
];

const byId = new Map(products.map((p) => [p.id, p]));

export const getProduct = (id: string): Product | undefined => byId.get(id);

export const priceFormat = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const formatPrice = (n: number) => priceFormat.format(n);
