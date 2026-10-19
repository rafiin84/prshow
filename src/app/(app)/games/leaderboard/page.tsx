"use client";
import { Crown } from "@phosphor-icons/react";
import { useState } from "react";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { FilterBar, PageHeader } from "@/components/data-display";
import { Avatar } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/form";
import { Tabs } from "@/components/ui/tabs";
import { useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import type { LeaderboardPeriod } from "@/lib/api/fan";
import { findDistrict } from "@/data/seeds/locations";
import { useSession } from "@/stores/session";
import { MODE_LABEL } from "@/features/games/history-list";
import { cn } from "@/lib/utils";
import type { GameMode } from "@/types";

export default function Leaderboard() {
  const userId = useSession((s) => s.userId);
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");
  const [mode, setMode] = useState<GameMode | "all">("all");
  const q = useApiQuery(["leaderboard", period, mode], () => fan.getLeaderboard({ period, mode }, userId!), !!userId);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader backHref="/games" backLabel="Fan Arena" eyebrow="Individual ranking" title="Leaderboard" subtitle="Ranks are personal. There are no head-to-head battles or direct challenges." />
      <FilterBar>
        <Tabs label="Period" value={period} onChange={setPeriod} items={[{ value: "week", label: "This week" }, { value: "month", label: "This month" }, { value: "all", label: "All time" }]} />
        <Select aria-label="Game category" value={mode} onChange={(e) => setMode(e.target.value as GameMode | "all")} className="sm:w-52 !h-11"><option value="all">All categories</option>{(["trivia", "dialogue", "scene", "song", "daily"] as GameMode[]).map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}</Select>
      </FilterBar>
      <p className="mb-4 rounded-2xl bg-gold-soft p-3 text-sm text-gold"><strong>Demo scores:</strong> ranks use quiz points from seeded sample attempts plus any quizzes you play. Period is measured against the demo clock.</p>
      <QueryBoundary query={q} skeleton={<LoadingSkeleton count={6} />} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No scores in this filter" body="Try a longer period or another category." />}>
        {(rows) => (
          <ol className="space-y-2" aria-label="Leaderboard">
            {rows.map((r) => (
              <li key={r.fanId} className={cn("flex items-center gap-4 rounded-2xl border p-3.5", r.isMe ? "border-accent bg-accent-soft" : "border-border bg-surface")}>
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-full font-display text-lg font-bold", r.rank === 1 ? "bg-gold text-white" : "bg-muted text-muted-fg")}>{r.rank === 1 ? <Crown weight="fill" className="size-5" aria-label="Rank 1" /> : r.rank}</span>
                <Avatar name={r.name} hue={r.hue} />
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{r.name} {r.isMe && <Badge tone="accent">You</Badge>}</p><p className="text-xs text-muted-fg">{findDistrict(r.districtId)?.name} · {r.quizzes} quiz{r.quizzes === 1 ? "" : "zes"}</p></div>
                <p className="font-display text-xl font-semibold tabular-nums">{r.points}<span className="ml-1 text-xs font-normal text-muted-fg">pts</span></p>
              </li>
            ))}
          </ol>
        )}
      </QueryBoundary>
    </div>
  );
}
