import Hero from "@/components/home/Hero";
import WaysToStart from "@/components/home/WaysToStart";
import SpecialistLink from "@/components/home/SpecialistLink";
import EmptyRooms from "@/components/rooms/EmptyRooms";
import FurnishedRooms from "@/components/rooms/FurnishedRooms";
import AppPromo from "@/components/home/AppPromo";
import PlannerPromo from "@/components/home/PlannerPromo";

/**
 * Design & planning landing page. Section order follows the reference:
 * split hero, entry points on a grey band, a specialist link row, the two
 * room pickers, the app promo and a closing planner promo.
 */
export default function HomeDesignPage() {
  return (
    <>
      <Hero />
      <WaysToStart />
      <SpecialistLink />
      <EmptyRooms />
      <FurnishedRooms />
      <AppPromo />
      <PlannerPromo />
    </>
  );
}
