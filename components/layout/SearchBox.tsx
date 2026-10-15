"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import clsx from "@/lib/clsx";
import { allRooms } from "@/lib/rooms";
import { roomCategories } from "@/lib/site";
import { SearchIcon } from "@/components/icons";
import IsoRoom from "@/components/rooms/IsoRoom";

/**
 * Pill search field with live room suggestions (a combobox). Choosing a
 * suggestion opens that room; submitting the text filters the furnished
 * rooms grid on the home page via ?q=.
 */
export default function SearchBox({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return allRooms
      .filter((r) => {
        const cat = r.kind === "furnished" ? roomCategories.find((c) => c.id === r.category)?.label : "empty room";
        return `${r.name} ${cat}`.toLowerCase().includes(q);
      })
      .slice(0, 6);
  }, [query]);

  const go = (href: string) => {
    setOpen(false);
    setActive(-1);
    onNavigate?.();
    router.push(href);
  };

  const submit = () => {
    if (active >= 0 && matches[active]) return go(`/rooms/${matches[active].slug}`);
    const q = query.trim();
    if (q) go(`/?q=${encodeURIComponent(q)}#furnished-rooms`);
  };

  const showList = open && matches.length > 0;

  return (
    <form
      role="search"
      className={clsx("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label className="flex h-12 items-center gap-3 rounded-full bg-surface px-5 transition-colors focus-within:bg-white focus-within:shadow-[inset_0_0_0_2px_var(--color-ink)] hover:bg-line">
        <SearchIcon size={20} className="shrink-0" />
        <span className="sr-only">Search rooms</span>
        <input
          type="search"
          value={query}
          placeholder="What are you looking for?"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className="h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-ink-2 focus-visible:outline-none"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, matches.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, -1));
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </label>

      <ul
        id={listId}
        role="listbox"
        className={clsx(
          "absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 bg-white py-2 shadow-[0_8px_30px_rgba(0,0,0,.16)]",
          !showList && "hidden",
        )}
      >
        {matches.map((r, i) => (
          <li
            key={r.slug}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => go(`/rooms/${r.slug}`)}
            onMouseEnter={() => setActive(i)}
            className={clsx("flex cursor-pointer items-center gap-3 px-4 py-2", i === active && "bg-surface")}
          >
            <span className="relative block aspect-[1.6] w-16 shrink-0 overflow-hidden bg-tile">
              {r.kind === "furnished" ? (
                <Image src={r.image} alt="" fill sizes="64px" className="object-cover" />
              ) : (
                <IsoRoom shell={r.shell} />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{r.name}</span>
              <span className="block text-xs text-ink-2">
                {r.kind === "furnished" ? roomCategories.find((c) => c.id === r.category)?.label : "Empty room"} · {r.sqft} sq.ft
              </span>
            </span>
          </li>
        ))}
        <li role="presentation" className="mt-1 border-t border-line px-4 pt-2 text-xs text-ink-2">
          Press Enter to see all matching rooms
        </li>
      </ul>
    </form>
  );
}
