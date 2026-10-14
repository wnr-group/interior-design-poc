import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allRooms, emptyRooms, furnishedRooms, getRoom } from "@/lib/rooms";
import { roomCategories } from "@/lib/site";
import { ChevronRightIcon, PencilIcon, RulerIcon } from "@/components/icons";
import IsoRoom from "@/components/rooms/IsoRoom";
import RoomCard from "@/components/rooms/RoomCard";

export function generateStaticParams() {
  return allRooms.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/rooms/[slug]">): Promise<Metadata> {
  const room = getRoom((await params).slug);
  return room ? { title: room.name, description: room.blurb } : {};
}

export default async function RoomPage({ params }: PageProps<"/rooms/[slug]">) {
  const room = getRoom((await params).slug);
  if (!room) notFound();

  const typeLabel =
    room.kind === "empty"
      ? "Empty room"
      : `${room.furnishing === "full" ? "Fully" : "Partly"} furnished · ${roomCategories.find((c) => c.id === room.category)?.label}`;

  const similar = (
    room.kind === "empty"
      ? emptyRooms.filter((r) => r.slug !== room.slug)
      : [
          ...furnishedRooms.filter((r) => r.slug !== room.slug && r.category === room.category),
          ...furnishedRooms.filter((r) => r.category !== room.category),
        ]
  ).slice(0, 4);

  return (
    <>
      <nav aria-label="Breadcrumb" className="page-x pt-4 text-xs text-ink-2 md:pt-6">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link href="/" className="hover:underline">Design & planning</Link></li>
          <li aria-hidden="true"><ChevronRightIcon size={14} /></li>
          <li>
            <Link href={room.kind === "empty" ? "/#empty-rooms" : "/#furnished-rooms"} className="hover:underline">
              {room.kind === "empty" ? "Empty rooms" : "Furnished rooms"}
            </Link>
          </li>
          <li aria-hidden="true"><ChevronRightIcon size={14} /></li>
          <li aria-current="page" className="text-ink">{room.name}</li>
        </ol>
      </nav>

      <section className="page-x grid gap-8 pt-4 pb-14 md:pt-6 lg:grid-cols-[minmax(0,9fr)_minmax(0,4fr)] lg:gap-14">
        <div className="relative aspect-[1.6] overflow-hidden bg-tile">
          {room.kind === "furnished" ? (
            <Image src={room.image} alt={room.alt} fill preload sizes="(min-width: 1024px) 66vw, 100vw" className="object-cover" />
          ) : (
            <IsoRoom shell={room.shell} title={`${room.name}, empty room`} />
          )}
        </div>

        <div className="lg:pt-4">
          <p className="text-sm text-ink-2">{typeLabel}</p>
          <h1 className="text-hero mt-2">{room.name}</h1>
          <p className="mt-4 text-base leading-6">{room.blurb}</p>
          <dl className="mt-6 grid grid-cols-2 border-y border-line py-4 text-sm">
            <div>
              <dt className="text-ink-2">Floor area</dt>
              <dd className="mt-1 flex items-center gap-2 font-bold"><RulerIcon size={18} /> {room.sqft} sq.ft</dd>
            </div>
            {room.kind === "empty" && (
              <div>
                <dt className="text-ink-2">Footprint</dt>
                <dd className="mt-1 font-bold">{room.shell.depth} × {room.shell.width} m</dd>
              </div>
            )}
          </dl>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link href={`/designer?from=${room.slug}`} className="btn-primary h-12">
              <PencilIcon size={18} /> Design this room
            </Link>
            <Link href="/design-advice" className="btn-outline h-12">Ask a stylist about it</Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="similar-title" className="bg-surface py-12 md:py-16">
        <div className="page-x">
          <h2 id="similar-title" className="text-section">More rooms like this</h2>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 md:mt-8">
            {similar.map((r) => (
              <li key={r.slug}><RoomCard room={r} /></li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
