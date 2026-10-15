import { getProduct } from "./catalog";
import type { Design } from "./types";

/**
 * Saved designs and the working draft live in localStorage. Every access is
 * guarded: storage can be missing, full or blocked (private windows), and
 * the editor must keep working without it.
 */

const LIBRARY_KEY = "larkspur.designer.saved.v1";
const DRAFT_KEY = "larkspur.designer.draft.v1";

export type SavedDesign = {
  id: string;
  name: string;
  savedAt: number;
  thumbnail?: string;
  design: Design;
};

export type Draft = {
  design: Design;
  /** The design this session started from, for "Reset". */
  baseline: Design;
  /** Library id once saved. */
  savedId: string | null;
  /** Serialised design at the last save, to tell whether there are unsaved changes. */
  savedSnapshot: string | null;
  /** The URL query this draft was started from, so a reload resumes it rather than starting over. */
  bootQuery?: string;
};

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Drop items whose product no longer exists, so old saves still open. */
function sanitize(design: Design): Design {
  return { ...design, items: design.items.filter((i) => getProduct(i.productId)) };
}

const isDesign = (d: unknown): d is Design =>
  !!d && typeof d === "object" && "room" in d && "items" in d && Array.isArray((d as Design).items);

export function listSaved(): SavedDesign[] {
  const list = read<SavedDesign[]>(LIBRARY_KEY);
  return Array.isArray(list)
    ? list.filter((s) => isDesign(s?.design)).map((s) => ({ ...s, design: sanitize(s.design) })).sort((a, b) => b.savedAt - a.savedAt)
    : [];
}

export function getSaved(id: string): SavedDesign | undefined {
  return listSaved().find((s) => s.id === id);
}

/** Insert or replace a saved design. Retries without the thumbnail if storage is full. */
export function putSaved(entry: SavedDesign): boolean {
  const others = listSaved().filter((s) => s.id !== entry.id);
  if (write(LIBRARY_KEY, [entry, ...others])) return true;
  return write(LIBRARY_KEY, [{ ...entry, thumbnail: undefined }, ...others]);
}

export function deleteSaved(id: string): boolean {
  return write(LIBRARY_KEY, listSaved().filter((s) => s.id !== id));
}

export function loadDraft(): Draft | null {
  const draft = read<Draft>(DRAFT_KEY);
  if (!draft || !isDesign(draft.design) || !isDesign(draft.baseline)) return null;
  return { ...draft, design: sanitize(draft.design), baseline: sanitize(draft.baseline) };
}

export function saveDraft(draft: Draft): boolean {
  return write(DRAFT_KEY, draft);
}
