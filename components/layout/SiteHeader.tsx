"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import clsx from "@/lib/clsx";
import { mainNav, roomCategories } from "@/lib/site";
import { photos } from "@/lib/rooms";
import { BagIcon, categoryIcons, ChevronRightIcon, CloseIcon, HeartIcon, MenuIcon, UserIcon } from "@/components/icons";
import Logo from "./Logo";
import SearchBox from "./SearchBox";

/**
 * Sticky header that tucks away while scrolling down and returns on the way
 * up. "Rooms" opens a mega menu on wide screens; below xl a drawer holds the nav.
 */
export default function SiteHeader() {
  const [hidden, setHidden] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 6) return;
      setHidden(y > last && y > 160);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock page scroll behind the drawer; close everything on Escape.
  useEffect(() => {
    document.documentElement.style.overflow = drawerOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setMegaOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  // Transient menus reset if this tree is ever hidden by navigation.
  useLayoutEffect(() => () => {
    setDrawerOpen(false);
    setMegaOpen(false);
  }, []);

  const openMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };
  const closeMega = () => {
    closeTimer.current = setTimeout(() => setMegaOpen(false), 120);
  };

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 bg-white transition-transform duration-300",
        hidden && !megaOpen && !drawerOpen && "-translate-y-full",
      )}
    >
      <div className="page-x flex h-[4.5rem] items-center gap-4 md:h-24 xl:gap-8">
        <Link href="/" aria-label="Larkspur home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center gap-1 text-sm">
            {mainNav.map((item) =>
              item.label === "Rooms" ? (
                <li key={item.label} onMouseEnter={openMega} onMouseLeave={closeMega}>
                  <button
                    type="button"
                    aria-expanded={megaOpen}
                    aria-controls="rooms-menu"
                    onClick={() => setMegaOpen((o) => !o)}
                    className={clsx("rounded-full px-3 py-2 hover:bg-surface", megaOpen && "underline underline-offset-[6px]")}
                  >
                    {item.label}
                  </button>
                </li>
              ) : (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    aria-current={item.current ? "page" : undefined}
                    className={clsx("block rounded-full px-3 py-2 hover:bg-surface", item.current && "font-bold")}
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <SearchBox className="hidden flex-1 md:block" />

        <div className="ml-auto flex items-center md:ml-0">
          <IconLink href="/account" label="Your account" className="hidden sm:grid"><UserIcon /></IconLink>
          <IconLink href="/favourites" label="Favourites"><HeartIcon /></IconLink>
          <IconLink href="/bag" label="Shopping bag"><BagIcon /></IconLink>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
            className="grid size-10 place-items-center rounded-full hover:bg-surface xl:hidden"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      <div className="page-x pb-3 md:hidden">
        <SearchBox />
      </div>

      {/* Rooms mega menu */}
      <div
        id="rooms-menu"
        onMouseEnter={openMega}
        onMouseLeave={closeMega}
        className={clsx(
          "absolute inset-x-0 top-full hidden border-t border-line bg-white shadow-[0_16px_30px_rgba(0,0,0,.08)] transition-[opacity,visibility] duration-200 xl:block",
          megaOpen ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <div className="page-x grid grid-cols-[1fr_1fr_minmax(0,1.2fr)] gap-10 py-10">
          <div>
            <p className="text-xs font-bold tracking-wide text-ink-2 uppercase">Furnished rooms</p>
            <ul className="mt-4 space-y-1">
              {roomCategories.map((c) => {
                const Icon = categoryIcons[c.id];
                return (
                  <li key={c.id}>
                    <Link
                      href={`/?room=${c.id}#furnished-rooms`}
                      onClick={() => setMegaOpen(false)}
                      className="group flex items-center gap-3 py-1.5 text-base font-bold hover:underline"
                    >
                      <Icon size={20} /> {c.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold tracking-wide text-ink-2 uppercase">Start from scratch</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link href="/#empty-rooms" onClick={() => setMegaOpen(false)} className="hover:underline">Empty rooms</Link></li>
              <li><Link href="/designer?start=new" onClick={() => setMegaOpen(false)} className="hover:underline">Draw your floor plan</Link></li>
              <li><Link href="/planners" onClick={() => setMegaOpen(false)} className="hover:underline">Kitchen and storage planners</Link></li>
              <li><Link href="/design-advice" onClick={() => setMegaOpen(false)} className="hover:underline">Book a stylist</Link></li>
            </ul>
          </div>
          <Link href="/#ways-to-start" onClick={() => setMegaOpen(false)} className="group grid grid-cols-2 bg-surface">
            <span className="relative aspect-square overflow-hidden">
              <Image src={photos.sampleRoom.src} alt="" fill sizes="240px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            </span>
            <span className="flex flex-col justify-center p-6">
              <span className="text-lg leading-6 font-bold">New to the planner?</span>
              <span className="mt-2 text-sm text-ink-2">Three ways to get your first room started.</span>
              <span className="mt-4 text-sm font-bold underline underline-offset-4">See how</span>
            </span>
          </Link>
        </div>
      </div>

      {/* Mobile / tablet drawer */}
      <div
        className={clsx("fixed inset-0 z-50 xl:hidden", drawerOpen ? "visible" : "invisible")}
        aria-hidden={!drawerOpen}
      >
        <div
          className={clsx("absolute inset-0 bg-black/50 transition-opacity duration-300", drawerOpen ? "opacity-100" : "opacity-0")}
          onClick={() => setDrawerOpen(false)}
        />
        <nav
          aria-label="Mobile"
          className={clsx(
            "absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col overflow-y-auto bg-white transition-transform duration-300",
            drawerOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-[4.5rem] items-center justify-between px-5">
            <Logo />
            <button type="button" aria-label="Close menu" onClick={() => setDrawerOpen(false)} className="grid size-10 place-items-center rounded-full hover:bg-surface">
              <CloseIcon />
            </button>
          </div>
          <ul className="px-5 py-4">
            {mainNav.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between py-3 text-xl font-bold"
                >
                  {item.label}
                  <ChevronRightIcon size={20} />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mx-5 border-t border-line py-5">
            <p className="text-xs font-bold tracking-wide text-ink-2 uppercase">Browse rooms</p>
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {roomCategories.map((c) => {
                const Icon = categoryIcons[c.id];
                return (
                  <li key={c.id}>
                    <Link
                      href={`/?room=${c.id}#furnished-rooms`}
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-2 bg-surface px-3 py-3 text-sm hover:bg-line"
                    >
                      <Icon size={18} /> {c.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="mt-auto bg-surface px-5 py-5 text-sm">
            <Link href="/account" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 font-bold">
              <UserIcon size={20} /> Sign in or join
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

function IconLink({ href, label, className, children }: { href: string; label: string; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} aria-label={label} className={clsx("grid size-10 place-items-center rounded-full hover:bg-surface", className ?? "grid")}>
      {children}
    </Link>
  );
}
