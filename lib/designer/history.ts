import type { Design } from "./types";

/**
 * Undo/redo for the design. Three kinds of change:
 * - commit: one undo step (with optional coalescing, so a slider drag or
 *   typing into a number field becomes a single step);
 * - gesture: begin → many previews → end, recorded as one step (dragging
 *   furniture on the canvas);
 * - reset: replace everything and clear history (open, new design).
 */

export type History = {
  past: Design[];
  present: Design;
  future: Design[];
  /** Present at the start of the current gesture. */
  gestureBase: Design | null;
  lastKey: string | null;
  lastAt: number;
};

export type HistoryAction =
  | { type: "commit"; update: (d: Design) => Design; key?: string; at: number }
  | { type: "gestureStart" }
  | { type: "gesturePreview"; update: (d: Design) => Design }
  | { type: "gestureEnd" }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; design: Design };

const LIMIT = 100;
const COALESCE_MS = 1200;

export const initHistory = (design: Design): History => ({ past: [], present: design, future: [], gestureBase: null, lastKey: null, lastAt: 0 });

export function historyReducer(state: History, action: HistoryAction): History {
  switch (action.type) {
    case "commit": {
      const next = action.update(state.present);
      if (next === state.present) return state;
      const coalesce = action.key && action.key === state.lastKey && action.at - state.lastAt < COALESCE_MS;
      return {
        ...state,
        past: coalesce ? state.past : [...state.past, state.present].slice(-LIMIT),
        present: next,
        future: [],
        lastKey: action.key ?? null,
        lastAt: action.at,
      };
    }
    case "gestureStart":
      return { ...state, gestureBase: state.present, lastKey: null };
    case "gesturePreview": {
      const next = action.update(state.present);
      return next === state.present ? state : { ...state, present: next };
    }
    case "gestureEnd": {
      const base = state.gestureBase;
      if (!base) return state;
      if (base === state.present) return { ...state, gestureBase: null };
      return { ...state, past: [...state.past, base].slice(-LIMIT), future: [], gestureBase: null };
    }
    case "undo": {
      if (!state.past.length || state.gestureBase) return state;
      const prev = state.past[state.past.length - 1];
      return { ...state, past: state.past.slice(0, -1), present: prev, future: [state.present, ...state.future], lastKey: null };
    }
    case "redo": {
      if (!state.future.length || state.gestureBase) return state;
      const [next, ...rest] = state.future;
      return { ...state, past: [...state.past, state.present], present: next, future: rest, lastKey: null };
    }
    case "reset":
      return initHistory(action.design);
  }
}
