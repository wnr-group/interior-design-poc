import Link from "next/link";
import { ChatIcon, GlobeIcon, StoreIcon, TruckIcon } from "@/components/icons";

/** Thin black strip above the header: locale, help line and store tools. */
export default function UtilityBar() {
  return (
    <div className="bg-ink text-xs text-white">
      <div className="page-x flex h-9 items-center justify-between gap-4">
        <span className="flex items-center gap-2">
          <GlobeIcon size={16} />
          IN <span className="text-white/50">|</span> English
        </span>
        <Link href="/design-advice" className="hidden items-center gap-2 hover:underline md:flex">
          <ChatIcon size={16} />
          Chat with a design advisor, 9am–9pm every day
        </Link>
        <span className="flex items-center gap-5">
          <Link href="/delivery" className="hidden items-center gap-2 hover:underline sm:flex">
            <TruckIcon size={16} /> Enter PIN code
          </Link>
          <Link href="/stores" className="flex items-center gap-2 hover:underline">
            <StoreIcon size={16} /> Find a store
          </Link>
        </span>
      </div>
    </div>
  );
}
