import type { RoomCategory } from "./site";

/** Full Unsplash CDN URL for a photo id; sizing is added by the image loader. */
export const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}`;

/** Wall/floor colours and openings for an illustrated empty room (IsoRoom). */
export type RoomShell = {
  wallLeft: string;
  wallRight: string;
  floor: string;
  /** Room footprint in metres: depth along the left wall, width along the right. */
  depth: number;
  width: number;
  windows?: { wall: "left" | "right"; at: number; size?: number }[];
  door?: { wall: "left" | "right"; at: number };
  sunlight?: boolean;
};

type Base = { slug: string; name: string; sqft: number; blurb: string };

export type EmptyRoom = Base & { kind: "empty"; shell: RoomShell };

export type FurnishedRoom = Base & {
  kind: "furnished";
  category: RoomCategory;
  furnishing: "full" | "partial";
  image: string;
  alt: string;
};

export type Room = EmptyRoom | FurnishedRoom;

const OAK = "#b9875a";
const WALNUT = "#8a5a3b";
const ASH = "#d2b48e";

export const emptyRooms: EmptyRoom[] = [
  {
    slug: "simple-square", name: "Simple square", sqft: 180, kind: "empty",
    blurb: "A balanced, square room with one window - the easiest place to test a first idea.",
    shell: { wallLeft: "#ecebe7", wallRight: "#f3f2ee", floor: OAK, depth: 4, width: 4, windows: [{ wall: "left", at: 0.5 }], door: { wall: "right", at: 0.78 } },
  },
  {
    slug: "long-and-bright", name: "Long and bright", sqft: 410, kind: "empty",
    blurb: "A long room with three windows along one side, good for zoning living and dining.",
    shell: { wallLeft: "#efeeea", wallRight: "#f5f4f0", floor: ASH, depth: 3.6, width: 7.2, windows: [{ wall: "right", at: 0.22 }, { wall: "right", at: 0.5 }, { wall: "right", at: 0.78 }], sunlight: true },
  },
  {
    slug: "sunlit-corner", name: "Sunlit corner", sqft: 260, kind: "empty",
    blurb: "Windows on both walls meet in a bright corner made for a reading chair.",
    shell: { wallLeft: "#f2f1ed", wallRight: "#f7f6f2", floor: OAK, depth: 4.4, width: 5, windows: [{ wall: "left", at: 0.72, size: 1.2 }, { wall: "right", at: 0.26, size: 1.2 }], sunlight: true },
  },
  {
    slug: "warm-walnut", name: "Warm walnut", sqft: 192, kind: "empty",
    blurb: "Deep chocolate walls and a dark floor for a snug, enveloping room.",
    shell: { wallLeft: "#5a3a2c", wallRight: "#6b4535", floor: WALNUT, depth: 4, width: 4.4, windows: [{ wall: "right", at: 0.6 }], door: { wall: "left", at: 0.3 } },
  },
  {
    slug: "soft-clay", name: "Soft clay", sqft: 172, kind: "empty",
    blurb: "Earthy clay walls with a wide window that floods the floor with light.",
    shell: { wallLeft: "#c9b39c", wallRight: "#d6c2ad", floor: ASH, depth: 3.8, width: 4.2, windows: [{ wall: "right", at: 0.45, size: 1.6 }], sunlight: true },
  },
  {
    slug: "blush-retreat", name: "Blush retreat", sqft: 164, kind: "empty",
    blurb: "Gentle blush walls and golden oak, sized for a calm bedroom.",
    shell: { wallLeft: "#d9b3a6", wallRight: "#e4c2b6", floor: "#c08a4e", depth: 3.6, width: 4.2, windows: [{ wall: "right", at: 0.55 }], sunlight: true },
  },
  {
    slug: "coastal-blue", name: "Coastal blue", sqft: 226, kind: "empty",
    blurb: "Hazy blue walls and pale oak - a fresh starting point for any room.",
    shell: { wallLeft: "#9fb3bd", wallRight: "#adc0c9", floor: OAK, depth: 4.2, width: 4.8, windows: [{ wall: "left", at: 0.4 }], door: { wall: "right", at: 0.7 } },
  },
  {
    slug: "sage-studio", name: "Sage studio", sqft: 226, kind: "empty",
    blurb: "Muted sage green that works as well for a study as for a bedroom.",
    shell: { wallLeft: "#7d8f72", wallRight: "#8b9d80", floor: OAK, depth: 4.2, width: 4.8, windows: [{ wall: "right", at: 0.4 }] },
  },
  {
    slug: "charcoal-loft", name: "Charcoal loft", sqft: 300, kind: "empty",
    blurb: "A generous, dramatic room with charcoal walls and tall windows.",
    shell: { wallLeft: "#4a4b4d", wallRight: "#56575a", floor: ASH, depth: 5, width: 5.6, windows: [{ wall: "left", at: 0.35, size: 1.3 }, { wall: "left", at: 0.72, size: 1.3 }] },
  },
  {
    slug: "butter-yellow", name: "Butter yellow", sqft: 150, kind: "empty",
    blurb: "A small, cheerful room - ideal for a nursery or a compact study.",
    shell: { wallLeft: "#e8d48f", wallRight: "#efdea2", floor: ASH, depth: 3.4, width: 4, windows: [{ wall: "right", at: 0.5 }], door: { wall: "left", at: 0.75 } },
  },
  {
    slug: "lavender-nook", name: "Lavender nook", sqft: 140, kind: "empty",
    blurb: "Soft lavender walls for the smallest bedroom in the house.",
    shell: { wallLeft: "#b8afc9", wallRight: "#c5bdd4", floor: OAK, depth: 3.2, width: 4, windows: [{ wall: "left", at: 0.55 }] },
  },
  {
    slug: "open-plan", name: "Open plan", sqft: 480, kind: "empty",
    blurb: "A large open-plan space for laying out living, dining and kitchen together.",
    shell: { wallLeft: "#efeeea", wallRight: "#f4f3ef", floor: OAK, depth: 5.6, width: 7.6, windows: [{ wall: "left", at: 0.3 }, { wall: "right", at: 0.3 }, { wall: "right", at: 0.66 }], door: { wall: "left", at: 0.8 }, sunlight: true },
  },
];

const furnished = (
  slug: string, name: string, sqft: number, category: RoomCategory,
  furnishing: FurnishedRoom["furnishing"], id: string, alt: string, blurb: string,
): FurnishedRoom => ({ slug, name, sqft, category, furnishing, image: unsplash(id), alt, blurb, kind: "furnished" });

/** Ordered so the default "All" view opens on a mix of room types. */
export const furnishedRooms: FurnishedRoom[] = [
  furnished("sunlit-loft-lounge", "Sunlit loft lounge", 312, "living", "full", "1618221195710-dd6b41faaea6", "Long living room with a grey sofa, rust ottomans and a clerestory window", "A long lounge built around a low sofa and warm rust accents under a strip of high windows."),
  furnished("quilted-headboard-suite", "Quilted headboard suite", 238, "bedroom", "full", "1616594039964-ae9021a400a0", "Bedroom with a channel-quilted headboard and sheepskin stools", "Layered whites and a sculptural headboard against a deep charcoal wall."),
  furnished("green-study", "Green study", 162, "office", "full", "1600494603989-9650cf6ddd3d", "Home office with a forest-green wall and a dark wood desk", "A focused study with a forest-green accent wall, a long desk and a reading corner."),
  furnished("teal-dining-room", "Teal dining room", 180, "dining", "full", "1615066390971-03e4e1c36ddf", "Dining room with a timber table, grey chairs and a teal wall", "A six-seat timber table set against a teal wall and one bold piece of art."),
  furnished("soft-neutral-living", "Soft neutral living", 248, "living", "full", "1616486338812-3dadae4b4ace", "Neutral living room with a cream sectional and round coffee table", "Cream upholstery, rattan and round shapes for a soft, relaxed living room."),
  furnished("bohemian-bedroom", "Bohemian bedroom", 168, "bedroom", "full", "1615874959474-d609969a20ed", "Bedroom with hanging plants, a rattan pendant and an orange cushion", "Trailing plants, rattan and a pop of orange in a light-filled bedroom."),
  furnished("white-island-kitchen", "White island kitchen", 240, "kitchen", "full", "1507089947368-19c1da9775ae", "Bright white kitchen with a marble island and pendant lights", "An all-white kitchen around a marble island with seating for three."),
  furnished("gallery-wall-living", "Gallery-wall living", 226, "living", "full", "1600210492486-724fe5c67fb0", "Living room with a grid gallery wall, leather sofa and plants", "A grid of framed prints above a caramel leather sofa and lots of greenery."),
  furnished("timber-feature-lounge", "Timber feature lounge", 290, "living", "full", "1600607687939-ce8a6c25118c", "Open living room with a timber feature wall and abstract art", "An open lounge anchored by a timber feature wall and a colourful canvas."),
  furnished("hotel-style-bedroom", "Hotel-style bedroom", 210, "bedroom", "full", "1540518614846-7eded433c457", "Bedroom with an orange bench pair and a navy throw", "Crisp linen, navy and a pair of orange benches for a hotel feel at home."),
  furnished("green-chair-dining", "Green-chair dining", 170, "dining", "full", "1617806118233-18e1de247200", "Dining room with emerald velvet chairs and a round mirror", "Emerald velvet chairs and a round mirror make a small dining room feel special."),
  furnished("studio-work-lounge", "Studio work lounge", 280, "office", "full", "1524758631624-e2822e304c36", "Bright work lounge with teal chairs and a glass partition", "A shared workspace with soft seating and a glazed partition for calls."),
  furnished("blue-sofa-living", "Blue sofa living", 204, "living", "full", "1493809842364-78817add7ffb", "Living room with a blue sofa and white media unit", "A cobalt sofa, herringbone floor and low white storage under the windows."),
  furnished("gallery-bedroom", "Gallery bedroom", 196, "bedroom", "full", "1617098900591-3f90928e8c54", "Bedroom with framed art above a grey upholstered bed", "Framed art, a crystal pendant and soft greys in a symmetrical bedroom."),
  furnished("monochrome-kitchen", "Monochrome kitchen", 190, "kitchen", "full", "1484154218962-a197022b5858", "White kitchen with black pendants and bar stools", "White cabinets, a dark splashback and black pendants over the breakfast bar."),
  furnished("open-plan-dining", "Open-plan dining", 205, "dining", "full", "1522708323590-d24dbb6b0267", "Open-plan dining area with a red armchair and kitchen beyond", "A dining corner that flows into the kitchen, with a red armchair for colour."),
  furnished("coffered-ceiling-lounge", "Coffered-ceiling lounge", 330, "living", "full", "1598928506311-c55ded91a20c", "Formal living room with a coffered ceiling and built-in shelves", "A formal lounge with built-in shelving either side of the fireplace."),
  furnished("moody-bedroom", "Moody bedroom", 224, "bedroom", "full", "1617104678098-de229db51175", "Bedroom with a black wall, dark curtains and a tall window", "Black walls and heavy curtains for a dark, restful sleeping room."),
  furnished("two-tone-kitchen", "Two-tone kitchen", 210, "kitchen", "full", "1588854337236-6889d631faa8", "Kitchen with blue and dark wood cabinets and a marble counter", "Blue and smoked-oak cabinets with a waterfall marble counter."),
  furnished("monochrome-living", "Monochrome living", 262, "living", "full", "1600121848594-d8644e57abab", "Grey living room with black shelving and a pendant light", "Greys and black shelving balanced by a pale rug and warm light."),
  furnished("classic-tufted-bedroom", "Classic tufted bedroom", 230, "bedroom", "full", "1505693416388-ac5ce068fe85", "Bedroom with a tufted headboard and an upholstered bench", "A tufted headboard, mirrored chests and a bench at the foot of the bed."),
  furnished("twin-window-lounge", "Twin-window lounge", 236, "living", "full", "1505691938895-1758d7feb511", "Living room between two windows with a white sofa and teal accents", "A white sofa between twin windows, with teal accents and a large canvas."),
  furnished("airy-guest-bedroom", "Airy guest bedroom", 172, "bedroom", "full", "1595526114035-0d45ed16cfbf", "White guest bedroom with a black accent chair", "A light, simple guest room with white bedding and one black accent chair."),
  furnished("boho-living", "Boho living", 240, "living", "full", "1556228453-efd6c1ff04f6", "Living room with a macrame hanging, lilac chairs and a leather sofa", "Macrame, lilac chairs and a tan leather sofa in a relaxed boho mix."),
  furnished("curved-sofa-nook", "Curved sofa nook", 188, "living", "partial", "1631679706909-1844bbd07221", "Living nook with a curved cream sofa and round mirrors", "A curved cream sofa and two round mirrors - add your own storage and lighting."),
  furnished("sunny-reading-corner", "Sunny reading corner", 140, "living", "partial", "1586023492125-27b2c045efd7", "Reading corner with a yellow armchair and brass floor lamp", "One mustard armchair and a brass lamp; the rest of the room is yours to plan."),
  furnished("botanical-sideboard", "Botanical sideboard", 156, "living", "partial", "1618220179428-22790b461013", "Corner with a yellow sideboard, orange chair and large plants", "A sunny sideboard, an orange chair and big plants to build around."),
  furnished("low-platform-bedroom", "Low platform bedroom", 160, "bedroom", "partial", "1617325247661-675ab4b64ae2", "Bedroom with a low wooden platform bed and white bedding", "A low timber bed in an otherwise empty room - add storage and side tables."),
  furnished("minimal-bedside", "Minimal bedside", 132, "bedroom", "partial", "1522771739844-6a9f6d5f14af", "Bed with patterned cushions beside a small wooden side table", "Just the bed and a bedside table; plan the wardrobe and lighting yourself."),
  furnished("bright-desk-corner", "Bright desk corner", 96, "office", "partial", "1518455027359-f3f8164ba6bd", "White desk with a computer, grey chair and a plant", "A white desk and task chair - add shelving and storage around them."),
  furnished("evening-workspace", "Evening workspace", 110, "office", "partial", "1593062096033-9a26b09da705", "Wooden desk with a laptop and a hanging bulb at dusk", "A timber desk under a single bulb, ready for you to furnish the rest."),
  furnished("galley-prep-kitchen", "Galley prep kitchen", 150, "kitchen", "partial", "1556911220-bff31c812dba", "White galley kitchen with fresh produce on the counter", "Base and wall cabinets are in; choose the finishes, lighting and extras."),
];

export const allRooms: Room[] = [...emptyRooms, ...furnishedRooms];

export const getRoom = (slug: string) => allRooms.find((r) => r.slug === slug);

/** Other photos used outside the room grids. */
export const photos = {
  hero: { src: unsplash("1513694203232-719a280e022f"), alt: "Pale grey room with a black two-seat sofa, a fig tree, a white chest of drawers and a floor lamp" },
  sampleRoom: { src: unsplash("1560448204-e02f11c3d0e2"), alt: "Bright, open living room with large windows and a pair of armchairs" },
  stylist: { src: unsplash("1581291518857-4e27b48ff24e"), alt: "A hand sketching a furnished floor plan with a pen" },
  appScene: { src: unsplash("1502672260266-1c1ef2d93688"), alt: "Plant-filled living room with a sofa and a round coffee table" },
  appScreen: { src: unsplash("1484101403633-562f891dc89a"), alt: "Room plan preview showing a blue sofa beneath a framed print" },
  storageWall: { src: unsplash("1594026112284-02bb6f3352fe"), alt: "Wall-mounted shelving and a floating media unit in warm oak" },
};
