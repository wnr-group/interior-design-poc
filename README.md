#  home design POC

A standalone proof of concept that recreates the layout and browsing
experience of a large furniture retailer's "home design" landing page, under a
fictional brand (Larkspur). No logos, copy or imagery from the reference are
used.

Next.js 16 (App Router, Cache Components) · React 19 · Tailwind CSS 4 ·
TypeScript. The only runtime dependency beyond Next/React is three.js, used by
the room designer.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

Production build:

```bash
npm run build
npm start            # http://localhost:3000
```

Photos load from Unsplash's CDN, so the machine needs internet access.

## What's on the page

| Section | Reference pattern | Notes |
| --- | --- | --- |
| Utility bar + header | Black strip, logo, nav, pill search, icons | Header hides on scroll down and returns on scroll up. "Rooms" opens a mega menu (≥1280px); a drawer handles nav below that. Search suggests rooms as you type; Enter filters the furnished-rooms grid. |
| Hero | Copy left, 16:9 media right | Furniture outlines draw themselves over the photo on a loop (pausable, respects reduced motion), with hotspots that name each piece. |
| Ways to start | Grey band, 3 tagged cards, outlined pill CTAs | Swipeable snap row below 1024px. "Open a saved design" opens a modal. |
| Specialist link | Full-width bordered link row | |
| Empty rooms | 4-col grid of 1.6:1 isometric room renders | Rooms are generated SVG (`IsoRoom`), so the grid needs no image requests. "View N more" reveals in batches. |
| Furnished rooms | Icon filter pills, segmented toggle, hover "Design this room" | Filters sync to the URL (`?room=`, `?furnish=`, `?q=`), so they're shareable and deep-linkable. |
| App promo | Copy + QR card, wide photo with app badges | Phone mock-up overlaps the photo; phones get app buttons instead of the QR code. |
| Planner promo | Grey panel joined to a wide photo, round arrow | |
| Footer | Grey, link columns | Columns become accordions on phones. |

Each room card links to `/rooms/[slug]`, a detail page with similar rooms. Nav
and footer links that sit outside the POC resolve to short holding pages
(`app/(site)/[...slug]`), so no link is dead.

## Room designer (`/designer`)

A full-screen, interactive room editor (no shop header or footer).

- **Start**: pick Bedroom, Living room, Dining room or Home office, furnished
  or empty (`New`). Deep links: `/designer?room=bedroom&start=furnished`,
  `/designer?from=<landing-room-slug>` ("Design this room" on room pages),
  `/designer?start=new` (start dialog), `/designer?open=saved` (saved list).
- **Room**: width, length and wall height; 8 floors; 10 wall colours plus a
  custom colour; matt, satin, panelling or limewash finish; add, move,
  resize and remove doors and windows on any wall.
- **3D view** (three.js): orbit, pan, zoom, reset. Walls facing the camera are
  cut away automatically. Drag furniture across the floor; click to select.
- **Floor plan** (SVG): drag to move, round handle to rotate (15° snaps, Shift
  for 1°), corner handle to resize rugs, dimension lines to each wall, wheel
  zoom and drag-to-pan.
- **Catalogue**: 29 pieces in 7 categories, searchable, with previews rendered
  from the same 3D models. Drag a card into the room or press + to drop it
  into a free spot.
- **Editing**: size variants, finishes, exact position and angle, duplicate,
  remove, undo/redo (Ctrl+Z / Ctrl+Shift+Z). Keyboard: arrows nudge, R
  rotates, Ctrl+D duplicates, Delete removes. Pieces never leave the room;
  overlaps are flagged; lamps and small plants stand on tables they are
  dropped onto.
- **Save / open / export**: named designs saved in localStorage with a
  thumbnail; the working draft autosaves; reset to the starting layout
  (undoable); export the current view as PNG and the furniture list as CSV.
- **Small screens**: panels become bottom sheets behind a tab bar.

## Layout of the code

```
app/
  (site)/                shop pages with header and footer
    page.tsx             landing page (sections in reference order)
    rooms/[slug]/page.tsx  room detail, statically generated
    [...slug]/page.tsx   holding pages for out-of-scope links
  designer/page.tsx      full-screen room designer
components/
  layout/                UtilityBar, SiteHeader, SearchBox, SiteFooter, Logo
  home/                  Hero, WaysToStart, FloorPlanSketch, SpecialistLink, AppPromo, PlannerPromo
  rooms/                 RoomCard, IsoRoom, EmptyRooms, FurnishedRooms, ViewMore
  designer/              RoomDesigner shell, Viewport3D, PlanView, panels, dialogs
  icons.tsx              inline SVG icon set
lib/
  designer/              catalogue, materials, templates, geometry, history, storage
  designer/three/        engine (render, orbit, picking), models, room shell, textures
  rooms.ts               room data and photo URLs
  site.ts                brand, navigation, footer, holding pages
  iso.ts                 isometric projection helpers
  image-loader.ts        next/image loader for the Unsplash CDN
app/globals.css          design tokens (@theme) and shared utilities
```

## Performance notes

- `next/image` uses a custom loader that asks Unsplash's CDN for exactly the
  srcset widths needed (AVIF/WebP via `auto=format`), so the Next server never
  proxies or resizes originals. Only the hero image is preloaded; everything
  else lazy-loads.
- Empty rooms, the floor-plan illustration, icons and the QR code are inline
  or static SVG.
- Every route is prerendered at build time.

## Known limitations

- Accounts, favourites and the bag are out of scope;
  their links lead to holding pages.
- Designer: saved designs live in this browser only (no sharing or sync);
  furniture is procedural, not product models; there are no wall-mounted
  pieces, no collision blocking (overlaps are flagged, not prevented) and no
  door-swing clearance checks; catalogue drag-and-drop needs a mouse (touch
  uses tap to add, then drag in the room).
- The QR code encodes `https://larkspur.example/app` (a reserved example
  domain).
- Unknown URLs render the not-found page with `noindex`, but the HTTP status
  is 200 because the response is streamed (Partial Prerendering).
- Room sizes and product names are fictional sample content.
