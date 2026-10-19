"use client";
import { Button } from "@/components/ui/button";
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center" role="alert">
      <div>
        <h1 className="text-3xl font-semibold">Something went wrong</h1>
        <p className="mx-auto mt-3 max-w-sm text-muted-fg">{error.message || "An unexpected error occurred."}</p>
        <Button className="mt-6" onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
