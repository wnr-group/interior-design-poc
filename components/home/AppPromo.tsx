import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/site";
import { photos } from "@/lib/rooms";
import { PhoneIcon } from "@/components/icons";
import Logo from "@/components/layout/Logo";

const stores = ["App for iOS", "App for Android"];

/**
 * App promotion: copy and a QR card on the left, a wide lifestyle photo on the
 * right with a phone mock-up laid over it. Phones get store buttons instead of
 * the QR code, which is no use on the device that would scan it.
 */
export default function AppPromo() {
  return (
    <section aria-labelledby="app-title" className="page-x grid items-center gap-8 pt-16 md:pt-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,9fr)] lg:gap-16">
      <div className="max-w-md">
        <h2 id="app-title" className="text-section">Design on the go with the {brand.name} app</h2>

        <div className="mt-6 hidden items-center gap-5 border border-line p-4 md:flex">
          {/* Plain <img>: a tiny static SVG gains nothing from next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/app-qr.svg" alt="QR code linking to the Larkspur app" width={112} height={112} className="size-28 shrink-0" />
          <p className="text-sm leading-5 text-ink-2">Scan this code with your phone camera to open the planner in the app.</p>
        </div>
        <p className="mt-4 hidden text-xs text-ink-2 md:block">
          Or search for “{brand.planner}” in your app store.
        </p>

        <div className="mt-6 flex flex-wrap gap-3 md:hidden">
          {stores.map((s) => (
            <Link key={s} href="/app" className="btn-primary h-12">
              <PhoneIcon size={18} /> {s}
            </Link>
          ))}
        </div>
      </div>

      <div className="relative aspect-[4/3] overflow-hidden bg-tile sm:aspect-[16/10]">
        <Image src={photos.appScene.src} alt={photos.appScene.alt} fill sizes="(min-width: 1024px) 62vw, 100vw" className="object-cover" />
        <span className="absolute top-4 left-4 bg-white p-2 shadow-card md:top-6 md:left-6">
          <Logo compact />
        </span>

        {/* Phone mock-up showing a room in the planner. */}
        <div className="absolute bottom-[-6%] left-[38%] w-[30%] max-w-[230px] -rotate-6 rounded-[1.6rem] bg-ink p-[3%] shadow-[0_20px_50px_rgba(0,0,0,.35)] sm:left-[42%] sm:w-[24%]">
          <div className="relative aspect-[9/17] overflow-hidden rounded-[1.1rem] bg-white">
            <Image src={photos.appScreen.src} alt={photos.appScreen.alt} fill sizes="230px" className="object-cover" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-1 bg-white/90 px-2 py-1.5 text-[0.55rem] font-bold sm:text-[0.65rem]">
              <span className="truncate">My living room</span>
              <span className="rounded-full bg-brand px-1.5 py-0.5 text-white">3D</span>
            </div>
            <div className="absolute inset-x-2 bottom-[14%] hidden justify-center gap-1 sm:flex">
              {["Sofa", "Lamp", "Rug"].map((t) => (
                <span key={t} className="rounded-full bg-white/95 px-1.5 py-0.5 text-[0.5rem] font-bold sm:text-[0.6rem]">{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute right-4 bottom-4 hidden gap-2 md:flex md:right-6 md:bottom-6">
          {stores.map((s) => (
            <Link key={s} href="/app" className="flex items-center gap-1.5 rounded-md bg-ink px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-ink-2">
              <PhoneIcon size={16} /> {s}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
