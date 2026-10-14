"use client";

import { Suspense, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "@/lib/clsx";
import { furnishedRooms } from "@/lib/rooms";
import { roomCategories, type RoomCategory } from "@/lib/site";
import { categoryIcons, CloseIcon } from "@/components/icons";
import RoomCard from "./RoomCard";
import { useViewMore, ViewMoreButton } from "./ViewMore";

type Furnish = "full" | "partial";
type Filters = { room: RoomCategory | null; furnish: Furnish; q: string };

const isCategory = (v: string | null): v is RoomCategory => roomCategories.some((c) => c.id === v);

/**
 * Furnished room browser: category pills, a fully/partly furnished switch and
 * free-text search (from the header). Filters live in the URL (?room=,
 * ?furnish=, ?q=) so header links and the search box can deep-link here and
 * a filtered view can be shared. Updates use history.replaceState, which
 * Next keeps in sync with useSearchParams without a server round trip.
 */
export default function FurnishedRooms() {
  return (
    <section id="furnished-rooms" aria-labelledby="furnished-rooms-title" className="page-x pt-14 md:pt-20">
      <h2 id="furnished-rooms-title" className="text-section">Furnished rooms</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-2 md:text-base">
        Already styled by our designers. Swap pieces, change colours and make the room your own.
      </p>
      {/* The static shell shows the unfiltered grid; the URL's filters apply
          once the client reads them. */}
      <Suspense fallback={<Browser filters={{ room: null, furnish: "full", q: "" }} />}>
        <UrlBrowser />
      </Suspense>
    </section>
  );
}

function UrlBrowser() {
  const params = useSearchParams();
  const room = params.get("room");
  const filters: Filters = {
    room: isCategory(room) ? room : null,
    furnish: params.get("furnish") === "partial" ? "partial" : "full",
    q: (params.get("q") ?? "").trim(),
  };

  const update = useCallback(
    (patch: Partial<Record<"room" | "furnish" | "q", string | null>>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      const qs = next.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
    },
    [params],
  );

  return <Browser filters={filters} update={update} />;
}

function Browser({
  filters,
  update,
}: {
  filters: Filters;
  update?: (patch: Partial<Record<"room" | "furnish" | "q", string | null>>) => void;
}) {
  const { room, furnish, q } = filters;

  const rooms = useMemo(() => {
    const needle = q.toLowerCase();
    return furnishedRooms.filter((r) => {
      if (room && r.category !== room) return false;
      // A search looks across both furnishing levels.
      if (needle) {
        const label = roomCategories.find((c) => c.id === r.category)?.label ?? "";
        return `${r.name} ${r.blurb} ${label}`.toLowerCase().includes(needle);
      }
      return r.furnishing === furnish;
    });
  }, [room, furnish, q]);

  const pill = (active: boolean) =>
    clsx(
      "btn h-10 border px-4 font-normal sm:px-5",
      active ? "border-ink bg-ink text-white" : "border-transparent bg-surface text-ink hover:bg-line",
    );

  return (
    <>
      <div className="mt-6 flex flex-col gap-4 md:mt-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          <div role="group" aria-label="Room type" className="flex w-max gap-2 sm:gap-3">
            <button type="button" className={pill(!room)} aria-pressed={!room} onClick={() => update?.({ room: null })}>
              All
            </button>
            {roomCategories.map((c) => {
              const Icon = categoryIcons[c.id];
              const active = room === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={pill(active)}
                  aria-pressed={active}
                  onClick={() => update?.({ room: active ? null : c.id })}
                >
                  <Icon size={18} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {q ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink-2">
              {rooms.length} {rooms.length === 1 ? "room" : "rooms"} for <strong className="text-ink">“{q}”</strong>
            </span>
            <button type="button" className="btn-outline h-8 px-3 text-xs" onClick={() => update?.({ q: null })}>
              <CloseIcon size={14} /> Clear search
            </button>
          </div>
        ) : (
          <div role="radiogroup" aria-label="How furnished" className="inline-flex self-start border border-ink text-xs lg:self-auto">
            {(
              [
                ["full", "Fully furnished"],
                ["partial", "Partly furnished"],
              ] as const
            ).map(([value, label]) => {
              const active = furnish === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => update?.({ furnish: value === "full" ? null : value })}
                  className={clsx(
                    "h-9 px-3 font-bold transition-colors sm:px-4",
                    active ? "bg-ink text-white" : "bg-white text-ink hover:bg-surface",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Keyed by the filters so "View more" starts again for each new view. */}
      <RoomGrid key={`${room}-${furnish}-${q}`} rooms={rooms} onClear={() => update?.({ q: null, room: null })} />
    </>
  );
}

function RoomGrid({ rooms, onClear }: { rooms: typeof furnishedRooms; onClear: () => void }) {
  const vm = useViewMore(rooms.length, 8);

  if (rooms.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-start gap-4 bg-surface p-8 md:mt-8">
        <p className="text-base font-bold">No rooms match that search.</p>
        <p className="text-sm text-ink-2">Try a room type such as “bedroom”, or a colour like “green”.</p>
        <button type="button" className="btn-primary" onClick={onClear}>
          Show all rooms
        </button>
      </div>
    );
  }

  return (
    <>
      <ul id="furnished-rooms-grid" className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:mt-8 md:grid-cols-4">
        {rooms.slice(0, vm.visible).map((r) => (
          <li key={r.slug}>
            <RoomCard room={r} />
          </li>
        ))}
      </ul>
      <ViewMoreButton
        remaining={vm.remaining}
        step={vm.step}
        canCollapse={vm.canCollapse}
        onMore={vm.more}
        onLess={vm.reset}
        controls="furnished-rooms-grid"
      />
    </>
  );
}
