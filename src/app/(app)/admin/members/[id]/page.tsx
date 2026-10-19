"use client";
import { CheckCircle, PencilSimpleLine, XCircle } from "@phosphor-icons/react";
import { use, useState } from "react";
import { QueryBoundary, LoadingSkeleton } from "@/components/feedback";
import { PageHeader } from "@/components/data-display";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Avatar, Card } from "@/components/ui/misc";
import { AuditTrail, InfoBanner, PolicyNote, ReasonDialog } from "@/features/admin/components";
import { useAdmin } from "@/features/admin/use-admin";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { admin as adminApi } from "@/lib/api";
import { locLabel } from "@/data/seeds/locations";
import { fmtDate, fmtDateTime } from "@/lib/utils";

type Dlg = "approve" | "reject" | "correction" | null;
export default function MemberDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { adminId, now } = useAdmin();
  const [dlg, setDlg] = useState<Dlg>(null);
  const q = useApiQuery(["member", id], () => adminApi.getMember(adminId, id), !!adminId);
  const decide = useApiMutation((v: { outcome: "approved" | "rejected" | "needs_correction"; reason: string }) => adminApi.decideVerification(adminId, id, v.outcome, v.reason), { success: (f) => (f.verification === "approved" ? `Approved. Membership ${f.membership?.memberNo} issued.` : "Decision recorded"), onSuccess: () => setDlg(null) });
  return (
    <QueryBoundary query={q} skeleton={<LoadingSkeleton variant="detail" />}>
      {({ fan: f, submission, participation, events, policy }) => (
        <div>
          <PageHeader backHref="/admin/members" backLabel="Members" title={f.name} subtitle={`@${f.handle} · ${locLabel(f.loc)}`} actions={<StatusBadge status={f.verification} />} />
          <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
            <div className="space-y-6">
              <Card className="flex flex-wrap items-center gap-5"><Avatar name={f.name} hue={f.hue} size={64} /><dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3"><div><dt className="text-muted-fg">Member no.</dt><dd className="font-medium">{f.membership?.memberNo ?? "Not issued"}</dd></div><div><dt className="text-muted-fg">Joined</dt><dd className="font-medium">{fmtDate(f.joinedAt)}</dd></div><div><dt className="text-muted-fg">Mobile</dt><dd className="font-medium">{f.phoneMasked}</dd></div></dl></Card>
              <Card><h2 className="mb-3 text-lg font-semibold">Participation</h2><dl className="grid grid-cols-2 gap-4 text-center sm:grid-cols-5">{[["RSVPs", participation.rsvps], ["Checked in", participation.checkedIn], ["Welfare", participation.welfare], ["Quizzes", participation.quizzes], ["Reels", participation.reels]].map(([l, v]) => <div key={l as string}><dd className="font-display text-3xl font-semibold">{v}</dd><dt className="text-xs text-muted-fg">{l}</dt></div>)}</dl></Card>
              <Card><h2 className="mb-3 text-lg font-semibold">Verification (demo)</h2>
                {submission ? <dl className="grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-muted-fg">Submitted</dt><dd className="font-medium">{fmtDateTime(submission.submittedAt)}</dd></div><div><dt className="text-muted-fg">Secure QR step</dt><dd className="font-medium">{submission.secureQrDone ? "Completed (simulated)" : "Not completed"}</dd></div><div><dt className="text-muted-fg">Liveness step</dt><dd className="font-medium">{submission.livenessSimDone ? "Completed (simulated)" : "Not completed"}</dd></div><div><dt className="text-muted-fg">Status</dt><dd><StatusBadge status={submission.status} /></dd></div></dl> : <p className="text-sm text-muted-fg">No verification has been submitted.</p>}
                {f.verificationNote && <p className="mt-3 rounded-2xl bg-muted p-3 text-sm"><span className="font-medium">Reviewer note: </span>{f.verificationNote}</p>}
                <p className="mt-3 text-xs text-muted-fg">By design, no Aadhaar number, ID document or face data is ever collected or shown here.</p>
              </Card>
              <Card><h2 className="mb-3 text-lg font-semibold">Audit events</h2><AuditTrail events={events} now={now} empty="No audit events for this member yet." /></Card>
            </div>
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <Card className="space-y-3"><h2 className="text-lg font-semibold">Membership decision</h2>
                <InfoBanner>This approves <strong>membership</strong> only. It is separate from admin appointments.</InfoBanner>
                <div className="grid gap-2">
                  <Button disabled={!policy.allowed} onClick={() => setDlg("approve")}><CheckCircle weight="fill" className="size-5" aria-hidden />Approve membership</Button>
                  <Button variant="outline" disabled={!policy.allowed} onClick={() => setDlg("correction")}><PencilSimpleLine className="size-5" aria-hidden />Request correction</Button>
                  <Button variant="outline" className="text-danger" disabled={!policy.allowed} onClick={() => setDlg("reject")}><XCircle className="size-5" aria-hidden />Reject</Button>
                </div>
                <PolicyNote policy={policy} />
              </Card>
            </aside>
          </div>
          <ConfirmDialog open={dlg === "approve"} onClose={() => setDlg(null)} loading={decide.isPending} onConfirm={() => decide.mutate({ outcome: "approved", reason: "" })} title={`Approve ${f.name}?`} description="A membership number and digital card will be issued and the member notified." confirmLabel="Approve" />
          <ReasonDialog open={dlg === "reject"} onClose={() => setDlg(null)} loading={decide.isPending} tone="danger" title="Reject verification" description="The applicant will see this reason." confirmLabel="Reject" onSubmit={(reason) => decide.mutate({ outcome: "rejected", reason })} />
          <ReasonDialog open={dlg === "correction"} onClose={() => setDlg(null)} loading={decide.isPending} title="Request a correction" description="Tell the applicant what to fix." confirmLabel="Send request" onSubmit={(reason) => decide.mutate({ outcome: "needs_correction", reason })} />
        </div>
      )}
    </QueryBoundary>
  );
}
