"use client";
import { ErrorState } from "@/components/feedback";
export default function RouteError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorState error={error} onRetry={reset} title="This page hit a problem" />;
}
