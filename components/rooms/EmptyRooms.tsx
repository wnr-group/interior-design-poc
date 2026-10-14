"use client";

import { emptyRooms } from "@/lib/rooms";
import RoomCard from "./RoomCard";
import { useViewMore, ViewMoreButton } from "./ViewMore";

export default function EmptyRooms() {
  const vm = useViewMore(emptyRooms.length, 8);

  return (
    <section id="empty-rooms" aria-labelledby="empty-rooms-title" className="page-x pt-14 md:pt-20">
      <h2 id="empty-rooms-title" className="text-section">Empty rooms</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-2 md:text-base">
        Start from a bare shell in the size and colour that is closest to your own room, then furnish it piece by piece.
      </p>
      <ul id="empty-rooms-grid" className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:mt-8 md:grid-cols-4">
        {emptyRooms.slice(0, vm.visible).map((room) => (
          <li key={room.slug}>
            <RoomCard room={room} />
          </li>
        ))}
      </ul>
      <ViewMoreButton
        remaining={vm.remaining}
        step={vm.step}
        canCollapse={vm.canCollapse}
        onMore={vm.more}
        onLess={vm.reset}
        controls="empty-rooms-grid"
      />
    </section>
  );
}
