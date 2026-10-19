"use client";
import { ArrowFatLinesUp, CheckCircle, PencilSimpleLine, XCircle } from "@phosphor-icons/react";
import { use, useEffect, useState } from "react";
import { QueryBoundary, LoadingSkeleton } from "@/components/feedback";
import { PageHeader } from "@/components/data-display";
import { DemoArt } from "@/components/media";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Card } from "@/components/ui/misc";
import { AuditTrail, DeadlineChip, EscalationTimeline, InfoBanner, PolicyNote, ReasonDialog } from "@/features/admin/components";
import { AIRecommendationPanel } from "@/features/admin/guardian-panel";
import { useAdmin } from "@/features/admin/use-admin";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { admin as adminApi } from "@/lib/api";
import { LEVEL_LABEL, reviewLevel, isOpen } from "@/lib/moderation/workflow";
import { canDecideCase, canEscalateCase } from "@/lib/permissions/policy";
import { locLabel } from "@/data/seeds/locations";
import { fmtDateTime } from "@/lib/utils";
import { reelImage } from "@/data/images";


type Dlg = "approve" | "reject" | "correction" | "escalate" | null;
export default function CaseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { adminId, now } = useAdmin();
  const [dlg, setDlg] = useState<Dlg>(null);
  const q = useApiQuery(["case", id], () => adminApi.getCase(adminId, id), !!adminId);
  const viewed = useApiMutation(() => adminApi.markCaseViewed(adminId, id), { silentError: true });
  const markViewed = viewed.mutate;
  useEffect(() => { if (adminId) markViewed(); }, [adminId, id, markViewed]);
  const decide = useApiMutation((v: { outcome: "approved" | "rejected" | "needs_correction"; reason: string }) => adminApi.decideCase(adminId, id, v.outcome, v.reason), { success: (c) => `Decision recorded: ${c.status.replace("_", " ")}`, onSuccess: () => setDlg(null) });
  const escalate = useApiMutation((reason: string) => adminApi.escalateCase(adminId, id, reason), { success: "Escalated", onSuccess: () => setDlg(null) });
  return (
    <QueryBoundary query={q} skeleton={<LoadingSkeleton variant="detail" />}>
      {({ case: c, reel, admin }) => {
        const decidePolicy = canDecideCase(admin, c, now);
        const escPolicy = canEscalateCase(admin, c, now);
        const level = reviewLevel(c, now);
        return (
          <div>
            <PageHeader backHref="/admin/moderation" backLabel="Queue" title={c.title} subtitle={`Submitted by ${c.submitterName} · ${locLabel(c.loc)}`} actions={<StatusBadge status={c.status === "submitted" ? "pending_review" : c.status} />} />
            <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
              <div className="space-y-6">
                <Card className="space-y-4">
                  <div className="flex gap-4">
                    {c.subjectType === "reel" && reel && <DemoArt hue={reel.hue} src={reelImage(reel)} ratio="9/16" label="Demo video" className="w-28 shrink-0" />}
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap gap-2"><Badge tone="neutral" className="capitalize">{c.subjectType}</Badge>{reel && <Badge>{reel.category}</Badge>}<Badge tone="ink">Currently: {LEVEL_LABEL[level]}</Badge></div>
                      <p className="text-[1.05rem]">{c.excerpt || "No caption provided."}</p>
                      <p className="mt-2 text-xs text-muted-fg">Submitted {fmtDateTime(c.submittedAt)}. Contributor identity is limited to name and ward; no verification data is shown.</p>
                    </div>
                  </div>
                  {c.decision && <div className="rounded-2xl bg-muted p-4 text-sm"><p className="font-semibold">Decision: {c.decision.outcome.replace("_", " ")} by {c.decision.byName} ({c.decision.byRole})</p><p className="text-muted-fg">{c.decision.reason}</p></div>}
                </Card>
                <AIRecommendationPanel c={c} adminId={adminId} canRespond={decidePolicy.allowed} now={now} />
                <Card><h2 className="mb-3 text-lg font-semibold">Audit history</h2><AuditTrail events={c.history} now={now} /></Card>
              </div>
              <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                <Card className="space-y-4">
                  <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Decision</h2><DeadlineChip c={c} now={now} /></div>
                  <EscalationTimeline c={c} now={now} />
                  {isOpen(c) && <InfoBanner>You opened this item; the timer keeps running. Only a decision stops escalation.</InfoBanner>}
                  <div className="grid gap-2">
                    <Button disabled={!decidePolicy.allowed} onClick={() => setDlg("approve")}><CheckCircle weight="fill" className="size-5" aria-hidden />Approve &amp; publish</Button>
                    <Button variant="outline" disabled={!decidePolicy.allowed} onClick={() => setDlg("correction")}><PencilSimpleLine className="size-5" aria-hidden />Request correction</Button>
                    <Button variant="outline" className="text-danger" disabled={!decidePolicy.allowed} onClick={() => setDlg("reject")}><XCircle className="size-5" aria-hidden />Reject</Button>
                    <Button variant="ghost" disabled={!escPolicy.allowed} onClick={() => setDlg("escalate")}><ArrowFatLinesUp className="size-5" aria-hidden />Escalate now</Button>
                  </div>
                  <PolicyNote policy={!decidePolicy.allowed ? decidePolicy : !escPolicy.allowed ? escPolicy : undefined} />
                </Card>
                {c.viewedBy.length > 0 && <p className="text-xs text-muted-fg">Viewed by {c.viewedBy.length} admin{c.viewedBy.length > 1 ? "s" : ""}. Viewing never stops the timer.</p>}
              </aside>
            </div>
            <ConfirmDialog open={dlg === "approve"} onClose={() => setDlg(null)} loading={decide.isPending} onConfirm={() => decide.mutate({ outcome: "approved", reason: "" })} title="Approve and publish?" description="This becomes visible to the community immediately and the contributor is notified." confirmLabel="Approve" />
            <ReasonDialog open={dlg === "reject"} onClose={() => setDlg(null)} loading={decide.isPending} tone="danger" title="Reject this submission" description="The contributor will see your reason." confirmLabel="Reject" onSubmit={(reason) => decide.mutate({ outcome: "rejected", reason })} />
            <ReasonDialog open={dlg === "correction"} onClose={() => setDlg(null)} loading={decide.isPending} title="Request a correction" description="Tell the contributor what to change before resubmitting." confirmLabel="Send request" onSubmit={(reason) => decide.mutate({ outcome: "needs_correction", reason })} />
            <ReasonDialog open={dlg === "escalate"} onClose={() => setDlg(null)} loading={escalate.isPending} title={`Escalate to ${level === "ward" ? "District" : "Central"} Admin`} description="Escalate early if this needs a more senior decision." confirmLabel="Escalate" onSubmit={(reason) => escalate.mutate(reason)} />
          </div>
        );
      }}
    </QueryBoundary>
  );
}
