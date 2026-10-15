"use client";

import { useId } from "react";
import clsx from "@/lib/clsx";
import { wallLength } from "@/lib/designer/geometry";
import { floors, getFloor, shade, wallColors, wallFinishes } from "@/lib/designer/materials";
import { roomTypes } from "@/lib/designer/templates";
import type { Opening, Room, WallSide } from "@/lib/designer/types";
import { CloseIcon } from "@/components/icons";
import { DoorIcon, WindowIcon } from "./icons";
import { NumberField, PanelSection, Slider, Swatch } from "./ui";

const walls: { id: WallSide; label: string }[] = [
  { id: "north", label: "North (back)" },
  { id: "east", label: "East (right)" },
  { id: "south", label: "South (front)" },
  { id: "west", label: "West (left)" },
];

/** CSS hint of a floor's pattern for its swatch. */
function floorSwatch(id: string) {
  const f = getFloor(id);
  const dark = shade(f.color, -0.25);
  switch (f.pattern) {
    case "planks": return `repeating-linear-gradient(0deg, ${dark} 0 1px, transparent 1px 8px)`;
    case "tiles": return `linear-gradient(90deg, ${shade(f.color, 0.3)} 1px, transparent 1px), linear-gradient(0deg, ${shade(f.color, 0.3)} 1px, transparent 1px)`;
    default: return undefined;
  }
}

export default function RoomPanel({
  room, onChange, onAddOpening, onUpdateOpening, onRemoveOpening, onReset,
}: {
  room: Room;
  onChange: (patch: Partial<Room>, key?: string) => void;
  onAddOpening: (kind: Opening["kind"]) => void;
  onUpdateOpening: (id: string, patch: Partial<Opening>, key?: string) => void;
  onRemoveOpening: (id: string) => void;
  onReset: () => void;
}) {
  const customId = useId();
  const area = (room.width * room.length) / 10000;
  const isPreset = wallColors.some((c) => c.color.toLowerCase() === room.wallColor.toLowerCase());

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <PanelSection title="Room type">
        <div role="radiogroup" aria-label="Room type" className="grid grid-cols-2 gap-2">
          {roomTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={room.type === t.id}
              onClick={() => onChange({ type: t.id })}
              className={clsx(
                "rounded-md border px-3 py-2 text-left text-sm font-bold transition-colors",
                room.type === t.id ? "border-ink shadow-[inset_0_0_0_1px_var(--color-ink)]" : "border-line hover:border-line-strong",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-2">Sets which furniture the catalogue suggests first.</p>
      </PanelSection>

      <PanelSection title="Dimensions">
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Width (west–east)" value={room.width} min={200} max={1000} step={10} onChange={(v) => onChange({ width: v }, "room:width")} />
          <NumberField label="Length (north–south)" value={room.length} min={200} max={1000} step={10} onChange={(v) => onChange({ length: v }, "room:length")} />
          <NumberField label="Wall height" value={room.height} min={220} max={400} step={5} onChange={(v) => onChange({ height: v }, "room:height")} />
          <div className="flex flex-col justify-end pb-2 text-xs text-ink-2">
            <span>Floor area</span>
            <span className="text-sm font-bold text-ink">{area.toFixed(1)} m² · {Math.round(area * 10.764)} sq.ft</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-ink-2">Furniture stays inside the walls when you make the room smaller.</p>
      </PanelSection>

      <PanelSection title={`Floor · ${getFloor(room.floor).name}`}>
        <div role="radiogroup" aria-label="Floor" className="flex flex-wrap gap-3">
          {floors.map((f) => (
            <Swatch key={f.id} size={36} color={f.color} pattern={floorSwatch(f.id)} label={f.name} selected={room.floor === f.id} onSelect={() => onChange({ floor: f.id })} />
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Walls">
        <div role="radiogroup" aria-label="Wall colour" className="flex flex-wrap gap-3">
          {wallColors.map((c) => (
            <Swatch key={c.color} color={c.color} label={c.name} selected={room.wallColor.toLowerCase() === c.color.toLowerCase()} onSelect={() => onChange({ wallColor: c.color })} />
          ))}
          <label
            htmlFor={customId}
            title="Custom colour"
            className={clsx(
              "relative grid size-8 cursor-pointer place-items-center rounded-full border border-black/15",
              !isPreset && "shadow-[0_0_0_2px_#fff,0_0_0_4px_var(--color-ink)]",
            )}
            style={{ background: isPreset ? "conic-gradient(#e57373, #ffd54f, #81c784, #64b5f6, #ba68c8, #e57373)" : room.wallColor }}
          >
            <span className="sr-only">Custom wall colour</span>
            <input id={customId} type="color" value={room.wallColor} onChange={(e) => onChange({ wallColor: e.target.value }, "room:color")} className="absolute inset-0 cursor-pointer opacity-0" />
          </label>
        </div>
        <p className="mt-4 mb-2 text-xs text-ink-2">Finish</p>
        <div role="radiogroup" aria-label="Wall finish" className="grid grid-cols-2 gap-2">
          {wallFinishes.map((f) => (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={room.wallFinish === f.id}
              onClick={() => onChange({ wallFinish: f.id })}
              className={clsx(
                "rounded-md border px-3 py-2 text-left transition-colors",
                room.wallFinish === f.id ? "border-ink shadow-[inset_0_0_0_1px_var(--color-ink)]" : "border-line hover:border-line-strong",
              )}
            >
              <span className="block text-sm font-bold">{f.name}</span>
              <span className="block text-xs text-ink-2">{f.description}</span>
            </button>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Doors & windows">
        {room.openings.length === 0 && <p className="mb-3 text-xs text-ink-2">No doors or windows yet.</p>}
        <ul className="space-y-3">
          {room.openings.map((o, i) => {
            const len = wallLength(room, o.wall);
            const name = `${o.kind === "door" ? "Door" : "Window"} ${room.openings.filter((p, j) => p.kind === o.kind && j <= i).length}`;
            return (
              <li key={o.id} className="rounded-md border border-line p-3">
                <div className="flex items-center gap-2">
                  {o.kind === "door" ? <DoorIcon size={18} /> : <WindowIcon size={18} />}
                  <span className="flex-1 text-sm font-bold">{name}</span>
                  <button type="button" aria-label={`Remove ${name.toLowerCase()}`} onClick={() => onRemoveOpening(o.id)} className="grid size-8 place-items-center rounded-full text-ink-2 hover:bg-surface hover:text-ink">
                    <CloseIcon size={16} />
                  </button>
                </div>
                <label className="mt-2 block text-xs text-ink-2">
                  Wall
                  <select
                    value={o.wall}
                    onChange={(e) => onUpdateOpening(o.id, { wall: e.target.value as WallSide })}
                    className="mt-1 block h-9 w-full rounded-md border border-line-strong bg-white px-2 text-sm text-ink"
                  >
                    {walls.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
                  </select>
                </label>
                <div className="mt-3 space-y-3">
                  <Slider label="Position along wall" value={o.offset} min={Math.ceil(o.width / 2 + 5)} max={Math.floor(len - o.width / 2 - 5)} step={5} format={(v) => `${v} cm`} onChange={(v) => onUpdateOpening(o.id, { offset: v }, `open:${o.id}:pos`)} />
                  <Slider label="Width" value={o.width} min={o.kind === "door" ? 70 : 50} max={Math.min(o.kind === "door" ? 180 : 300, len - 20)} step={5} format={(v) => `${v} cm`} onChange={(v) => onUpdateOpening(o.id, { width: v }, `open:${o.id}:w`)} />
                  {o.kind === "window" && (
                    <Slider label="Sill height" value={o.sill} min={20} max={Math.max(20, room.height - o.height - 15)} step={5} format={(v) => `${v} cm`} onChange={(v) => onUpdateOpening(o.id, { sill: v }, `open:${o.id}:sill`)} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex gap-2">
          <button type="button" className="btn-outline flex-1" onClick={() => onAddOpening("door")}><DoorIcon size={18} /> Add door</button>
          <button type="button" className="btn-outline flex-1" onClick={() => onAddOpening("window")}><WindowIcon size={18} /> Add window</button>
        </div>
      </PanelSection>

      <div className="p-4 pb-8">
        <button type="button" className="btn-soft w-full" onClick={onReset}>Reset to starting layout…</button>
      </div>
    </div>
  );
}
