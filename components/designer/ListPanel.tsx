"use client";

import { useMemo } from "react";
import clsx from "@/lib/clsx";
import { formatPrice, getProduct } from "@/lib/designer/catalog";
import { itemDims, itemPrice } from "@/lib/designer/geometry";
import { getFinish } from "@/lib/designer/materials";
import type { PlacedItem } from "@/lib/designer/types";
import { DownloadIcon, TrashIcon } from "./icons";
import ProductThumb from "./ProductThumb";

export type ListLine = {
  key: string;
  productId: string;
  name: string;
  finish: string;
  size: string;
  qty: number;
  unit: number;
  uids: string[];
  variant: number;
};

/** Furniture in the room, grouped by product, finish and size. */
export function listLines(items: PlacedItem[]): ListLine[] {
  const lines = new Map<string, ListLine>();
  for (const item of items) {
    const product = getProduct(item.productId);
    if (!product) continue;
    const dims = itemDims(item, product);
    const size = product.resizable
      ? product.model === "roundRug" ? `Ø ${dims.w} cm` : `${dims.w} × ${dims.d} cm`
      : product.sizes[item.variant]?.label ?? `${dims.w} × ${dims.d} × ${dims.h} cm`;
    const key = `${item.productId}|${item.finish}|${size}`;
    const unit = itemPrice(item, product);
    const line = lines.get(key);
    if (line) {
      line.qty += 1;
      line.uids.push(item.uid);
    } else {
      lines.set(key, { key, productId: product.id, name: product.name, finish: item.finish, size, qty: 1, unit, uids: [item.uid], variant: item.variant });
    }
  }
  return [...lines.values()];
}

export function listCsv(name: string, items: PlacedItem[]): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = listLines(items).map((l) => [l.name, getFinish(l.finish).name, l.size, l.qty, l.unit, l.unit * l.qty].map(esc).join(","));
  const total = items.reduce((s, i) => s + itemPrice(i), 0);
  return [`${esc(name)}`, ["Product", "Finish", "Size", "Qty", "Unit price (INR)", "Line total (INR)"].map(esc).join(","), ...rows, ["", "", "", "", "Total", total].map(esc).join(",")].join("\n");
}

export default function ListPanel({
  items, total, selectedId, onSelect, onRemove, onClear, onExport,
}: {
  items: PlacedItem[];
  total: number;
  selectedId: string | null;
  onSelect: (uid: string) => void;
  onRemove: (uids: string[]) => void;
  onClear: () => void;
  onExport: () => void;
}) {
  const lines = useMemo(() => listLines(items), [items]);

  if (!lines.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <p className="text-sm font-bold">Your room is empty</p>
        <p className="mt-1 max-w-60 text-xs text-ink-2">Add furniture from the catalogue and it will be listed here with prices.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
        {lines.map((l) => {
          const product = getProduct(l.productId)!;
          const active = selectedId !== null && l.uids.includes(selectedId);
          return (
            <li key={l.key} className={clsx("flex gap-3 px-4 py-3", active && "bg-brand-soft/60")}>
              <button
                type="button"
                onClick={() => {
                  // Cycle through the pieces on this line on repeated clicks.
                  const at = selectedId ? l.uids.indexOf(selectedId) : -1;
                  onSelect(l.uids[(at + 1) % l.uids.length]);
                }}
                className="flex min-w-0 flex-1 gap-3 text-left"
                aria-label={`Select ${l.name}${l.qty > 1 ? ` (${l.qty} in the room)` : ""}`}
              >
                <ProductThumb product={product} finish={l.finish} variant={l.variant} className="size-14 shrink-0 rounded-md" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-5 font-bold">{l.name}</span>
                  <span className="block text-xs text-ink-2">{getFinish(l.finish).name} · {l.size}</span>
                  <span className="mt-1 block text-xs">
                    {l.qty > 1 && <span className="text-ink-2">{l.qty} × {formatPrice(l.unit)} = </span>}
                    <span className="font-bold">{formatPrice(l.unit * l.qty)}</span>
                  </span>
                </span>
              </button>
              <button
                type="button"
                aria-label={`Remove ${l.qty > 1 ? `all ${l.qty} ` : ""}${l.name}`}
                title="Remove from room"
                onClick={() => onRemove(l.uids)}
                className="grid size-9 shrink-0 place-items-center self-center rounded-full text-ink-2 hover:bg-surface hover:text-ink"
              >
                <TrashIcon size={18} />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-line p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-2">{items.length} {items.length === 1 ? "piece" : "pieces"}</span>
          <span className="text-xl font-bold">{formatPrice(total)}</span>
        </div>
        <p className="mt-1 text-xs text-ink-3">Indicative prices for this prototype. Delivery and assembly not included.</p>
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn-outline flex-1" onClick={onExport}>
            <DownloadIcon size={18} /> Download list
          </button>
          <button type="button" className="btn-soft" onClick={onClear}>Clear room</button>
        </div>
      </div>
    </div>
  );
}
