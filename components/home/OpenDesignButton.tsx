import Link from "next/link";
import { SearchIcon } from "@/components/icons";

/**
 * "Open a saved design" - designs are saved in this browser by the room
 * designer, which opens straight onto the saved list.
 */
export default function OpenDesignButton() {
  return (
    <Link href="/designer?open=saved" className="flex items-center gap-1.5 underline-offset-4 hover:underline">
      <SearchIcon size={18} />
      Open a saved design
    </Link>
  );
}
