import type { Metadata } from "next";
import { Suspense } from "react";
import RoomDesigner, { DesignerSkeleton } from "@/components/designer/RoomDesigner";

export const metadata: Metadata = {
  title: "Room designer",
  description: "Choose a room, set its size, walls and floor, then furnish it in 3D: drag, rotate and restyle every piece and save your design.",
};

/**
 * Full-screen room designer. It lives outside app/(site) so it has no shop
 * header or footer. What it opens depends on the URL and browser storage,
 * so the editor renders on the client behind a prerendered skeleton.
 */
export default function DesignerPage() {
  return (
    <Suspense fallback={<DesignerSkeleton />}>
      <RoomDesigner />
    </Suspense>
  );
}
