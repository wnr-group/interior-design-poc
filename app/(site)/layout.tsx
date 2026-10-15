import UtilityBar from "@/components/layout/UtilityBar";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";

/** Shop chrome around every page except the room designer. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UtilityBar />
      <SiteHeader />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
