"use client";

import clsx from "@/lib/clsx";
import { formatPrice, getProduct } from "@/lib/designer/catalog";
import { elevationOf, halfExtents, itemDims, itemPrice, supportOf, wallGaps } from "@/lib/designer/geometry";
import { getFinish } from "@/lib/designer/materials";
import type { Design, PlacedItem } from "@/lib/designer/types";
import { CopyIcon, RotateLeftIcon, RotateRightIcon, TrashIcon, WarningIcon } from "./icons";
import ProductThumb from "./ProductThumb";
import { NumberField, PanelSection, Slider, Swatch } from "./ui";

/** Properties of the selected piece: size, finish, position and rotation. */
export default function ItemPanel({
  item, design, clashes, onChange, onRotate, onDuplicate, onRemove,
}: {
  item: PlacedItem;
  design: Design;
  clashes: PlacedItem[];
  onChange: (patch: Partial<PlacedItem>, key?: string) => void;
  onRotate: (delta: number) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const product = getProduct(item.productId);
  if (!product) return null;
  const dims = itemDims(item, product);
  const { room } = design;
  const { ex, ez } = halfExtents(dims.w, dims.d, item.rotation);
  const gaps = wallGaps(item, room);
  const host = supportOf(item, design.items);
  const elevation = elevationOf(item, design.items);
  const round = product.model === "roundRug" || product.model === "roundTable" || product.model === "roundCoffeeTable";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="flex gap-3 border-b border-line p-4">
        <ProductThumb product={product} finish={item.finish} variant={item.variant} className="size-20 shrink-0 rounded-md" />
        <div className="min-w-0">
          <h2 className="text-base leading-5 font-bold">{product.name}</h2>
          <p className="mt-1 text-xs text-ink-2">{product.blurb}</p>
          <p className="mt-1.5 text-sm font-bold">{formatPrice(itemPrice(item, product))}</p>
        </div>
      </div>

      {clashes.length > 0 && (
        <p role="status" className="mx-4 mt-4 flex gap-2 rounded-md bg-[#fdf3dc] px-3 py-2 text-xs text-[#6b4a00]">
          <WarningIcon size={16} className="shrink-0" />
          Overlaps {clashes.map((c) => getProduct(c.productId)?.name ?? "another piece").join(", ")}. Move it to make room.
        </p>
      )}

      <PanelSection title="Size">
        {product.resizable ? (
          <div className="flex gap-2">
            <NumberField
              label={round ? "Diameter" : "Width"}
              value={dims.w}
              min={product.resizable.min[0]}
              max={product.resizable.max[0]}
              step={10}
              onChange={(v) => onChange(round ? { w: v, d: v } : { w: v }, `size:${item.uid}`)}
            />
            {!round && (
              <NumberField label="Length" value={dims.d} min={product.resizable.min[1]} max={product.resizable.max[1]} step={10} onChange={(v) => onChange({ d: v }, `size:${item.uid}`)} />
            )}
          </div>
        ) : product.sizes.length > 1 ? (
          <div role="radiogroup" aria-label="Size" className="grid gap-2">
            {product.sizes.map((s, i) => (
              <button
                key={s.label ?? i}
                type="button"
                role="radio"
                aria-checked={item.variant === i}
                onClick={() => onChange({ variant: i })}
                className={clsx(
                  "flex items-center justify-between rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                  item.variant === i ? "border-ink shadow-[inset_0_0_0_1px_var(--color-ink)]" : "border-line hover:border-line-strong",
                )}
              >
                <span>
                  <span className="font-bold">{s.label}</span>
                  <span className="block text-xs text-ink-2">{s.w} × {s.d} × {s.h} cm</span>
                </span>
                <span className="text-xs font-bold">{formatPrice(s.price ?? product.price)}</span>
              </button>
            ))}
          </div>
        ) : null}
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          {[
            ["Width", dims.w],
            ["Depth", dims.d],
            ["Height", dims.h],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md bg-surface py-2">
              <dt className="text-ink-2">{k}</dt>
              <dd className="font-bold tabular-nums">{v} cm</dd>
            </div>
          ))}
        </dl>
      </PanelSection>

      <PanelSection title={`Finish · ${getFinish(item.finish).name}`}>
        <div role="radiogroup" aria-label="Finish" className="flex flex-wrap gap-3">
          {product.finishes.map((f) => (
            <Swatch key={f} color={getFinish(f).color} label={getFinish(f).name} selected={item.finish === f} onSelect={() => onChange({ finish: f })} />
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Position">
        <div className="flex gap-2">
          <NumberField label="From west wall" value={Math.round(item.x - ex)} min={0} max={Math.max(0, Math.round(room.width - 2 * ex))} step={5} onChange={(v) => onChange({ x: v + ex }, `pos:${item.uid}`)} />
          <NumberField label="From north wall" value={Math.round(item.z - ez)} min={0} max={Math.max(0, Math.round(room.length - 2 * ez))} step={5} onChange={(v) => onChange({ z: v + ez }, `pos:${item.uid}`)} />
        </div>
        <p className="mt-2 text-xs text-ink-2">
          Gaps to walls: west {gaps.west} · east {gaps.east} · north {gaps.north} · south {gaps.south} cm
        </p>
        {product.ceiling ? (
          <p className="mt-1 text-xs text-ink-2">Hangs from the ceiling, 80 cm drop.</p>
        ) : host ? (
          <p className="mt-1 text-xs text-ink-2">Standing on the {getProduct(host.productId)?.name.toLowerCase()}, {elevation} cm up.</p>
        ) : null}
      </PanelSection>

      <PanelSection title="Rotation">
        <div className="flex items-center gap-2">
          <button type="button" className="btn-soft h-10 px-3" onClick={() => onRotate(15)} aria-label="Rotate 15 degrees anticlockwise"><RotateLeftIcon size={18} /> 15°</button>
          <button type="button" className="btn-soft h-10 px-3" onClick={() => onRotate(-15)} aria-label="Rotate 15 degrees clockwise"><RotateRightIcon size={18} /> 15°</button>
          <button type="button" className="btn-soft h-10 px-3" onClick={() => onRotate(-90)} aria-label="Rotate 90 degrees clockwise"><RotateRightIcon size={18} /> 90°</button>
        </div>
        <div className="mt-4">
          {/* The slider reads clockwise, like a compass, while rotation is stored anticlockwise. */}
          <Slider label="Angle" value={(360 - item.rotation) % 360} min={0} max={355} step={5} format={(v) => `${v}°`} onChange={(v) => onChange({ rotation: 360 - v }, `rotate:${item.uid}`)} />
        </div>
      </PanelSection>

      <div className="flex gap-2 p-4">
        <button type="button" className="btn-outline flex-1" onClick={onDuplicate}><CopyIcon size={18} /> Duplicate</button>
        <button type="button" className="btn-outline flex-1 hover:border-brand-dark hover:text-brand-dark" onClick={onRemove}><TrashIcon size={18} /> Remove</button>
      </div>
      <p className="px-4 pb-6 text-xs text-ink-3">
        Shortcuts: arrows move 5 cm (Shift 1 cm), R / Shift+R rotate, Ctrl+D duplicate, Delete removes.
      </p>
    </div>
  );
}
