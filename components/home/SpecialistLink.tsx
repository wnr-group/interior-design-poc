import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";

/** Full-width bordered link row, as used between the reference's sections. */
export default function SpecialistLink() {
  return (
    <div className="page-x pt-10 md:pt-14">
      <Link
        href="/planners"
        className="group flex items-center justify-between gap-6 border border-line px-5 py-5 transition-colors hover:border-ink md:px-6"
      >
        <span>
          <span className="block text-sm font-bold md:text-base">Remodelling a kitchen or fitting out a wardrobe?</span>
          <span className="mt-1 block text-sm text-ink-2">Use one of our specialist planners, built for exactly those spaces.</span>
        </span>
        <ArrowRightIcon size={22} className="shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
