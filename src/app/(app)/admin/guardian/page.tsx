"use client";
import { useState } from "react";
import Link from "next/link";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { PageHeader } from "@/components/data-display";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { AIRecommendationPanel } from "@/features/admin/guardian-panel";
import { useAdmin } from "@/features/admin/use-admin";
import { useApiQuery } from "@/lib/query";
import { admin as adminApi } from "@/lib/api";
import { canDecideCase } from "@/lib/permissions/policy";
import { InfoBanner } from "@/features/admin/components";
import { cn } from "@/lib/utils";

export default function GuardianPage() {
  const { adminId, admin, now } = useAdmin();
  const [sel, setSel] = useState<string | null>(null);
  const q = useApiQuery(["cases", "open", ""], () => adminApi.listCases(adminId, { view: "open" }), !!adminId);
  return (
    <div>
      <PageHeader title="AI Content Guardian" subtitle="A mock assistant that flags possible issues and suggests a next step. People make every decision." />
      <InfoBanner tone="gold">Simulated analysis: keyword heuristics, not a real model. Scores and confidence are illustrative. The Guardian can never publish or reject content.</InfoBanner>
      <div className="mt-6">
        <QueryBoundary query={q} skeleton={<LoadingSkeleton count={3} />} isEmpty={(d) => d.length === 0} empty={<EmptyState title="Nothing to analyse" body="Open moderation items in your scope appear here." />}>
          {(list) => {
            const current = list.find((c) => c.id === (sel ?? list[0].id)) ?? list[0];
            return (
              <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
                <ul aria-label="Items to analyse" className="space-y-2">
                  {list.map((c) => (
                    <li key={c.id}><button onClick={() => setSel(c.id)} aria-pressed={c.id === current.id} className={cn("w-full cursor-pointer rounded-2xl border p-4 text-left transition-colors", c.id === current.id ? "border-accent bg-accent-soft/50" : "border-border bg-surface hover:bg-muted")}>
                      <p className="truncate font-semibold">{c.title}</p><p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-fg">{c.submitterName}{c.guardian ? <Badge tone={c.guardian.riskScore >= 0.7 ? "danger" : c.guardian.riskScore >= 0.4 ? "warning" : "success"}>{c.guardian.flags.length} flag{c.guardian.flags.length === 1 ? "" : "s"}</Badge> : <Badge>Not analysed</Badge>}</p></button></li>
                  ))}
                </ul>
                <div className="space-y-4">
                  <AIRecommendationPanel c={current} adminId={adminId} canRespond={!!admin && canDecideCase(admin, current, now).allowed} now={now} />
                  <Link href={`/admin/moderation/${current.id}`} className={buttonStyles({ variant: "outline" })}>Open this item in the moderation queue</Link>
                </div>
              </div>
            );
          }}
        </QueryBoundary>
      </div>
    </div>
  );
}
