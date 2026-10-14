import Image from "next/image";
import Link from "next/link";
import type { Room } from "@/lib/rooms";
import { PencilIcon } from "@/components/icons";
import IsoRoom from "./IsoRoom";

/**
 * A room tile: 1.6:1 visual over a white caption. On hover (or keyboard
 * focus) a dark scrim slides in with the "Design this room" action, and the
 * card lifts slightly - the reference's room-picker behaviour.
 */
export default function RoomCard({ room, sizes }: { room: Room; sizes?: string }) {
  return (
    <Link
      href={`/rooms/${room.slug}`}
      className="group block bg-white shadow-card transition-shadow duration-300 hover:shadow-card-hover focus-visible:shadow-card-hover"
    >
      <div className="relative aspect-[1.6] overflow-hidden bg-tile">
        {room.kind === "furnished" ? (
          <Image
            src={room.image}
            alt={room.alt}
            fill
            sizes={sizes ?? "(min-width: 768px) 25vw, 50vw"}
            className="object-cover"
          />
        ) : (
          <IsoRoom shell={room.shell} title={`${room.name}, empty room`} />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="flex translate-y-1 items-center gap-2 text-sm font-bold text-white transition-transform duration-200 group-hover:translate-y-0 sm:text-base">
            <PencilIcon size={18} />
            Design this room
          </span>
        </div>
      </div>
      <div className="px-3 pt-3 pb-4 sm:px-4 sm:pt-4 sm:pb-5">
        <h3 className="truncate text-[0.8125rem] leading-5 font-bold sm:text-sm">{room.name}</h3>
        <p className="text-xs leading-5 text-ink-2">{room.sqft} sq.ft</p>
      </div>
    </Link>
  );
}
