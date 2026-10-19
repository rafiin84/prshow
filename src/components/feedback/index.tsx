"use client";
import { ArrowClockwise, CloudSlash, FilmSlate, WarningOctagon } from "@phosphor-icons/react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export function EmptyState({ title, body, action, icon, className }: { title: string; body?: string; action?: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center rounded-[var(--radius-lg)] border border-dashed border-border px-6 py-12 text-center", className)}>
      <div className="mb-4 grid size-14 place-items-center rounded-full bg-muted text-muted-fg">{icon ?? <FilmSlate className="size-7" weight="duotone" aria-hidden />}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-sm text-muted-fg">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title, className }: { error?: unknown; onRetry?: () => void; title?: string; className?: string }) {
  const offline = error instanceof ApiError && error.code === "network";
  return (
    <div role="alert" className={cn("flex flex-col items-center rounded-[var(--radius-lg)] border border-danger/30 bg-danger-soft/50 px-6 py-10 text-center", className)}>
      <div className="mb-3 grid size-12 place-items-center rounded-full bg-danger-soft text-danger">{offline ? <CloudSlash className="size-6" aria-hidden /> : <WarningOctagon className="size-6" aria-hidden />}</div>
      <h3 className="text-lg font-semibold">{title ?? (offline ? "We couldn't reach the demo service" : "Something went wrong")}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-fg">{error instanceof Error ? error.message : "Please try again."}</p>
      {onRetry && <Button variant="outline" className="mt-4" onClick={onRetry}><ArrowClockwise className="size-4" aria-hidden />Try again</Button>}
    </div>
  );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return <ErrorState error={new ApiError("You appear to be offline. Your input is safe — reconnect and try again.", "network")} onRetry={onRetry} title="You're offline" />;
}

export function LoadingSkeleton({ variant = "list", count = 3 }: { variant?: "list" | "cards" | "hero" | "detail"; count?: number }) {
  if (variant === "hero") return <Skeleton className="aspect-[16/10] w-full rounded-[var(--radius-xl)] sm:aspect-[21/9]" />;
  if (variant === "cards") return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: count }).map((_, i) => <div key={i} className="space-y-3"><Skeleton className="aspect-[4/3] w-full rounded-[var(--radius-lg)]" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /></div>)}</div>;
  if (variant === "detail") return <div className="space-y-4"><Skeleton className="aspect-[16/9] w-full rounded-[var(--radius-xl)]" /><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div>;
  return <div className="space-y-3" role="status" aria-label="Loading">{Array.from({ length: count }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-[var(--radius-lg)]" />)}</div>;
}

/** One place that handles pending / error+retry / empty for any query. */
export function QueryBoundary<T>({ query, skeleton, isEmpty, empty, children }: { query: UseQueryResult<T>; skeleton?: ReactNode; isEmpty?: (d: T) => boolean; empty?: ReactNode; children: (data: T) => ReactNode }) {
  if (query.isPending) return <>{skeleton ?? <LoadingSkeleton />}</>;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (isEmpty?.(query.data)) return <>{empty ?? <EmptyState title="Nothing here yet" />}</>;
  return <>{children(query.data)}</>;
}
