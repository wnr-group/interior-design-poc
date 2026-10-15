/**
 * Room designer data model. Everything is in centimetres.
 *
 * Room space: x runs west → east (0..width), z runs north → south
 * (0..length), y is up. Furniture faces +z ("south") at rotation 0, so a
 * piece at rotation 0 has its back against the north wall; rotation turns it
 * anticlockwise when seen from above (90 = back to the west wall).
 */

export type RoomType = "bedroom" | "living" | "dining" | "office";

export type WallSide = "north" | "east" | "south" | "west";

export type Opening = {
  id: string;
  kind: "door" | "window";
  wall: WallSide;
  /** Centre of the opening along its wall, measured from the west (north/south walls) or north (east/west walls). */
  offset: number;
  width: number;
  height: number;
  /** Height of the bottom edge above the floor; 0 for doors. */
  sill: number;
};

export type Room = {
  type: RoomType;
  width: number;
  length: number;
  height: number;
  floor: string;
  wallColor: string;
  wallFinish: string;
  openings: Opening[];
};

export type PlacedItem = {
  uid: string;
  productId: string;
  /** Centre of the footprint. */
  x: number;
  z: number;
  /** Degrees, 0-359. */
  rotation: number;
  finish: string;
  /** Index into the product's sizes. */
  variant: number;
  /** Free width/depth for resizable products (rugs). */
  w?: number;
  d?: number;
};

export type Design = {
  name: string;
  room: Room;
  items: PlacedItem[];
};

export type StartKind = "furnished" | "empty";
