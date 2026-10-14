import Image from "next/image";
import Link from "next/link";
import { photos } from "@/lib/rooms";
import FloorPlanSketch from "./FloorPlanSketch";
import OpenDesignButton from "./OpenDesignButton";

type Way = {
  tag: string;
  title: string;
  cta: string;
  href: string;
  visual: React.ReactNode;
};

const ways: Way[] = [
  {
    tag: "Quick start",
    title: "Try ideas in a ready-made room",
    cta: "Choose a room",
    href: "#empty-rooms",
    visual: <Image src={photos.sampleRoom.src} alt={photos.sampleRoom.alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 44vw, 85vw" className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />,
  },
  {
    tag: "Made to measure",
    title: "Draw a room that matches your floor plan",
    cta: "Draw your room",
    href: "/designer?start=new",
    visual: <FloorPlanSketch />,
  },
  {
    tag: "Most personal",
    title: "Plan it together with an interior stylist",
    cta: "Book a session",
    href: "/design-advice",
    visual: <Image src={photos.stylist.src} alt={photos.stylist.alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 44vw, 85vw" className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />,
  },
];

/**
 * Grey band with three entry points. Three columns on desktop; below that
 * the cards become a swipeable, snapping row that peeks the next card.
 */
export default function WaysToStart() {
  return (
    <section id="ways-to-start" aria-labelledby="ways-title" className="bg-surface py-10 md:py-12">
      <div className="page-x">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <h2 id="ways-title" className="text-section">Ways to start</h2>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/account" className="underline-offset-4 hover:underline">
              Sign in
            </Link>
            <OpenDesignButton />
          </div>
        </div>

        <ul className="-mx-4 mt-6 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 no-scrollbar sm:-mx-6 sm:scroll-px-6 sm:px-6 md:mt-8 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0">
          {ways.map((w) => (
            <li key={w.title} className="w-[85%] shrink-0 snap-start sm:w-[55%] md:w-[44%] lg:w-auto">
              <Link href={w.href} className="group flex h-full flex-col bg-white transition-shadow duration-300 hover:shadow-card-hover">
                <div className="relative aspect-video overflow-hidden bg-tile">
                  {w.visual}
                  <span className="absolute top-3 left-3 border border-line bg-white px-2.5 py-1 text-xs md:top-4 md:left-4">{w.tag}</span>
                </div>
                <div className="flex flex-1 flex-col items-start gap-6 p-5 md:p-6 lg:p-8">
                  <h3 className="text-card">{w.title}</h3>
                  <span className="btn-outline mt-auto group-hover:border-ink group-hover:shadow-[inset_0_0_0_1px_var(--color-ink)]">{w.cta}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
