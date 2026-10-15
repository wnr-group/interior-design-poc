import { Icon, type IconProps } from "@/components/icons";

/** Extra line icons used by the room designer (same 24px grid as the site set). */

export const UndoIcon = (p: IconProps) => (
  <Icon {...p}><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></Icon>
);
export const RedoIcon = (p: IconProps) => (
  <Icon {...p}><path d="m15 14 5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" /></Icon>
);
export const SaveIcon = (p: IconProps) => (
  <Icon {...p}><path d="M5 4h11l3 3v13H5V4Z" /><path d="M8 4v5h7V4M8 20v-6h8v6" /></Icon>
);
export const FolderIcon = (p: IconProps) => (
  <Icon {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /></Icon>
);
export const DownloadIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></Icon>
);
export const FileIcon = (p: IconProps) => (
  <Icon {...p}><path d="M6 3h8l4 4v14H6V3Z" /><path d="M14 3v4h4" /></Icon>
);
export const RotateLeftIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 4v5h5" /><path d="M5.5 15a7 7 0 1 0 1.2-7.6L4 9" /></Icon>
);
export const RotateRightIcon = (p: IconProps) => (
  <Icon {...p}><path d="M20 4v5h-5" /><path d="M18.5 15a7 7 0 1 1-1.2-7.6L20 9" /></Icon>
);
export const CopyIcon = (p: IconProps) => (
  <Icon {...p}><rect x="8" y="8" width="12" height="12" rx="1.5" /><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" /></Icon>
);
export const TrashIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></Icon>
);
export const ZoomInIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m20 20-4.8-4.8M10.5 8v5M8 10.5h5" /></Icon>
);
export const ZoomOutIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m20 20-4.8-4.8M8 10.5h5" /></Icon>
);
export const RecenterIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /><circle cx="12" cy="12" r="2.5" /></Icon>
);
export const CubeIcon = (p: IconProps) => (
  <Icon {...p}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></Icon>
);
export const PlanIcon = (p: IconProps) => (
  <Icon {...p}><rect x="3.5" y="3.5" width="17" height="17" /><path d="M3.5 12H11v8.5M11 3.5V8M15 12h5.5" /></Icon>
);
export const ListIcon = (p: IconProps) => (
  <Icon {...p}><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" /></Icon>
);
export const RoomIcon = (p: IconProps) => (
  <Icon {...p}><path d="M3 20V8l9-5 9 5v12" /><path d="M9 20v-6h6v6M3 20h18" /></Icon>
);
export const SlidersIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></Icon>
);
export const MoreIcon = (p: IconProps) => (
  <Icon {...p}><path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth={3} /></Icon>
);
export const PanelLeftIcon = (p: IconProps) => (
  <Icon {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="1.5" /><path d="M9.5 4.5v15" /></Icon>
);
export const DoorIcon = (p: IconProps) => (
  <Icon {...p}><path d="M5 21V3h11v18M3 21h18M13 12h.01" /></Icon>
);
export const WindowIcon = (p: IconProps) => (
  <Icon {...p}><rect x="4" y="4" width="16" height="16" /><path d="M12 4v16M4 12h16" /></Icon>
);
export const WarningIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 4 2.5 20h19L12 4Z" /><path d="M12 10v4M12 17h.01" /></Icon>
);
export const CheckIcon = (p: IconProps) => (
  <Icon {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Icon>
);
export const ArrowLeftIcon = (p: IconProps) => (
  <Icon {...p}><path d="M20 12H5M11 6l-6 6 6 6" /></Icon>
);
export const LayersIcon = (p: IconProps) => (
  <Icon {...p}><path d="m12 4 9 5-9 5-9-5 9-5Z" /><path d="m3 14 9 5 9-5" /></Icon>
);
export const LampIcon = (p: IconProps) => (
  <Icon {...p}><path d="M8 3h8l3 7H5l3-7ZM12 10v9M8 21h8" /></Icon>
);
export const ShelfIcon = (p: IconProps) => (
  <Icon {...p}><rect x="5" y="3" width="14" height="18" /><path d="M5 9h14M5 15h14" /></Icon>
);
export const WardrobeIcon = (p: IconProps) => (
  <Icon {...p}><rect x="4" y="3" width="16" height="17" /><path d="M12 3v17M10 11v2M14 11v2M5 20v1.5M19 20v1.5" /></Icon>
);
export const ChairIcon = (p: IconProps) => (
  <Icon {...p}><path d="M7 3v10h10V3M5 13h14M7 13v8M17 13v8" /></Icon>
);
export const TableIcon = (p: IconProps) => (
  <Icon {...p}><path d="M3 8h18M6 8v12M18 8v12M6 13h12" /></Icon>
);
export const PlantIcon = (p: IconProps) => (
  <Icon {...p}><path d="M7 15h10l-1.5 6h-7L7 15ZM12 15V9" /><path d="M12 9c0-3 2-5 5-5 0 3-2 5-5 5ZM12 11c0-2.5-1.8-4-4.5-4 0 2.5 1.8 4 4.5 4Z" /></Icon>
);
