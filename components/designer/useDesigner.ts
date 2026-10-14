"use client";

import { useCallback, useMemo, useReducer, useState } from "react";
import { getProduct } from "@/lib/designer/catalog";
import {
  clampItem, clampOpening, clampToRoom, clashesWith, findFreeSpot, itemDims, itemPrice, normDeg, uid, wallLength,
} from "@/lib/designer/geometry";
import { historyReducer, initHistory } from "@/lib/designer/history";
import type { Design, Opening, PlacedItem, Room } from "@/lib/designer/types";

export type Session = {
  baseline: Design;
  savedId: string | null;
  savedSnapshot: string | null;
};

/** Apply a change to one item, clamped inside the room. */
function mapItem(d: Design, id: string, fn: (i: PlacedItem) => PlacedItem): Design {
  let changed = false;
  const items = d.items.map((i) => {
    if (i.uid !== id) return i;
    const next = clampItem(fn(i), d.room);
    changed = changed || JSON.stringify(next) !== JSON.stringify(i);
    return next;
  });
  return changed ? { ...d, items } : d;
}

/**
 * All editing operations on a design. Every operation keeps the design
 * valid: furniture is clamped inside the room, openings stay on their wall.
 */
export function useDesigner(initial: Design, initialSession: Session) {
  const [history, dispatch] = useReducer(historyReducer, initial, initHistory);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [session, setSession] = useState<Session>(initialSession);
  const design = history.present;

  const commit = useCallback((update: (d: Design) => Design, key?: string) => dispatch({ type: "commit", update, key, at: Date.now() }), []);

  const addProduct = useCallback((productId: string, at?: { x: number; z: number }) => {
    const product = getProduct(productId);
    if (!product) return;
    const draft: PlacedItem = { uid: uid(), productId, x: 0, z: 0, rotation: 0, finish: product.finishes[0], variant: 0 };
    commit((cur) => {
      const spot = at ? clampToRoom(at.x, at.z, itemDims(draft, product), 0, cur.room) : findFreeSpot(draft, cur.items, cur.room);
      return { ...cur, items: [...cur.items, { ...draft, ...spot }] };
    });
    setSelectedId(draft.uid);
  }, [commit]);

  const updateItem = useCallback((id: string, patch: Partial<PlacedItem>, key?: string) => {
    commit((d) => mapItem(d, id, (i) => ({ ...i, ...patch, ...(patch.rotation !== undefined ? { rotation: normDeg(patch.rotation) } : {}) })), key);
  }, [commit]);

  const rotateBy = useCallback((id: string, delta: number) => {
    commit((d) => mapItem(d, id, (i) => ({ ...i, rotation: normDeg(i.rotation + delta) })), `rotate:${id}`);
  }, [commit]);

  const removeItem = useCallback((id: string) => {
    commit((d) => ({ ...d, items: d.items.filter((i) => i.uid !== id) }));
    setSelectedId((s) => (s === id ? null : s));
  }, [commit]);

  const duplicateItem = useCallback((id: string) => {
    const copyId = uid();
    commit((cur) => {
      const src = cur.items.find((i) => i.uid === id);
      if (!src) return cur;
      return { ...cur, items: [...cur.items, clampItem({ ...src, uid: copyId, x: src.x + 30, z: src.z + 30 }, cur.room)] };
    });
    setSelectedId(copyId);
  }, [commit]);

  const clearItems = useCallback(() => {
    commit((d) => (d.items.length ? { ...d, items: [] } : d));
    setSelectedId(null);
  }, [commit]);

  /** Room changes re-clamp every item and opening so nothing ends up outside. */
  const updateRoom = useCallback((patch: Partial<Room>, key?: string) => {
    commit((d) => {
      const room = { ...d.room, ...patch };
      room.openings = room.openings.map((o) => clampOpening(o, room));
      return { ...d, room, items: d.items.map((i) => clampItem(i, room)) };
    }, key);
  }, [commit]);

  const addOpening = useCallback((kind: Opening["kind"]) => {
    commit((d) => {
      const used = new Set(d.room.openings.map((o) => o.wall));
      const wall = (["south", "west", "north", "east"] as const).find((w) => !used.has(w)) ?? "south";
      const base: Opening = kind === "door"
        ? { id: uid(), kind, wall, offset: 0, width: 85, height: 205, sill: 0 }
        : { id: uid(), kind, wall, offset: 0, width: 120, height: 130, sill: 90 };
      const o = clampOpening({ ...base, offset: wallLength(d.room, wall) / 2 }, d.room);
      return { ...d, room: { ...d.room, openings: [...d.room.openings, o] } };
    });
  }, [commit]);

  const updateOpening = useCallback((id: string, patch: Partial<Opening>, key?: string) => {
    commit((d) => {
      const openings = d.room.openings.map((o) => {
        if (o.id !== id) return o;
        const next = { ...o, ...patch };
        // Moving to another wall keeps the opening centred on it.
        if (patch.wall && patch.wall !== o.wall) next.offset = wallLength(d.room, patch.wall) / 2;
        return clampOpening(next, d.room);
      });
      return { ...d, room: { ...d.room, openings } };
    }, key);
  }, [commit]);

  const removeOpening = useCallback((id: string) => {
    commit((d) => ({ ...d, room: { ...d.room, openings: d.room.openings.filter((o) => o.id !== id) } }));
  }, [commit]);

  /** Swap in a whole design as one undoable step (reset to the starting layout). */
  const replace = useCallback((next: Design) => {
    commit(() => next);
    setSelectedId(null);
  }, [commit]);

  const rename = useCallback((name: string) => {
    commit((d) => (d.name === name ? d : { ...d, name }), "name");
  }, [commit]);

  // Canvas gestures (drag, rotate handle, resize handle) record a single undo step.
  const gesture = useMemo(() => ({
    start: () => dispatch({ type: "gestureStart" }),
    preview: (id: string, patch: Partial<PlacedItem>) =>
      dispatch({ type: "gesturePreview", update: (d) => mapItem(d, id, (i) => ({ ...i, ...patch, ...(patch.rotation !== undefined ? { rotation: normDeg(patch.rotation) } : {}) })) }),
    end: () => dispatch({ type: "gestureEnd" }),
  }), []);

  const load = useCallback((next: Design, nextSession: Session) => {
    dispatch({ type: "reset", design: next });
    setSession(nextSession);
    setSelectedId(null);
  }, []);

  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  const selected = design.items.find((i) => i.uid === selectedId) ?? null;
  const clashes = useMemo(() => (selected ? clashesWith(selected, design.items) : []), [selected, design.items]);
  const total = useMemo(() => design.items.reduce((sum, i) => sum + itemPrice(i), 0), [design.items]);
  const snapshot = useMemo(() => JSON.stringify(design), [design]);
  const dirty = session.savedSnapshot !== snapshot;

  return {
    design, history, selected, selectedId, setSelectedId, session, setSession, clashes, total, snapshot, dirty,
    canUndo: history.past.length > 0, canRedo: history.future.length > 0,
    addProduct, updateItem, rotateBy, removeItem, duplicateItem, clearItems,
    updateRoom, addOpening, updateOpening, removeOpening, rename, replace, gesture, load, undo, redo,
  };
}

export type DesignerApi = ReturnType<typeof useDesigner>;
