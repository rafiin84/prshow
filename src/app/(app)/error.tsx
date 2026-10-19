"use client";
import { ErrorState } from "@/components/feedback";

/** A "Loading chunk failed" error means the tab is running an older build; a full reload fixes it. */
export default function RouteError({ error, reset }: { error: Error; reset: () => void }) {
  const stale = /Loading chunk|ChunkLoadError|Failed to fetch dynamically imported module/i.test(error.message);
  return (
    <ErrorState
      error={stale ? new Error("PR Show was updated while this tab was open. Reload to get the latest version.") : error}
      title={stale ? "A newer version is available" : "This page hit a problem"}
      onRetry={() => (stale ? window.location.reload() : reset())}
    />
  );
}
