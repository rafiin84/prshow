"use client";
import { Info } from "@phosphor-icons/react";
import { useId, useState } from "react";
import { cn, initials } from "@/lib/utils";

export const Card = ({ className, children, as: Tag = "div", ...p }: React.HTMLAttributes<HTMLElement> & { as?: "div" | "section" | "article" | "li" }) => (
  <Tag className={cn("rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm", className)} {...p}>{children}</Tag>
);
export const Skeleton = ({ className }: { className?: string }) => <div aria-hidden className={cn("skeleton", className)} />;

export function Progress({ value, label, className, tone = "accent" }: { value: number; label: string; className?: string; tone?: "accent" | "success" | "gold" }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", tone === "accent" ? "bg-accent" : tone === "success" ? "bg-success" : "bg-gold")} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Avatar({ name, hue, size = 40, className }: { name: string; hue: number; size?: number; className?: string }) {
  return (
    <span aria-hidden className={cn("inline-grid shrink-0 place-items-center rounded-full font-semibold text-white select-none", className)} style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, hsl(${hue} 70% 48%), hsl(${(hue + 40) % 360} 70% 36%))` }}>
      {initials(name)}
    </span>
  );
}

/** Explains a metric on hover AND keyboard focus; also announced via aria-describedby. */
export function InfoTip({ text, label = "More information" }: { text: string; label?: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span className="inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" aria-label={label} aria-describedby={id} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onKeyDown={(e) => e.key === "Escape" && setOpen(false)} className="grid size-5 cursor-help place-items-center rounded-full text-muted-fg hover:text-fg"><Info className="size-4" /></button>
      <span id={id} role="tooltip" className={cn("pointer-events-none absolute inset-x-3 top-12 z-30 rounded-xl bg-ink px-3 py-2 text-xs font-normal leading-snug text-on-ink shadow-pop dark:bg-on-ink dark:text-ink", open ? "block" : "hidden")}>{text}</span>
    </span>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.7rem]">{children}</kbd>;
}
