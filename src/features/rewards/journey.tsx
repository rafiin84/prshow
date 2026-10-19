"use client";
import { Medal } from "@phosphor-icons/react";
import Link from "next/link";
import { Progress } from "@/components/ui/misc";

export function JourneyCard({ points, journey, href = "/profile/rewards" }: { points: number; journey: { tier: string; next?: string; pct: number; toNext: number }; href?: string }) {
  return (
    <Link href={href} className="block rounded-[var(--radius-lg)] border border-border bg-surface p-5 transition-shadow hover:shadow-card">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-accent uppercase"><Medal weight="fill" className="size-4" aria-hidden />Your PR Journey</p>
        <p className="text-sm font-semibold">{points} pts</p>
      </div>
      <p className="font-display mt-2 text-2xl font-semibold">{journey.tier}</p>
      <Progress value={journey.pct} label={`Progress to ${journey.next ?? "top tier"}`} className="mt-3" />
      <p className="mt-2 text-sm text-muted-fg">{journey.next ? `${journey.toNext} points to ${journey.next}` : "You've reached the top tier. Thank you for taking part."}</p>
    </Link>
  );
}
