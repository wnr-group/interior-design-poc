import { brand } from "@/lib/site";

/** Larkspur mark: a stem of florets, plus the lowercase wordmark. */
function Mark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="var(--color-brand)" />
      <path d="M16 27V12" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 22c-2.6-.2-4.4-1.6-5-4 2.4.1 4.2 1.4 5 4ZM16 19c2.6-.2 4.4-1.6 5-4-2.4.1-4.2 1.4-5 4Z" fill="#fff" />
      <circle cx="16" cy="6.8" r="2.3" fill="#fff" />
      <circle cx="12.6" cy="10" r="1.9" fill="#fff" opacity=".85" />
      <circle cx="19.4" cy="10" r="1.9" fill="#fff" opacity=".85" />
    </svg>
  );
}

export default function Logo({ compact = false }: { compact?: boolean }) {
  if (compact) return <Mark size={28} />;
  return (
    <span className="flex items-center gap-2">
      <Mark />
      <span className="text-[1.375rem] leading-none font-bold tracking-[-0.03em] lowercase">{brand.name}</span>
    </span>
  );
}
