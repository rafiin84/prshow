"use client";
import { useState } from "react";
import { QueryBoundary, LoadingSkeleton } from "@/components/feedback";
import { PageHeader, SectionHeading } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { Card } from "@/components/ui/misc";
import { Badge, DemoContentBadge } from "@/components/ui/badge";
import { AuditTrail, PolicyNote, ReasonDialog } from "@/features/admin/components";
import { useAdmin } from "@/features/admin/use-admin";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { admin as adminApi } from "@/lib/api";
import { canEditRewards } from "@/lib/permissions/policy";
import type { RewardConfig } from "@/types";

const LABELS: Record<keyof RewardConfig, string> = { pointsPerCorrect: "Points per correct answer", perfectBonus: "Perfect-score bonus", rsvpPoints: "Confirmed event RSVP", welfarePoints: "Welfare activity attended", reelApprovedPoints: "Fan reel approved" };

export default function RewardsAdmin() {
  const { adminId, admin, now } = useAdmin();
  const q = useApiQuery(["reward-admin"], () => adminApi.getRewardAdmin());
  const [draft, setDraft] = useState<Partial<RewardConfig>>({});
  const [thr, setThr] = useState<Record<string, number>>({});
  const [pending, setPending] = useState<null | { kind: "config" } | { kind: "thr"; id: string }>(null);
  const policy = admin ? canEditRewards(admin.role) : { allowed: false };
  const saveCfg = useApiMutation((v: { cfg: RewardConfig; reason: string }) => adminApi.updateRewardConfig(adminId, v.cfg, v.reason), { success: "Reward values updated", onSuccess: () => { setPending(null); setDraft({}); } });
  const saveThr = useApiMutation((v: { id: string; points: number; reason: string }) => adminApi.updateRewardThreshold(adminId, v.id, v.points, v.reason), { success: "Threshold updated", onSuccess: () => { setPending(null); setThr({}); } });
  return (
    <div>
      <PageHeader title="Points & rewards" subtitle="Tune how many points genuine participation earns. Changes apply to future activity and are audited." actions={<DemoContentBadge label="Simulated rewards" />} />
      <PolicyNote policy={policy} />
      <QueryBoundary query={q} skeleton={<LoadingSkeleton count={4} />}>
        {(d) => {
          const cfg = { ...d.config, ...draft } as RewardConfig;
          const dirty = Object.keys(draft).length > 0;
          return (
            <div className="mt-6 space-y-10">
              <section className="grid grid-cols-2 gap-3 sm:grid-cols-3"><Card className="p-4"><p className="text-sm text-muted-fg">Points in circulation</p><p className="font-display text-3xl font-semibold">{d.totalPoints}</p></Card><Card className="p-4"><p className="text-sm text-muted-fg">Rewards unlocked</p><p className="font-display text-3xl font-semibold">{d.unlocks}</p></Card></section>
              <section aria-labelledby="vals"><SectionHeading title="Point values" />
                <Card className="space-y-4"><div id="vals" className="grid gap-4 sm:grid-cols-2">{(Object.keys(LABELS) as (keyof RewardConfig)[]).map((k) => <label key={k} className="block text-sm"><span className="mb-1 block font-medium">{LABELS[k]}</span><Input type="number" min={0} max={500} value={cfg[k]} disabled={!policy.allowed} onChange={(e) => setDraft((x) => ({ ...x, [k]: Number(e.target.value) }))} /></label>)}</div>
                  <div className="flex gap-2"><Button disabled={!policy.allowed || !dirty} onClick={() => setPending({ kind: "config" })}>Review changes</Button>{dirty && <Button variant="ghost" onClick={() => setDraft({})}>Discard</Button>}</div></Card>
              </section>
              <section aria-labelledby="thr"><SectionHeading title="Unlock thresholds" />
                <ul id="thr" className="space-y-3">{d.rewards.map((r) => (
                  <li key={r.id}><Card className="flex flex-wrap items-center gap-4 p-4"><div className="min-w-0 flex-1"><p className="font-semibold">{r.name}</p><p className="text-sm text-muted-fg capitalize">{r.kind.replace("_", " ")}{r.kind !== "wallpaper" ? " · simulated" : ""}</p></div><Input aria-label={`Threshold for ${r.name}`} type="number" className="w-28" disabled={!policy.allowed} value={thr[r.id] ?? r.pointsRequired} onChange={(e) => setThr((x) => ({ ...x, [r.id]: Number(e.target.value) }))} /><Button size="sm" variant="outline" disabled={!policy.allowed || thr[r.id] === undefined || thr[r.id] === r.pointsRequired} onClick={() => setPending({ kind: "thr", id: r.id })}>Update</Button></Card></li>
                ))}</ul>
              </section>
              <section><SectionHeading title="Change history" action={<Badge>{d.history.length}</Badge>} /><Card><AuditTrail events={d.history} now={now} empty="No changes yet." /></Card></section>
              <ReasonDialog open={pending !== null} onClose={() => setPending(null)} loading={saveCfg.isPending || saveThr.isPending} title="Confirm reward change" description={pending?.kind === "thr" ? "This changes when members can unlock this reward." : "These values apply to future quiz plays, RSVPs and approvals. Past points aren't recalculated."} confirmLabel="Apply change" label="Reason for the change" onSubmit={(reason) => pending?.kind === "config" ? saveCfg.mutate({ cfg, reason }) : pending && saveThr.mutate({ id: pending.id, points: thr[pending.id], reason })} />
            </div>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
