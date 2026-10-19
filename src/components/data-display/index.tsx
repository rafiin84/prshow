"use client";
import Link from "next/link";
import { ArrowLeft, MagnifyingGlass } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { InfoTip } from "@/components/ui/misc";

export function SectionHeading({ title, eyebrow, action, className, as: Tag = "h2" }: { title: string; eyebrow?: string; action?: ReactNode; className?: string; as?: "h1" | "h2" | "h3" }) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div>
        {eyebrow && <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">{eyebrow}</p>}
        <Tag className="text-2xl leading-tight font-semibold sm:text-[1.75rem]">{title}</Tag>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, backHref, backLabel = "Back", actions, eyebrow }: { title: string; subtitle?: string; backHref?: string; backLabel?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <header className="mb-6 sm:mb-8">
      {backHref && <Link href={backHref} className="mb-3 -ml-2 inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-sm text-muted-fg hover:bg-muted hover:text-fg"><ArrowLeft className="size-4" aria-hidden />{backLabel}</Link>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">{eyebrow}</p>}
          <h1 className="text-[1.9rem] leading-[1.1] font-semibold sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-2xl text-[0.95rem] text-muted-fg">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function AdminMetric({ label, value, explain, href, tone }: { label: string; value: number | string; explain: string; href?: string; tone?: "danger" | "warning" }) {
  const body = (
    <div className={cn("relative flex h-full flex-col justify-between gap-3 rounded-[var(--radius)] border border-border bg-surface p-4 transition-colors", href && "hover:border-fg/30")}>
      <div className="flex items-start justify-between gap-2"><p className="text-sm text-muted-fg">{label}</p><InfoTip text={explain} label={`What does “${label}” mean?`} /></div>
      <p className={cn("font-display text-4xl leading-none font-semibold tabular-nums", tone === "danger" && "text-danger", tone === "warning" && "text-warning")}>{value}</p>
    </div>
  );
  return href ? <Link href={href} className="block rounded-[var(--radius)]">{body}</Link> : body;
}

export function SearchField({ value, onChange, placeholder = "Search", label = "Search", className }: { value: string; onChange: (v: string) => void; placeholder?: string; label?: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-fg" aria-hidden />
      <input type="search" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-12 w-full rounded-full border border-border bg-surface pr-4 pl-12 text-[0.95rem] placeholder:text-muted-fg/70 focus-visible:border-ring" />
    </div>
  );
}

export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div role="search" className={cn("mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center", className)}>{children}</div>;
}

/** Table on wide screens, stacked cards on small ones. */
export interface Column<T> { key: string; header: string; cell: (row: T) => ReactNode; className?: string; hideOnMobile?: boolean }
export function ResponsiveDataList<T>({ rows, columns, rowKey, caption, onRowHref }: { rows: T[]; columns: Column<T>[]; rowKey: (r: T) => string; caption: string; onRowHref?: (r: T) => string }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b border-border bg-muted/60 text-xs tracking-wide text-muted-fg uppercase">
            <tr>{columns.map((c) => <th key={c.key} scope="col" className={cn("px-4 py-3 font-semibold", c.className)}>{c.header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={rowKey(r)} className="hover:bg-muted/40">
                {columns.map((c, i) => <td key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>{i === 0 && onRowHref ? <Link href={onRowHref(r)} className="font-medium hover:underline">{c.cell(r)}</Link> : c.cell(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-3 md:hidden" aria-label={caption}>
        {rows.map((r) => {
          const inner = (
            <div className="space-y-2 rounded-[var(--radius)] border border-border bg-surface p-4">
              {columns.filter((c) => !c.hideOnMobile).map((c, i) => <div key={c.key} className={cn(i === 0 ? "font-medium" : "flex items-center justify-between gap-3 text-sm")}>{i > 0 && <span className="text-muted-fg">{c.header}</span>}<span>{c.cell(r)}</span></div>)}
            </div>
          );
          return <li key={rowKey(r)}>{onRowHref ? <Link href={onRowHref(r)} className="block">{inner}</Link> : inner}</li>;
        })}
      </ul>
    </>
  );
}
