"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import clsx from "@/lib/clsx";
import { brand } from "@/lib/site";
import { photos } from "@/lib/rooms";
import { PauseIcon, PencilIcon, PlayIcon, PlusIcon } from "@/components/icons";

/* Furniture traced on the hero photo (coordinates in its 1280x720 frame). */
const outlines = [
  { d: "M346 718V586q0-12 14-13h22v-35q2-12 16-12h302q14 0 16 14v35h14q14 2 14 15v128", color: "var(--color-brand)" },
  { d: "M574 548q62-10 126 0l-10 82q-58-8-118-2Z", color: "var(--color-brand)" },
  { d: "M770 470q0-6 6-6h280q6 0 6 6v246H770ZM790 545h254", color: "var(--color-sage)" },
  { d: "M1006 298q6-36 42-50l30-10q22 8 26 28l-18 68q-36 10-68-12ZM1104 270l26 16 8 432", color: "var(--color-brand)" },
  { d: "M300 248c90 22 150 112 138 182-10 70-78 130-148 130-80 0-128-70-120-150 8-80 60-160 130-162ZM246 660h72l-4 58h-64Z", color: "var(--color-sage)" },
];

const hotspots = [
  { x: 40.6, y: 82, label: "Two-seat sofa", detail: "Shown in ink black twill" },
  { x: 71.5, y: 78, label: "Six-drawer chest", detail: "Painted, with ceramic knobs" },
  { x: 83, y: 39, label: "Task floor lamp", detail: "Adjustable shade" },
  { x: 23, y: 52, label: "Weeping fig", detail: "In a seagrass basket" },
];

/**
 * Split hero: copy on the left, a 16:9 visual on the right. Instead of the
 * reference's screen recording, the photo is "traced" by a looping outline
 * animation (the planner recognising each piece), with hotspots that name
 * the pieces. A pause control stops the loop, as with any autoplaying media.
 */
export default function Hero() {
  const [paused, setPaused] = useState(false);
  const [openSpot, setOpenSpot] = useState<number | null>(null);

  return (
    <section className="page-x grid items-center gap-6 pt-6 pb-12 md:gap-10 md:pt-10 md:pb-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,9fr)] lg:gap-16">
      <div className="order-2 max-w-xl lg:order-1">
        <p className="flex items-center gap-2.5 text-lg font-bold md:text-xl">
          <PencilIcon size={24} />
          {brand.planner}
        </p>
        <h1 className="text-hero mt-5 md:mt-6 lg:mt-20">Plan your whole room before you buy a thing</h1>
        <p className="mt-3 text-base leading-6 text-ink md:mt-4">
          Sketch your layout, try colours and finishes, and arrange furniture in a true-to-scale room. See how every
          piece fits and works together before it reaches your door.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 md:mt-8">
          <Link href="#ways-to-start" className="btn-primary h-12 px-7">
            Start designing
          </Link>
          <Link href="/design-advice" className="text-sm font-bold underline underline-offset-4 hover:no-underline">
            Or book a stylist
          </Link>
        </div>
      </div>

      <div className={clsx("relative order-1 aspect-video overflow-hidden bg-tile lg:order-2", paused && "is-paused")}>
        <Image src={photos.hero.src} alt={photos.hero.alt} fill preload sizes="(min-width: 1024px) 62vw, 100vw" className="object-cover" />

        <svg viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          {outlines.map((o, i) => (
            <path
              key={i}
              d={o.d}
              pathLength={1}
              className="trace-path"
              style={{ animationDelay: `${i * 0.35}s` }}
              fill="none"
              stroke={o.color}
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>

        {hotspots.map((h, i) => {
          const open = openSpot === i;
          const flip = h.x > 60;
          return (
            <div
              key={h.label}
              className="absolute"
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
              onMouseEnter={() => setOpenSpot(i)}
              onMouseLeave={() => setOpenSpot(null)}
            >
              <div className="trace-pop" style={{ animationDelay: `${i * 0.35}s` }}>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-label={`${h.label}: ${h.detail}`}
                  onClick={() => setOpenSpot(open ? null : i)}
                  onFocus={() => setOpenSpot(i)}
                  onBlur={() => setOpenSpot(null)}
                  className="relative -translate-x-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-full bg-white/95 text-ink shadow-[0_1px_6px_rgba(0,0,0,.3)] transition-transform hover:scale-110 sm:size-8"
                >
                  <span className="absolute inset-0 rounded-full bg-white motion-safe:animate-[pulse-ring_2s_ease-out_infinite]" />
                  <PlusIcon size={16} className={clsx("relative transition-transform", open && "rotate-45")} />
                </button>
              </div>
              <div
                role="status"
                className={clsx(
                  "absolute top-0 z-10 w-max max-w-[11rem] -translate-y-1/2 bg-white px-3 py-2 shadow-[0_4px_16px_rgba(0,0,0,.18)] transition duration-200",
                  flip ? "right-6" : "left-6",
                  open ? "visible opacity-100" : "invisible opacity-0",
                )}
              >
                <p className="text-xs font-bold sm:text-sm">{h.label}</p>
                <p className="text-xs text-ink-2">{h.detail}</p>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Play outline animation" : "Pause outline animation"}
          className="absolute right-3 bottom-3 grid size-10 place-items-center rounded-full bg-ink/80 text-white transition-colors hover:bg-ink md:right-4 md:bottom-4"
        >
          {paused ? <PlayIcon size={18} /> : <PauseIcon size={18} />}
        </button>
      </div>
    </section>
  );
}
