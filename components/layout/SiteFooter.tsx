import Link from "next/link";
import { brand, footerColumns } from "@/lib/site";
import { ChevronDownIcon, InstagramIcon, PinterestIcon, YoutubeIcon } from "@/components/icons";

const socials = [
  { label: "Instagram", Icon: InstagramIcon },
  { label: "Pinterest", Icon: PinterestIcon },
  { label: "YouTube", Icon: YoutubeIcon },
];

/**
 * Light grey footer: membership pitch, then link columns that collapse into
 * accordions (<details>) on phones, then a legal strip.
 */
export default function SiteFooter() {
  return (
    <footer className="bg-surface text-sm">
      <div className="page-x grid gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,3fr)] lg:gap-16">
        <div className="max-w-sm">
          <h2 className="text-base font-bold">Join {brand.name} Club</h2>
          <p className="mt-3 leading-6 text-ink-2">
            Free membership with member prices, early access to new collections and a free design session every year.
          </p>
          <Link href="/club" className="btn-primary mt-5">Join for free</Link>
        </div>

        {/* Phones: one accordion per column. */}
        <div className="border-t border-line md:hidden">
          {footerColumns.map((col) => (
            <details key={col.title} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-bold [&::-webkit-details-marker]:hidden">
                {col.title}
                <ChevronDownIcon size={18} className="transition-transform group-open:rotate-180" />
              </summary>
              <FooterLinks links={col.links} />
            </details>
          ))}
        </div>
        {/* Tablet and up: open columns. */}
        <div className="hidden gap-x-8 md:grid md:grid-cols-4">
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h2 className="mb-4 font-bold">{col.title}</h2>
              <FooterLinks links={col.links} />
            </div>
          ))}
        </div>
      </div>

      <div className="page-x flex flex-col gap-5 border-t border-line py-6 text-xs text-ink-2 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          {socials.map(({ label, Icon }) => (
            <span key={label} title={`${label} (not linked in this prototype)`} className="grid size-10 place-items-center rounded-full border border-line bg-white text-ink">
              <Icon size={18} />
              <span className="sr-only">{label}</span>
            </span>
          ))}
        </div>
        <p>
          © {brand.name} Home 2026 · A design prototype. Room photos from Unsplash.
        </p>
        <ul className="flex gap-5">
          <li><Link href="/privacy" className="hover:underline">Privacy</Link></li>
          <li><Link href="/cookies" className="hover:underline">Cookies</Link></li>
          <li><Link href="/terms" className="hover:underline">Terms</Link></li>
        </ul>
      </div>
    </footer>
  );
}

function FooterLinks({ links }: { links: { label: string; href: string }[] }) {
  return (
    <ul className="space-y-3 pb-5 text-ink-2 md:pb-0">
      {links.map((l) => (
        <li key={l.label}>
          <Link href={l.href} className="hover:text-ink hover:underline">{l.label}</Link>
        </li>
      ))}
    </ul>
  );
}
