"use client";

import { useEffect, useId, useRef, useState } from "react";
import clsx from "@/lib/clsx";
import { isDark } from "@/lib/designer/materials";
import { CheckIcon } from "./icons";

/** Small controls shared by the designer panels. */

export function PanelSection({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="border-b border-line px-4 py-5 last:border-b-0">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function IconButton({
  label, onClick, children, disabled, active, className, size = "md",
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "grid shrink-0 place-items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-35",
        size === "sm" ? "size-8" : "size-10",
        active ? "bg-ink text-white" : "hover:bg-surface enabled:active:bg-line",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Segmented single-choice control. */
export function Segmented<T extends string>({
  label, value, options, onChange, size = "md",
}: {
  label: string;
  value: T;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-full bg-surface p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-3 font-bold whitespace-nowrap transition-colors",
            size === "sm" ? "h-8 text-xs" : "h-9 text-sm",
            value === o.value ? "bg-white text-ink shadow-card" : "text-ink-2 hover:text-ink",
          )}
        >
          {o.icon}
          <span className="truncate">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Number input with a unit and steppers. Typing is kept local until it is a
 * valid number; out-of-range values are clamped when committed.
 */
export function NumberField({
  label, value, onChange, min, max, step = 1, unit = "cm", compact,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  compact?: boolean;
}) {
  const id = useId();
  const [text, setText] = useState(String(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  const commit = (raw: string, final: boolean) => {
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(n)) {
      if (final) setText(String(value));
      return;
    }
    const clamped = Math.min(max, Math.max(min, Math.round(n)));
    if (final || clamped === n) onChange(clamped);
    if (final) setText(String(clamped));
  };
  const nudge = (dir: 1 | -1) => {
    const next = Math.min(max, Math.max(min, value + dir * step));
    onChange(next);
    setText(String(next));
  };

  return (
    <div className={clsx("min-w-0", compact ? "" : "flex-1")}>
      <label htmlFor={id} className="mb-1 block text-xs text-ink-2">{label}</label>
      <div className="flex h-10 items-center rounded-md border border-line-strong bg-white focus-within:border-ink focus-within:shadow-[inset_0_0_0_1px_var(--color-ink)]">
        <button type="button" aria-label={`Decrease ${label}`} onClick={() => nudge(-1)} className="grid h-full w-8 shrink-0 place-items-center text-ink-2 hover:text-ink">−</button>
        <input
          id={id}
          inputMode="numeric"
          value={text}
          onFocus={() => (focused.current = true)}
          onBlur={(e) => {
            focused.current = false;
            commit(e.target.value, true);
          }}
          onChange={(e) => {
            setText(e.target.value);
            commit(e.target.value, false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "ArrowUp") { e.preventDefault(); nudge(1); }
            if (e.key === "ArrowDown") { e.preventDefault(); nudge(-1); }
          }}
          className="w-full min-w-0 bg-transparent text-center text-sm tabular-nums outline-none"
        />
        <span className="pr-1 text-xs text-ink-3">{unit}</span>
        <button type="button" aria-label={`Increase ${label}`} onClick={() => nudge(1)} className="grid h-full w-8 shrink-0 place-items-center text-ink-2 hover:text-ink">+</button>
      </div>
    </div>
  );
}

/** Range slider with a label and current value. */
export function Slider({
  label, value, min, max, step = 1, onChange, format = (v) => `${v}`,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const id = useId();
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <label htmlFor={id} className="text-ink-2">{label}</label>
        <span className="font-bold tabular-nums">{format(value)}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--color-brand)]" />
    </div>
  );
}

/** Round colour swatch used as a radio button. */
export function Swatch({ color, label, selected, onSelect, size = 32, pattern }: { color: string; label: string; selected: boolean; onSelect: () => void; size?: number; pattern?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      onClick={onSelect}
      style={{ width: size, height: size, backgroundColor: color, backgroundImage: pattern }}
      className={clsx(
        "relative grid shrink-0 place-items-center rounded-full border border-black/15 transition-shadow",
        selected ? "shadow-[0_0_0_2px_#fff,0_0_0_4px_var(--color-ink)]" : "hover:shadow-[0_0_0_2px_#fff,0_0_0_3px_var(--color-line-strong)]",
      )}
    >
      {selected && <CheckIcon size={14} className={isDark(color) ? "text-white" : "text-ink"} strokeWidth={2.5} />}
    </button>
  );
}

/** Closes when clicking outside or pressing Escape; used by dropdown menus. */
export function useDismiss(open: boolean, close: () => void, ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close, ref]);
}

export type MenuItem = { label: string; icon?: React.ReactNode; onSelect: () => void; danger?: boolean; hint?: string };

/** Button with a simple dropdown menu. */
export function Menu({ label, button, items, align = "right" }: { label: string; button: React.ReactNode; items: MenuItem[]; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();
  useDismiss(open, () => setOpen(false), ref);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title={label}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-bold hover:bg-surface"
      >
        {button}
      </button>
      {open && (
        <ul id={menuId} role="menu" aria-label={label} className={clsx("absolute top-full z-40 mt-1 w-64 rounded-lg border border-line bg-white py-1.5 shadow-card-hover", align === "right" ? "right-0" : "left-0")}>
          {items.map((item) => (
            <li key={item.label} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={clsx("flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-surface", item.danger && "text-brand-dark")}
              >
                {item.icon}
                <span className="flex-1">
                  {item.label}
                  {item.hint && <span className="block text-xs text-ink-3">{item.hint}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
