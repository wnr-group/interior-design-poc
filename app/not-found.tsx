import Link from "next/link";
import UtilityBar from "@/components/layout/UtilityBar";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";

/**
 * Rendered by the root layout, outside app/(site), so it brings its own
 * shop chrome.
 */
export default function NotFound() {
  return (
    <>
      <UtilityBar />
      <SiteHeader />
      <main id="main" className="flex-1">
        <section className="page-x py-16 md:py-24">
          <h1 className="text-hero">We couldn’t find that page</h1>
          <p className="mt-4 max-w-xl text-base leading-6">The link may be out of date, or the room may have moved.</p>
          <Link href="/" className="btn-primary mt-8 h-12">Back to design & planning</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
