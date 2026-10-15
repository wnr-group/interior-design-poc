import type { SVGProps } from "react";

/** Small inline line icons (24px grid, currentColor stroke). */
export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

export function Icon({ size = 24, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const PencilIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></Icon>
);
export const SearchIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m20 20-4.8-4.8" /></Icon>
);
export const UserIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c.8-4 4-6 8-6s7.2 2 8 6" /></Icon>
);
export const HeartIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 20s-7.5-4.6-8.6-9.6C2.7 7.1 5 4.5 8 4.5c1.8 0 3.2 1 4 2.3.8-1.3 2.2-2.3 4-2.3 3 0 5.3 2.6 4.6 5.9C19.5 15.4 12 20 12 20Z" /></Icon>
);
export const BagIcon = (p: IconProps) => (
  <Icon {...p}><path d="M5 8h14l-1.2 12H6.2L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></Icon>
);
export const MenuIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Icon>
);
export const CloseIcon = (p: IconProps) => (
  <Icon {...p}><path d="M6 6l12 12M18 6 6 18" /></Icon>
);
export const GlobeIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" /></Icon>
);
export const ChatIcon = (p: IconProps) => (
  <Icon {...p}><path d="M5 5h14v10H9l-4 4V5Z" /></Icon>
);
export const TruckIcon = (p: IconProps) => (
  <Icon {...p}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17.5" cy="17.5" r="1.8" /></Icon>
);
export const StoreIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 9.5 5.5 4h13L20 9.5M4 9.5h16M5 9.5V20h14V9.5M10 20v-5h4v5" /></Icon>
);
export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}><path d="m6 9 6 6 6-6" /></Icon>
);
export const ChevronRightIcon = (p: IconProps) => (
  <Icon {...p}><path d="m9 6 6 6-6 6" /></Icon>
);
export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 12h15M13 6l6 6-6 6" /></Icon>
);
export const PauseIcon = (p: IconProps) => (
  <Icon {...p}><path d="M9 6v12M15 6v12" /></Icon>
);
export const PlayIcon = (p: IconProps) => (
  <Icon {...p}><path d="M8 5.5v13l10.5-6.5L8 5.5Z" /></Icon>
);
export const PlusIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
);
export const SofaIcon = (p: IconProps) => (
  <Icon {...p}><path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" /><path d="M3 13a2 2 0 0 1 4 0v1h10v-1a2 2 0 0 1 4 0v4H3v-4ZM5 17v2M19 17v2" /></Icon>
);
export const BedIcon = (p: IconProps) => (
  <Icon {...p}><path d="M3 18V6M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5" /><circle cx="7" cy="11" r="1.6" /></Icon>
);
export const DeskIcon = (p: IconProps) => (
  <Icon {...p}><path d="M3 10h18M5 10v9M19 10v9M14 10v5h5" /><path d="M9 7V4h6v3" /></Icon>
);
export const DiningIcon = (p: IconProps) => (
  <Icon {...p}><path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2 1.5-3 4-3 7h3" /></Icon>
);
export const KitchenIcon = (p: IconProps) => (
  <Icon {...p}><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M4 9h16M8 6h.01M12 6h.01M10 13h4" /></Icon>
);
export const PhoneIcon = (p: IconProps) => (
  <Icon {...p}><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M11 18.5h2" /></Icon>
);
export const RulerIcon = (p: IconProps) => (
  <Icon {...p}><path d="m3 17 14-14 4 4L7 21l-4-4Z" /><path d="m7 13 2 2M10 10l2 2M13 7l2 2" /></Icon>
);
export const InstagramIcon = (p: IconProps) => (
  <Icon {...p}><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.6" /><path d="M16.8 7.2h.01" /></Icon>
);
export const PinterestIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M11 9.5c0-1.6 1.2-2.5 2.6-2.5 1.6 0 2.6 1.1 2.6 2.7 0 2-1.2 3.6-2.8 3.6-.8 0-1.5-.5-1.3-1.4M12 11l-2.2 9" /></Icon>
);
export const YoutubeIcon = (p: IconProps) => (
  <Icon {...p}><rect x="3" y="6" width="18" height="12" rx="3.5" /><path d="m10.5 9.5 4 2.5-4 2.5v-5Z" /></Icon>
);

export const categoryIcons = {
  living: SofaIcon,
  bedroom: BedIcon,
  office: DeskIcon,
  dining: DiningIcon,
  kitchen: KitchenIcon,
} as const;
