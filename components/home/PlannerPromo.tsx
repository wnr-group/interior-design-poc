import Image from "next/image";
import Link from "next/link";
import { photos } from "@/lib/rooms";
import { ArrowRightIcon } from "@/components/icons";

/**
 * Closing promo: a grey text panel joined to a wide photo, the whole block a
 * single link. The round arrow button slides on hover.
 */
export default function PlannerPromo() {
  return (
    <section aria-labelledby="planners-title" className="page-x pt-16 pb-16 md:pt-24 md:pb-24">
      <Link href="/planners" className="group grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="order-2 flex flex-col items-start bg-surface p-6 md:p-10 lg:order-1 lg:p-12">
          <h2 id="planners-title" className="text-xl leading-7 font-bold md:text-[1.75rem] md:leading-9">Looking for our storage and kitchen planners?</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-ink-2 md:mt-4">
            Configure modular shelving and wardrobes to the centimetre, or plan a complete kitchen from base cabinets up.
          </p>
          <span className="mt-8 grid size-12 place-items-center rounded-full bg-white text-ink shadow-card transition-[transform,background-color,color] duration-300 group-hover:translate-x-2 group-hover:bg-ink group-hover:text-white lg:mt-auto">
            <ArrowRightIcon size={20} />
            <span className="sr-only">Go to specialist planners</span>
          </span>
        </div>
        <div className="relative order-1 aspect-[16/9] overflow-hidden bg-tile lg:order-2 lg:aspect-[2/1]">
          <Image src={photos.storageWall.src} alt={photos.storageWall.alt} fill sizes="(min-width: 1024px) 66vw, 100vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
        </div>
      </Link>
    </section>
  );
}
