"use client";

import { useEffect, useId, useRef, useState } from "react";
import clsx from "@/lib/clsx";
import { formatPrice } from "@/lib/designer/catalog";
import { itemPrice } from "@/lib/designer/geometry";
import type { SavedDesign } from "@/lib/designer/storage";
import { roomTypeLabel, roomTypes } from "@/lib/designer/templates";
import type { RoomType, StartKind } from "@/lib/designer/types";
import { BedIcon, CloseIcon, DeskIcon, DiningIcon, SofaIcon } from "@/components/icons";
import { RoomIcon, WarningIcon } from "./icons";

const typeIcons: Record<RoomType, typeof BedIcon> = { bedroom: BedIcon, living: SofaIcon, dining: DiningIcon, office: DeskIcon };

/** Native modal dialog driven by an `open` prop. */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  // Close if this view is hidden by navigation while open.
  useEffect(() => {
    const d = ref.current;
    return () => d?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={clsx("m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] rounded-xl bg-white p-0 text-ink backdrop:bg-black/50", wide ? "max-w-2xl" : "max-w-md")}
    >
      {open && (
        <div className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-xl font-bold">{title}</h2>
            <button type="button" aria-label="Close" className="-mt-1 -mr-2 grid size-10 shrink-0 place-items-center rounded-full hover:bg-surface" onClick={onClose}>
              <CloseIcon size={20} />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

function OptionCard({ selected, onSelect, title, body, icon }: { selected: boolean; onSelect: () => void; title: string; body: string; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={clsx(
        "flex h-full items-start gap-3 rounded-lg border p-3 text-left transition-colors sm:p-4",
        selected ? "border-ink bg-surface shadow-[inset_0_0_0_1px_var(--color-ink)]" : "border-line hover:border-line-strong",
      )}
    >
      {icon && <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white shadow-card">{icon}</span>}
      <span>
        <span className="block text-sm font-bold">{title}</span>
        <span className="mt-0.5 block text-xs text-ink-2">{body}</span>
      </span>
    </button>
  );
}

export function StartDialog({ open, onClose, onStart, dirty, initialType = "bedroom" }: {
  open: boolean;
  onClose: () => void;
  onStart: (type: RoomType, start: StartKind) => void;
  dirty: boolean;
  initialType?: RoomType;
}) {
  const [type, setType] = useState<RoomType>(initialType);
  const [start, setStart] = useState<StartKind>("furnished");
  return (
    <Modal open={open} onClose={onClose} title="Start a new design" wide>
      <p className="mt-1 text-sm text-ink-2">Pick a room, then start from a furnished example or an empty shell. You can change everything afterwards.</p>
      <h3 className="mt-6 mb-2 text-sm font-bold">Room</h3>
      <div role="radiogroup" aria-label="Room" className="grid gap-2 sm:grid-cols-2">
        {roomTypes.map((t) => {
          const Icon = typeIcons[t.id];
          return <OptionCard key={t.id} selected={type === t.id} onSelect={() => setType(t.id)} title={t.label} body={t.blurb} icon={<Icon size={20} />} />;
        })}
      </div>
      <h3 className="mt-6 mb-2 text-sm font-bold">Start with</h3>
      <div role="radiogroup" aria-label="Start with" className="grid gap-2 sm:grid-cols-2">
        <OptionCard selected={start === "furnished"} onSelect={() => setStart("furnished")} title="A furnished room" body="A styled starting point to rearrange and restyle." />
        <OptionCard selected={start === "empty"} onSelect={() => setStart("empty")} title="An empty room" body="Just walls, a door and a window. Add every piece yourself." icon={<RoomIcon size={20} />} />
      </div>
      {dirty && (
        <p className="mt-5 flex gap-2 rounded-md bg-[#fdf3dc] px-3 py-2 text-xs text-[#6b4a00]">
          <WarningIcon size={16} className="shrink-0" /> Your current design has unsaved changes. Save it first if you want to keep it.
        </p>
      )}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn-outline h-12" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-primary h-12 px-7" onClick={() => onStart(type, start)}>
          Start designing {roomTypeLabel(type).toLowerCase()}
        </button>
      </div>
    </Modal>
  );
}

export function SaveDialog({ open, onClose, name, canOverwrite, thumbnail, onSave, error }: {
  open: boolean;
  onClose: () => void;
  name: string;
  canOverwrite: boolean;
  thumbnail: string | null;
  onSave: (name: string, asCopy: boolean) => void;
  error: string | null;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Save design">
      {/* Mounted only while open, so the name starts fresh each time. */}
      <SaveForm name={name} canOverwrite={canOverwrite} thumbnail={thumbnail} onSave={onSave} error={error} />
    </Modal>
  );
}

function SaveForm({ name, canOverwrite, thumbnail, onSave, error }: {
  name: string;
  canOverwrite: boolean;
  thumbnail: string | null;
  onSave: (name: string, asCopy: boolean) => void;
  error: string | null;
}) {
  const [value, setValue] = useState(name);
  const id = useId();
  const submit = (asCopy: boolean) => {
    const n = value.trim();
    if (n) onSave(n.slice(0, 60), asCopy);
  };
  return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(false);
        }}
      >
        <p className="mt-1 text-sm text-ink-2">Designs are saved in this browser. Reopen them any time from “Open”.</p>
        {thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt="Preview of the design" className="mt-4 aspect-[16/10] w-full rounded-md bg-surface object-cover" />
        )}
        <label htmlFor={id} className="mt-4 block text-sm font-bold">Design name</label>
        <input
          id={id}
          value={value}
          maxLength={60}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          className="mt-2 h-12 w-full rounded-md border border-line-strong px-4 text-base outline-none focus:border-ink focus:shadow-[inset_0_0_0_1px_var(--color-ink)]"
        />
        {error && <p role="alert" className="mt-3 text-sm text-brand-dark">{error}</p>}
        <div className="mt-6 flex flex-col gap-2">
          <button type="submit" className="btn-primary h-12" disabled={!value.trim()}>{canOverwrite ? "Save changes" : "Save design"}</button>
          {canOverwrite && <button type="button" className="btn-outline h-12" onClick={() => submit(true)} disabled={!value.trim()}>Save as a new copy</button>}
        </div>
      </form>
  );
}

export function OpenDialog({ open, onClose, saved, currentId, dirty, onOpen, onDelete }: {
  open: boolean;
  onClose: () => void;
  saved: SavedDesign[];
  currentId: string | null;
  dirty: boolean;
  onOpen: (s: SavedDesign) => void;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });
  return (
    <Modal open={open} onClose={onClose} title="Your saved designs" wide>
      {dirty && saved.length > 0 && (
        <p className="mt-3 flex gap-2 rounded-md bg-[#fdf3dc] px-3 py-2 text-xs text-[#6b4a00]">
          <WarningIcon size={16} className="shrink-0" /> Opening another design replaces your unsaved changes.
        </p>
      )}
      {saved.length === 0 ? (
        <div className="mt-6 rounded-lg bg-surface px-6 py-10 text-center">
          <p className="text-sm font-bold">No saved designs yet</p>
          <p className="mt-1 text-xs text-ink-2">Use Save in the toolbar to keep a design in this browser.</p>
        </div>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {saved.map((s) => {
            const total = s.design.items.reduce((sum, i) => sum + itemPrice(i), 0);
            return (
              <li key={s.id} className={clsx("overflow-hidden rounded-lg border", s.id === currentId ? "border-ink" : "border-line")}>
                {s.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.thumbnail} alt="" className="aspect-[16/10] w-full bg-surface object-cover" />
                ) : (
                  <div className="grid aspect-[16/10] place-items-center bg-surface text-xs text-ink-3">No preview</div>
                )}
                <div className="p-3">
                  <p className="truncate text-sm font-bold">{s.name}{s.id === currentId && <span className="ml-1.5 font-normal text-ink-2">(open now)</span>}</p>
                  <p className="text-xs text-ink-2">
                    {roomTypeLabel(s.design.room.type)} · {s.design.items.length} pieces · {formatPrice(total)}
                  </p>
                  <p className="text-xs text-ink-3">Saved {date.format(s.savedAt)}</p>
                  {confirming === s.id ? (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="flex-1 text-xs font-bold">Delete this design?</span>
                      <button type="button" className="btn-soft h-9 px-3" onClick={() => setConfirming(null)}>Keep</button>
                      <button type="button" className="btn h-9 bg-brand-dark px-3 text-white hover:bg-brand" onClick={() => { onDelete(s.id); setConfirming(null); }}>Delete</button>
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <button type="button" className="btn-primary h-9 flex-1" onClick={() => onOpen(s)}>Open</button>
                      <button type="button" className="btn-outline h-9 px-3" onClick={() => setConfirming(s.id)} aria-label={`Delete ${s.name}`}>Delete</button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}

export function ConfirmDialog({ open, onClose, title, body, confirmLabel, onConfirm }: {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mt-2 text-sm text-ink-2">{body}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn-outline h-11" onClick={onClose}>Cancel</button>
        <button type="button" className="btn h-11 bg-brand-dark px-6 text-white hover:bg-brand" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
