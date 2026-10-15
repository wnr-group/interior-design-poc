"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import clsx from "@/lib/clsx";
import { formatPrice, getProduct } from "@/lib/designer/catalog";
import { uid } from "@/lib/designer/geometry";
import { deleteSaved, listSaved, loadDraft, putSaved, saveDraft, type SavedDesign } from "@/lib/designer/storage";
import { createDesign, designFromLandingRoom, roomTypeLabel } from "@/lib/designer/templates";
import type { Design, RoomType, StartKind } from "@/lib/designer/types";
import Logo from "@/components/layout/Logo";
import { CloseIcon, PlusIcon } from "@/components/icons";
import CatalogPanel, { PRODUCT_MIME } from "./CatalogPanel";
import { ConfirmDialog, OpenDialog, SaveDialog, StartDialog } from "./Dialogs";
import {
  ArrowLeftIcon, CopyIcon, CubeIcon, DownloadIcon, FileIcon, FolderIcon, ListIcon, MoreIcon, PanelLeftIcon, PlanIcon,
  RecenterIcon, RedoIcon, RoomIcon, RotateLeftIcon, RotateRightIcon, SaveIcon, SlidersIcon, TrashIcon, UndoIcon, ZoomInIcon, ZoomOutIcon,
} from "./icons";
import ItemPanel from "./ItemPanel";
import ListPanel, { listCsv } from "./ListPanel";
import PlanView from "./PlanView";
import RoomPanel from "./RoomPanel";
import { IconButton, Menu, Segmented } from "./ui";
import { useDesigner, type Session } from "./useDesigner";
import type { ViewHandle } from "./views";

// three.js only loads on the client, in its own chunk.
const Viewport3D = dynamic(() => import("./Viewport3D"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 grid place-items-center text-sm text-ink-2">Loading 3D view…</div>,
});

type Boot = { design: Design; session: Session; dialog: "start" | "open" | null; notice: string | null };

const ROOM_TYPES: RoomType[] = ["bedroom", "living", "dining", "office"];

/**
 * Work out what to open, from (in order): ?design=<saved id>, ?from=<landing
 * room>, ?room=<type>&start=<furnished|empty>, the autosaved draft, or a
 * furnished bedroom with the start dialog open. A draft that was started
 * from this same query wins, so reloading the page resumes the work.
 */
function readBoot(query: string): Boot {
  const params = new URLSearchParams(query);
  const fresh = (design: Design, savedId: string | null = null): Session => ({
    baseline: design,
    savedId,
    savedSnapshot: savedId ? JSON.stringify(design) : null,
  });
  const openList = params.get("open") === "saved" ? "open" : null;
  const draft = loadDraft();
  const resumable = draft && query && draft.bootQuery === query && !openList;
  if (resumable) {
    return { design: draft.design, session: { baseline: draft.baseline, savedId: draft.savedId, savedSnapshot: draft.savedSnapshot }, dialog: null, notice: null };
  }

  const savedId = params.get("design");
  if (savedId) {
    const saved = listSaved().find((s) => s.id === savedId);
    if (saved) return { design: saved.design, session: fresh(saved.design, saved.id), dialog: null, notice: `Opened “${saved.name}”` };
  }
  const from = params.get("from");
  if (from) {
    const typeParam = params.get("room") as RoomType | null;
    const d = designFromLandingRoom(from, typeParam && ROOM_TYPES.includes(typeParam) ? typeParam : "bedroom");
    if (d) return { design: d, session: fresh(d), dialog: null, notice: `Started from “${d.name}”` };
  }
  const room = params.get("room") as RoomType | null;
  if (room && ROOM_TYPES.includes(room)) {
    const start: StartKind = params.get("start") === "empty" ? "empty" : "furnished";
    const d = createDesign(room, start);
    return { design: d, session: fresh(d), dialog: null, notice: null };
  }
  if (params.get("start") === "empty" || params.get("start") === "new") {
    const d = createDesign("bedroom", "furnished");
    return { design: d, session: fresh(d), dialog: "start", notice: null };
  }
  if (draft) {
    return { design: draft.design, session: { baseline: draft.baseline, savedId: draft.savedId, savedSnapshot: draft.savedSnapshot }, dialog: openList, notice: null };
  }
  const d = createDesign("bedroom", "furnished");
  return { design: d, session: fresh(d), dialog: openList ?? "start", notice: null };
}

const subscribeNever = () => () => {};

function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => true,
  );
}

function download(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const fileSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "room-design";

/**
 * Client-only: storage and the URL decide what opens, so nothing renders on
 * the server but a shell. The editor is keyed by the query because the
 * route stays mounted (hidden) between visits; arriving with new parameters
 * must start the requested design.
 */
export default function RoomDesigner() {
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const query = useSearchParams().toString();
  return mounted ? <Editor key={query} query={query} /> : <DesignerSkeleton />;
}

export function DesignerSkeleton() {
  return (
    <div className="flex h-dvh flex-col">
      <div className="flex h-14 items-center gap-3 border-b border-line px-4">
        <Logo compact />
        <div className="h-4 w-40 animate-pulse rounded bg-surface" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-[320px] border-r border-line lg:block" />
        <div className="grid flex-1 place-items-center bg-[#e7e5e0] text-sm text-ink-2">Loading the room designer…</div>
        <div className="hidden w-[340px] border-l border-line lg:block" />
      </div>
    </div>
  );
}

type Dialog = "start" | "save" | "open" | "reset" | "clear" | null;
type Sheet = "add" | "list" | "room" | "item" | null;

function Editor({ query }: { query: string }) {
  const [boot] = useState(() => readBoot(query));
  const api = useDesigner(boot.design, boot.session);
  const { design, selected, session } = api;
  const desktop = useMedia("(min-width: 1024px)");

  const viewRef = useRef<ViewHandle>(null);
  const [view, setView] = useState<"3d" | "plan">("3d");
  const [webgl, setWebgl] = useState(true);
  const [dialog, setDialog] = useState<Dialog>(boot.dialog);
  const [leftTab, setLeftTab] = useState<"add" | "list">("add");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightTab, setRightTab] = useState<"item" | "room">("item");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [toast, setToast] = useState<{ text: string; id: number } | null>(boot.notice ? { text: boot.notice, id: 1 } : null);
  const [saved, setSaved] = useState<SavedDesign[]>(() => (boot.dialog === "open" ? listSaved() : []));
  const [saveThumb, setSaveThumb] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);

  const notify = useCallback((text: string) => setToast({ text, id: Date.now() }), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // Autosave the working draft (debounced), and flush it when the editor
  // unmounts or is hidden so the next mount always finds the latest work.
  const latestDraft = useRef<Parameters<typeof saveDraft>[0] | null>(null);
  useEffect(() => {
    latestDraft.current = { design, ...session, bootQuery: query };
    const t = setTimeout(() => saveDraft(latestDraft.current!), 400);
    return () => clearTimeout(t);
  }, [design, session, query]);
  useEffect(() => () => {
    if (latestDraft.current) saveDraft(latestDraft.current);
  }, []);

  // A new selection shows its properties.
  const select = useCallback((id: string | null) => {
    api.setSelectedId(id);
    if (id) setRightTab("item");
  }, [api]);

  const addProduct = useCallback((id: string, at?: { x: number; z: number }) => {
    api.addProduct(id, at);
    setRightTab("item");
    const name = getProduct(id)?.name;
    if (!desktop) setSheet(null);
    notify(`Added ${name}. Drag it to place it.`);
  }, [api, desktop, notify]);

  // ------------------------------------------------------------ file actions

  const openSave = async () => {
    setSaveError(null);
    setSaveThumb(null);
    setDialog("save");
    try {
      setSaveThumb((await viewRef.current?.capture(480)) || null);
    } catch {
      setSaveThumb(null);
    }
  };

  const doSave = (name: string, asCopy: boolean) => {
    const id = !asCopy && session.savedId ? session.savedId : uid();
    const named = { ...design, name };
    const ok = putSaved({ id, name, savedAt: Date.now(), thumbnail: saveThumb ?? undefined, design: named });
    if (!ok) {
      setSaveError("This browser's storage is full or unavailable, so the design couldn't be saved.");
      return;
    }
    if (name !== design.name) api.rename(name);
    api.setSession({ ...session, savedId: id, savedSnapshot: JSON.stringify(named) });
    setDialog(null);
    notify(`Saved “${name}”`);
  };

  const showOpen = () => {
    setSaved(listSaved());
    setDialog("open");
  };

  const doOpen = (s: SavedDesign) => {
    api.load(s.design, { baseline: s.design, savedId: s.id, savedSnapshot: JSON.stringify(s.design) });
    setDialog(null);
    setTimeout(() => viewRef.current?.reset(), 0);
    notify(`Opened “${s.name}”`);
  };

  const doStart = (type: RoomType, start: StartKind) => {
    const d = createDesign(type, start);
    api.load(d, { baseline: d, savedId: null, savedSnapshot: null });
    setDialog(null);
    setSheet(null);
    setTimeout(() => viewRef.current?.reset(), 0);
    notify(`New ${roomTypeLabel(type).toLowerCase()} ${start === "empty" ? "(empty)" : "ready to edit"}`);
  };

  const exportImage = async () => {
    const url = await viewRef.current?.capture();
    if (!url) {
      notify("The view couldn't be exported.");
      return;
    }
    download(url, `${fileSlug(design.name)}-${view === "3d" ? "3d-view" : "floor-plan"}.png`);
    notify(view === "3d" ? "Exported the 3D view" : "Exported the floor plan");
  };

  const exportList = () => {
    const blob = new Blob([listCsv(design.name, design.items)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    download(url, `${fileSlug(design.name)}-furniture.csv`);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Downloaded the furniture list");
  };

  // --------------------------------------------------------------- shortcuts

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable=true]") || document.querySelector("dialog[open]")) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) api.redo();
        else api.undo();
        return;
      }
      if (mod && key === "y") {
        e.preventDefault();
        api.redo();
        return;
      }
      if (mod && key === "s") {
        e.preventDefault();
        openSave();
        return;
      }
      const sel = api.selected;
      if (!sel) return;
      if (mod && key === "d") {
        e.preventDefault();
        api.duplicateItem(sel.uid);
      } else if (key === "delete" || key === "backspace") {
        e.preventDefault();
        api.removeItem(sel.uid);
      } else if (key === "escape") {
        api.setSelectedId(null);
      } else if (key === "r" && !mod) {
        api.rotateBy(sel.uid, e.shiftKey ? 15 : -15);
      } else if (key.startsWith("arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 1 : 5;
        const dx = key === "arrowleft" ? -step : key === "arrowright" ? step : 0;
        const dz = key === "arrowup" ? -step : key === "arrowdown" ? step : 0;
        api.updateItem(sel.uid, { x: sel.x + dx, z: sel.z + dz }, `nudge:${sel.uid}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ------------------------------------------------------------------ panels

  const roomPanel = (
    <RoomPanel
      room={design.room}
      onChange={api.updateRoom}
      onAddOpening={api.addOpening}
      onUpdateOpening={api.updateOpening}
      onRemoveOpening={api.removeOpening}
      onReset={() => setDialog("reset")}
    />
  );
  const itemPanel = selected ? (
    <ItemPanel
      item={selected}
      design={design}
      clashes={api.clashes}
      onChange={(patch, key) => api.updateItem(selected.uid, patch, key)}
      onRotate={(d) => api.rotateBy(selected.uid, d)}
      onDuplicate={() => api.duplicateItem(selected.uid)}
      onRemove={() => api.removeItem(selected.uid)}
    />
  ) : null;
  const catalog = <CatalogPanel roomType={design.room.type} onAdd={(id) => addProduct(id)} />;
  const list = (
    <ListPanel
      items={design.items}
      total={api.total}
      selectedId={api.selectedId}
      onSelect={(id) => {
        select(id);
        if (!desktop) setSheet("item");
      }}
      onRemove={(ids) => ids.forEach((id) => api.removeItem(id))}
      onClear={() => setDialog("clear")}
      onExport={exportList}
    />
  );

  const status = !api.dirty ? "Saved" : session.savedId ? "Unsaved changes" : "Not saved yet";
  const selectedProduct = selected ? getProduct(selected.productId) : undefined;
  const sheetTitle: Record<Exclude<Sheet, null>, string> = { add: "Add furniture", list: `Furniture list · ${formatPrice(api.total)}`, room: "Room settings", item: selectedProduct?.name ?? "Item" };

  const moreItems = [
    { label: "New design", icon: <FileIcon size={18} />, onSelect: () => setDialog("start") },
    { label: "Open saved design", icon: <FolderIcon size={18} />, onSelect: showOpen },
    { label: view === "3d" ? "Export 3D view (PNG)" : "Export floor plan (PNG)", icon: <DownloadIcon size={18} />, onSelect: exportImage },
    { label: "Download furniture list (CSV)", icon: <ListIcon size={18} />, onSelect: exportList },
    { label: "Reset to starting layout", icon: <UndoIcon size={18} />, onSelect: () => setDialog("reset"), danger: true },
  ];

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      {/* ---------------------------------------------------------- top bar */}
      <header className="relative z-20 flex h-14 shrink-0 items-center gap-1 border-b border-line px-2 sm:gap-2 sm:px-3">
        <Link href="/" className="flex h-10 shrink-0 items-center gap-1.5 rounded-full px-2 hover:bg-surface" aria-label="Back to Larkspur design & planning">
          <ArrowLeftIcon size={18} />
          <Logo compact />
        </Link>
        {desktop && (
          <IconButton label={leftOpen ? "Hide catalogue panel" : "Show catalogue panel"} active={!leftOpen} onClick={() => setLeftOpen((o) => !o)}>
            <PanelLeftIcon size={20} />
          </IconButton>
        )}
        <div className="min-w-0 flex-1 px-1">
          <label htmlFor="design-name" className="sr-only">Design name</label>
          <input
            id="design-name"
            key={design.name}
            defaultValue={design.name}
            maxLength={60}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== design.name) api.rename(v);
              else e.target.value = design.name;
            }}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            className="w-full max-w-72 truncate rounded-md bg-transparent px-1.5 py-0.5 text-sm font-bold outline-none hover:bg-surface focus:bg-surface sm:text-base"
          />
          <p className="truncate px-1.5 text-[0.6875rem] leading-4 text-ink-2" aria-live="polite">
            {roomTypeLabel(design.room.type)} · {status}
          </p>
        </div>

        <IconButton label="Undo (Ctrl+Z)" onClick={api.undo} disabled={!api.canUndo}><UndoIcon size={20} /></IconButton>
        <IconButton label="Redo (Ctrl+Shift+Z)" onClick={api.redo} disabled={!api.canRedo}><RedoIcon size={20} /></IconButton>
        <span className="mx-1 hidden h-6 w-px bg-line md:block" />
        {desktop ? (
          <>
            <button type="button" className="btn hidden h-10 px-3 hover:bg-surface xl:inline-flex" onClick={() => setDialog("start")}><FileIcon size={18} /> New</button>
            <button type="button" className="btn h-10 px-3 hover:bg-surface" onClick={showOpen}><FolderIcon size={18} /> Open</button>
            <button type="button" className="btn h-10 px-3 hover:bg-surface" onClick={openSave}><SaveIcon size={18} /> Save</button>
            <Menu label="Export and more" button={<><DownloadIcon size={18} /> Export</>} items={[moreItems[2], moreItems[3], moreItems[0], moreItems[4]]} />
            <button
              type="button"
              onClick={() => {
                setLeftOpen(true);
                setLeftTab("list");
              }}
              className="btn-primary ml-1 h-10"
            >
              {formatPrice(api.total)}
              <span className="font-normal opacity-75">· {design.items.length} {design.items.length === 1 ? "piece" : "pieces"}</span>
            </button>
          </>
        ) : (
          <>
            <IconButton label="Save design" onClick={openSave}><SaveIcon size={20} /></IconButton>
            <Menu label="More actions" button={<MoreIcon size={20} />} items={moreItems} />
          </>
        )}
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* ---------------------------------------------------- left panel */}
        {desktop && leftOpen && (
          <aside aria-label="Furniture" className="flex w-[320px] shrink-0 flex-col border-r border-line">
            <div className="px-4 pt-3">
              <Segmented
                label="Panel"
                value={leftTab}
                onChange={setLeftTab}
                options={[
                  { value: "add", label: "Add", icon: <PlusIcon size={16} /> },
                  { value: "list", label: `List (${design.items.length})`, icon: <ListIcon size={16} /> },
                ]}
              />
            </div>
            {leftTab === "add" ? catalog : list}
          </aside>
        )}

        {/* ------------------------------------------------------- canvas */}
        <main
          id="main"
          className={clsx("relative min-w-0 flex-1 overflow-hidden bg-[#e7e5e0]", !desktop && "pb-14")}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes(PRODUCT_MIME)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            if (!dropActive) setDropActive(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropActive(false);
          }}
          onDrop={(e) => {
            setDropActive(false);
            const id = e.dataTransfer.getData(PRODUCT_MIME);
            if (!id) return;
            e.preventDefault();
            addProduct(id, viewRef.current?.floorPointAt(e.clientX, e.clientY) ?? undefined);
          }}
        >
          <div className="absolute inset-0">
            {view === "3d" && webgl ? (
              <Viewport3D
                ref={viewRef}
                design={design}
                selectedId={api.selectedId}
                clashing={api.clashes.length > 0}
                onSelect={select}
                gesture={{ start: api.gesture.start, preview: api.gesture.preview, end: api.gesture.end }}
                onUnavailable={() => {
                  setWebgl(false);
                  setView("plan");
                  notify("3D isn't available in this browser, so the floor plan is shown.");
                }}
              />
            ) : (
              <PlanView ref={viewRef} design={design} selectedId={api.selectedId} clashing={api.clashes.length > 0} onSelect={select} gesture={api.gesture} />
            )}
          </div>

          {dropActive && (
            <div className="pointer-events-none absolute inset-3 grid place-items-center rounded-xl border-2 border-dashed border-brand bg-brand/5">
              <span className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow-card">Drop to place it here</span>
            </div>
          )}

          {/* Selection bar */}
          {selected && selectedProduct && (
            <div className="absolute top-3 left-1/2 z-10 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-0.5 rounded-full bg-white py-1 pr-1 pl-4 shadow-card-hover">
              <span className="mr-1 max-w-36 truncate text-sm font-bold sm:max-w-56">{selectedProduct.name}</span>
              {api.clashes.length > 0 && <span className="mr-1 hidden rounded-full bg-[#fdf3dc] px-2 py-0.5 text-[0.6875rem] font-bold text-[#6b4a00] sm:inline">Overlaps</span>}
              <IconButton size="sm" label="Rotate anticlockwise 15°" onClick={() => api.rotateBy(selected.uid, 15)}><RotateLeftIcon size={18} /></IconButton>
              <IconButton size="sm" label="Rotate clockwise 15°" onClick={() => api.rotateBy(selected.uid, -15)}><RotateRightIcon size={18} /></IconButton>
              <IconButton size="sm" label="Duplicate" onClick={() => api.duplicateItem(selected.uid)}><CopyIcon size={18} /></IconButton>
              <IconButton size="sm" label="Remove" onClick={() => api.removeItem(selected.uid)}><TrashIcon size={18} /></IconButton>
              {!desktop && <IconButton size="sm" label="Edit size and finish" onClick={() => setSheet("item")}><SlidersIcon size={18} /></IconButton>}
              <IconButton size="sm" label="Deselect" onClick={() => api.setSelectedId(null)}><CloseIcon size={18} /></IconButton>
            </div>
          )}

          {/* Empty state */}
          {design.items.length === 0 && !dropActive && (
            <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-4">
              <div className="pointer-events-auto max-w-sm rounded-xl bg-white/95 p-5 text-center shadow-card-hover">
                <p className="text-base font-bold">This room is empty</p>
                <p className="mt-1 text-sm text-ink-2">
                  {desktop ? "Drag furniture from the catalogue into the room, or use + on any piece." : "Tap Add to choose furniture. It lands in a free spot you can then drag."}
                </p>
                <button
                  type="button"
                  className="btn-primary mt-4"
                  onClick={() => {
                    if (desktop) {
                      setLeftOpen(true);
                      setLeftTab("add");
                      setTimeout(() => document.getElementById("catalog-search")?.focus(), 0);
                    } else setSheet("add");
                  }}
                >
                  <PlusIcon size={18} /> Add furniture
                </button>
              </div>
            </div>
          )}

          {/* View controls */}
          <div className={clsx("absolute left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white p-1 shadow-card-hover", desktop ? "bottom-4" : "bottom-[4.25rem]")}>
            <div className={desktop ? "w-[15rem]" : "w-[10.5rem]"}>
              <Segmented
                label="View"
                size="sm"
                value={view}
                onChange={(v) => {
                  if (v === "3d" && !webgl) {
                    notify("3D isn't available in this browser.");
                    return;
                  }
                  setView(v);
                }}
                options={[
                  { value: "3d", label: "3D view", icon: <CubeIcon size={16} /> },
                  { value: "plan", label: desktop ? "Floor plan" : "Plan", icon: <PlanIcon size={16} /> },
                ]}
              />
            </div>
            <span className="mx-0.5 h-6 w-px bg-line" />
            <IconButton size="sm" label="Zoom out" onClick={() => viewRef.current?.zoom(-1)}><ZoomOutIcon size={18} /></IconButton>
            <IconButton size="sm" label="Zoom in" onClick={() => viewRef.current?.zoom(1)}><ZoomInIcon size={18} /></IconButton>
            <IconButton size="sm" label="Reset view" onClick={() => viewRef.current?.reset()}><RecenterIcon size={18} /></IconButton>
          </div>

          {desktop && (
            <p className="pointer-events-none absolute top-3.5 left-4 hidden max-w-[16rem] text-xs leading-4 text-ink-2 2xl:block">
              {view === "3d" ? "Drag to orbit · Right-drag to pan · Scroll to zoom · Drag furniture to move it" : "Drag furniture to move · Round handle rotates · Drag empty space to pan"}
            </p>
          )}

          <div aria-live="polite" className="pointer-events-none absolute inset-x-0 top-16 flex justify-center px-4">
            {toast && <p key={toast.id} className="rounded-full bg-ink px-4 py-2 text-sm text-white shadow-card-hover">{toast.text}</p>}
          </div>
        </main>

        {/* --------------------------------------------------- right panel */}
        {desktop && (
          <aside aria-label="Properties" className="flex w-[340px] shrink-0 flex-col border-l border-line">
            <div className="px-4 pt-3">
              {selected ? (
                <Segmented
                  label="Properties"
                  value={rightTab}
                  onChange={setRightTab}
                  options={[
                    { value: "item", label: "Selected item", icon: <SlidersIcon size={16} /> },
                    { value: "room", label: "Room", icon: <RoomIcon size={16} /> },
                  ]}
                />
              ) : (
                <div className="flex h-11 items-center gap-2 text-sm font-bold"><RoomIcon size={18} /> Room settings</div>
              )}
            </div>
            {selected && rightTab === "item" ? itemPanel : roomPanel}
          </aside>
        )}

        {/* ------------------------------------------- mobile sheet + tabs */}
        {!desktop && (
          <>
            {sheet && (sheet !== "item" || selected) && (
              <section
                aria-label={sheetTitle[sheet]}
                className="absolute inset-x-0 bottom-14 z-30 flex h-[min(64dvh,600px)] flex-col rounded-t-2xl bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.18)]"
              >
                <div className="flex items-center gap-2 border-b border-line py-2 pr-2 pl-4">
                  <h2 className="min-w-0 flex-1 truncate text-base font-bold">{sheetTitle[sheet]}</h2>
                  <IconButton label="Close panel" onClick={() => setSheet(null)}><CloseIcon size={20} /></IconButton>
                </div>
                {sheet === "add" ? catalog : sheet === "list" ? list : sheet === "room" ? roomPanel : itemPanel}
              </section>
            )}
            <nav aria-label="Designer panels" className="absolute inset-x-0 bottom-0 z-30 grid h-14 grid-cols-4 border-t border-line bg-white">
              {([
                ["add", "Add", <PlusIcon key="a" size={20} />],
                ["list", `List (${design.items.length})`, <ListIcon key="l" size={20} />],
                ["room", "Room", <RoomIcon key="r" size={20} />],
                ["item", "Item", <SlidersIcon key="i" size={20} />],
              ] as const).map(([id, label, icon]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={sheet === id}
                  disabled={id === "item" && !selected}
                  onClick={() => setSheet((s) => (s === id ? null : id))}
                  className={clsx(
                    "flex flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-bold disabled:opacity-35",
                    sheet === id ? "text-brand" : "text-ink-2",
                  )}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </nav>
          </>
        )}
      </div>

      {/* ---------------------------------------------------------- dialogs */}
      <StartDialog open={dialog === "start"} onClose={() => setDialog(null)} onStart={doStart} dirty={api.dirty && design.items.length > 0} initialType={design.room.type} />
      <SaveDialog open={dialog === "save"} onClose={() => setDialog(null)} name={design.name} canOverwrite={!!session.savedId} thumbnail={saveThumb} onSave={doSave} error={saveError} />
      <OpenDialog
        open={dialog === "open"}
        onClose={() => setDialog(null)}
        saved={saved}
        currentId={session.savedId}
        dirty={api.dirty && (design.items.length > 0 || !!session.savedId)}
        onOpen={doOpen}
        onDelete={(id) => {
          deleteSaved(id);
          setSaved(listSaved());
          if (id === session.savedId) api.setSession({ ...session, savedId: null, savedSnapshot: null });
          notify("Design deleted");
        }}
      />
      <ConfirmDialog
        open={dialog === "reset"}
        onClose={() => setDialog(null)}
        title="Reset to the starting layout?"
        body="The room and furniture go back to how this design started. You can still undo this afterwards."
        confirmLabel="Reset design"
        onConfirm={() => {
          api.replace(session.baseline);
          setDialog(null);
          notify("Design reset. Press Undo to bring your changes back.");
        }}
      />
      <ConfirmDialog
        open={dialog === "clear"}
        onClose={() => setDialog(null)}
        title="Remove all furniture?"
        body="Every piece is taken out of the room. The walls, floor, doors and windows stay. You can undo this."
        confirmLabel="Clear room"
        onConfirm={() => {
          api.clearItems();
          setDialog(null);
        }}
      />
    </div>
  );
}
