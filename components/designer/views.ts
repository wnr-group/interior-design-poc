import type { Ref } from "react";
import type { Design, PlacedItem } from "@/lib/designer/types";

/** What the editor shell can ask of either view (3D or plan). */
export type ViewHandle = {
  zoom: (direction: 1 | -1) => void;
  reset: () => void;
  /** PNG data URL of the view; a smaller JPEG when maxWidth is given. */
  capture: (maxWidth?: number) => Promise<string>;
  /** Room-space floor point (cm) under a client coordinate. */
  floorPointAt: (clientX: number, clientY: number) => { x: number; z: number } | null;
};

export type Gesture = {
  start: () => void;
  preview: (uid: string, patch: Partial<PlacedItem>) => void;
  end: () => void;
};

export type ViewProps = {
  design: Design;
  selectedId: string | null;
  clashing: boolean;
  onSelect: (uid: string | null) => void;
  gesture: Gesture;
  ref?: Ref<ViewHandle>;
};
