"use client";
import { motion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string> { value: T; label: string; count?: number }
/** Animated tab list (spring-moving indicator). Proper tablist semantics with arrow-key navigation. */
export function Tabs<T extends string>({ items, value, onChange, className, label }: { items: TabItem<T>[]; value: T; onChange: (v: T) => void; className?: string; label: string }) {
  const id = useId();
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = items[(i + (e.key === "ArrowRight" ? 1 : items.length - 1)) % items.length];
    onChange(next.value);
    document.getElementById(`${id}-${next.value}`)?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className={cn("no-scrollbar -mx-1 flex gap-1 overflow-x-auto rounded-full bg-muted p-1", className)}>
      {items.map((it, i) => {
        const active = it.value === value;
        return (
          <button key={it.value} id={`${id}-${it.value}`} role="tab" aria-selected={active} tabIndex={active ? 0 : -1} onClick={() => onChange(it.value)} onKeyDown={(e) => onKey(e, i)}
            className={cn("relative shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors", active ? "text-fg" : "text-muted-fg hover:text-fg")}>
            {active && <motion.span layoutId={`${id}-pill`} className="absolute inset-0 rounded-full bg-surface shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            <span className="relative flex items-center gap-1.5">{it.label}{it.count !== undefined && <span className="rounded-full bg-accent-soft px-1.5 text-xs text-accent">{it.count}</span>}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Filter chips (single select). */
export function Chips<T extends string>({ items, value, onChange, label }: { items: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      {items.map((it) => (
        <button key={it.value} aria-pressed={it.value === value} onClick={() => onChange(it.value)} className={cn("shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors", it.value === value ? "border-fg bg-fg text-bg" : "border-border bg-surface text-muted-fg hover:text-fg")}>{it.label}</button>
      ))}
    </div>
  );
}
