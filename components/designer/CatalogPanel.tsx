"use client";

import { useMemo, useState } from "react";
import clsx from "@/lib/clsx";
import { categories, formatPrice, products, type CategoryId, type Product } from "@/lib/designer/catalog";
import type { RoomType } from "@/lib/designer/types";
import { roomTypeLabel } from "@/lib/designer/templates";
import { CloseIcon, PlusIcon, SearchIcon } from "@/components/icons";
import ProductThumb from "./ProductThumb";

export const PRODUCT_MIME = "application/x-larkspur-product";

/**
 * Searchable furniture catalogue. Cards can be dragged onto the room, or
 * clicked to drop the piece into a free spot and select it.
 */
export default function CatalogPanel({ roomType, onAdd }: { roomType: RoomType; onAdd: (productId: string) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = products.filter(
      (p) =>
        (category === "all" || p.category === category) &&
        (!q || `${p.name} ${p.blurb} ${categories.find((c) => c.id === p.category)?.label}`.toLowerCase().includes(q)),
    );
    // Pieces suited to the current room type come first.
    return matches.sort((a, b) => Number(b.rooms.includes(roomType)) - Number(a.rooms.includes(roomType)));
  }, [query, category, roomType]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-3 border-b border-line p-4">
        <div className="relative">
          <SearchIcon size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-2" />
          <label htmlFor="catalog-search" className="sr-only">Search furniture</label>
          <input
            id="catalog-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search furniture"
            className="h-11 w-full rounded-full bg-surface pr-10 pl-10 text-sm outline-none focus:shadow-[inset_0_0_0_2px_var(--color-ink)] [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full hover:bg-line">
              <CloseIcon size={16} />
            </button>
          )}
        </div>
        <div role="radiogroup" aria-label="Category" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar lg:flex-wrap lg:overflow-visible">
          {[{ id: "all" as const, label: "All" }, ...categories].map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={category === c.id}
              onClick={() => setCategory(c.id)}
              className={clsx(
                "h-8 shrink-0 rounded-full px-3.5 text-xs font-bold whitespace-nowrap transition-colors",
                category === c.id ? "bg-ink text-white" : "bg-surface text-ink hover:bg-line",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="mb-3 text-xs text-ink-2" aria-live="polite">
          {results.length} {results.length === 1 ? "piece" : "pieces"} · Drag into the room or tap + to add
        </p>
        {results.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
            {results.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} suggested={p.rooms.includes(roomType)} roomType={roomType} onAdd={onAdd} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg bg-surface px-4 py-8 text-center">
            <p className="text-sm font-bold">No furniture matches “{query}”</p>
            <p className="mt-1 text-xs text-ink-2">Try another word, or browse every category.</p>
            <button type="button" className="btn-outline mt-4" onClick={() => { setQuery(""); setCategory("all"); }}>
              Show all furniture
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, suggested, roomType, onAdd }: { product: Product; suggested: boolean; roomType: RoomType; onAdd: (id: string) => void }) {
  const size = product.sizes[0];
  const dims = product.model === "roundRug" || product.model === "roundTable"
    ? `Ø ${size.w} cm`
    : `${size.w} × ${size.d}${size.h > 1 ? ` × ${size.h}` : ""} cm`;
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(PRODUCT_MIME, product.id);
        e.dataTransfer.setData("text/plain", product.name);
        e.dataTransfer.effectAllowed = "copy";
      }}
      className="group relative flex h-full cursor-grab flex-col overflow-hidden rounded-lg border border-line bg-white transition-shadow hover:shadow-card-hover active:cursor-grabbing"
    >
      <ProductThumb product={product} finish={product.finishes[0]} className="aspect-[4/3]" />
      {suggested && (
        <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[0.6875rem] font-bold text-sage">
          For {roomTypeLabel(roomType).toLowerCase()}
        </span>
      )}
      <div className="flex flex-1 flex-col p-2.5">
        <p className="text-xs leading-4 font-bold">{product.name}</p>
        <p className="mt-0.5 text-[0.6875rem] text-ink-2">{dims}</p>
        <div className="mt-auto flex items-end justify-between gap-1 pt-2">
          <p className="text-sm font-bold">
            {product.sizes.length > 1 || product.resizable ? <span className="text-[0.6875rem] font-normal text-ink-2">from </span> : null}
            {formatPrice(Math.min(product.price, ...product.sizes.map((s) => s.price ?? product.price)))}
          </p>
          <button
            type="button"
            onClick={() => onAdd(product.id)}
            aria-label={`Add ${product.name} to the room`}
            title="Add to room"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-white transition-colors hover:bg-ink-2"
          >
            <PlusIcon size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
