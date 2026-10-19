"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, UserCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { PageHeader, SectionHeading } from "@/components/data-display";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Card } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { AuditTrail, InfoBanner, PolicyNote, ReasonDialog } from "@/features/admin/components";
import { useAdmin } from "@/features/admin/use-admin";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { admin as adminApi } from "@/lib/api";
import { ROLE_LABEL, canDecideNomination, canNominate } from "@/lib/permissions/policy";
import { DISTRICTS, acsOf, findAC, findDistrict, findWard, wardsOf, locLabel } from "@/data/seeds/locations";
import { nominationSchema } from "@/lib/validation";
import { fmtDate } from "@/lib/utils";
import type { AdminProfile, Nomination } from "@/types";

type NomForm = { nomineeName: string; contact: string; districtId: string; acId?: string; wardId?: string; rationale: string };
function NominationDialog({ open, onClose, admin }: { open: boolean; onClose: () => void; admin: AdminProfile }) {
  const target = admin.role === "central" ? "district" : admin.role === "district" ? "ac" : "ward";
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<NomForm>({ resolver: zodResolver(nominationSchema) as never, defaultValues: { nomineeName: "", contact: "", districtId: admin.scope.districtId ?? "", acId: admin.scope.acId ?? "", wardId: "", rationale: "" } });
  const dId = watch("districtId"); const aId = watch("acId");
  const create = useApiMutation((v: NomForm) => adminApi.createNomination(admin.id, { ...v, targetRole: target }), { success: (n) => (n.status === "approved" ? "District Admin appointed" : "Nomination sent to Central Admin"), onSuccess: () => { reset(); onClose(); } });
  const policy = canNominate(admin, target);
  return (
    <Modal open={open} onClose={onClose} title={target === "district" ? "Appoint a District Admin" : target === "ac" ? "Nominate an AC Admin" : "Nominate a Ward Admin"} description={target === "district" ? "Central Admin appoints District Admins directly." : "Central Admin gives final approval. The nominee has no privileges until then."} size="md"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={create.isPending} disabled={!policy.allowed} onClick={handleSubmit((v) => create.mutate(v))}>{target === "district" ? "Appoint" : "Submit nomination"}</Button></>}>
      <form noValidate className="space-y-4" onSubmit={handleSubmit((v) => create.mutate(v))}>
        <Field label="Nominee's full name" error={errors.nomineeName?.message}>{(p) => <Input {...p} {...register("nomineeName")} />}</Field>
        <Field label="Mobile number" hint="Stored masked." error={errors.contact?.message}>{(p) => <Input {...p} inputMode="numeric" maxLength={10} {...register("contact")} />}</Field>
        <Field label="District" error={errors.districtId?.message}>{(p) => <Select {...p} disabled={admin.role !== "central"} {...register("districtId")}><option value="">Choose</option>{DISTRICTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select>}</Field>
        {target !== "district" && <Field label="Assembly constituency" error={errors.acId?.message}>{(p) => <Select {...p} disabled={admin.role === "ac"} {...register("acId")}><option value="">Choose</option>{acsOf(dId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>}</Field>}
        {target === "ward" && <Field label="Ward" error={errors.wardId?.message}>{(p) => <Select {...p} {...register("wardId")}><option value="">Choose</option>{wardsOf(aId).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select>}</Field>}
        <Field label="Why this person?" error={errors.rationale?.message}>{(p) => <Textarea {...p} rows={3} {...register("rationale")} />}</Field>
        <PolicyNote policy={policy} />
      </form>
    </Modal>
  );
}

function NominationCard({ n, admin, now, onDecide, onResubmit }: { n: Nomination; admin: AdminProfile; now: number; onDecide: (id: string, mode: "approved" | "rejected" | "needs_correction") => void; onResubmit: (n: Nomination) => void }) {
  const p = canDecideNomination(admin, n);
  const where = n.scope.wardId ? findWard(n.scope.wardId)?.name : n.scope.acId ? findAC(n.scope.acId)?.name : findDistrict(n.scope.districtId)?.name;
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-lg font-semibold">{n.nomineeName}</p><p className="text-sm text-muted-fg">{n.targetRole.toUpperCase()} Admin · {where} · nominated {fmtDate(n.createdAt)}</p></div><StatusBadge status={n.status} /></div>
      <p className="text-sm">{n.rationale}</p>
      {n.status === "nominated" && <p className="text-xs text-muted-fg">Pending: no admin privileges are active until Central Admin approves.</p>}
      {n.decisionReason && <p className="rounded-2xl bg-muted p-3 text-sm"><span className="font-medium">Decision{n.decidedBy ? ` by ${n.decidedBy}` : ""}: </span>{n.decisionReason}</p>}
      <div className="flex flex-wrap gap-2">
        {admin.role === "central" && n.status === "nominated" && <><Button size="sm" disabled={!p.allowed} onClick={() => onDecide(n.id, "approved")}>Approve</Button><Button size="sm" variant="outline" onClick={() => onDecide(n.id, "needs_correction")}>Request correction</Button><Button size="sm" variant="outline" className="text-danger" onClick={() => onDecide(n.id, "rejected")}>Reject</Button></>}
        {n.status === "needs_correction" && n.nominatedById === admin.id && <Button size="sm" onClick={() => onResubmit(n)}>Update &amp; resubmit</Button>}
      </div>
      {admin.role !== "central" && n.status === "nominated" && <PolicyNote policy={p} />}
      <details className="text-sm"><summary className="cursor-pointer font-medium text-accent">History</summary><div className="mt-3"><AuditTrail events={n.history} now={now} /></div></details>
    </Card>
  );
}

export default function Appointments() {
  const { adminId, admin, now } = useAdmin();
  const [tab, setTab] = useState<"nominations" | "hierarchy">("nominations");
  const [filter, setFilter] = useState<"all" | Nomination["status"]>("all");
  const [open, setOpen] = useState(false);
  const [decide, setDecide] = useState<{ id: string; mode: "approved" | "rejected" | "needs_correction" } | null>(null);
  const [resub, setResub] = useState<Nomination | null>(null);
  const [rationale, setRationale] = useState("");
  const noms = useApiQuery(["nominations"], () => adminApi.listNominations(adminId), !!adminId);
  const admins = useApiQuery(["admins"], () => adminApi.listAdmins(adminId), !!adminId);
  const act = useApiMutation((v: { id: string; mode: "approved" | "rejected" | "needs_correction"; reason: string }) => adminApi.decideNomination(adminId, v.id, v.mode, v.reason), { success: "Decision recorded", onSuccess: () => setDecide(null) });
  const re = useApiMutation((v: { id: string; text: string }) => adminApi.resubmitNomination(adminId, v.id, v.text), { success: "Resubmitted to Central Admin", onSuccess: () => setResub(null) });
  const canCreate = admin ? (admin.role === "central" || admin.role === "district" || admin.role === "ac") : false;
  return (
    <div>
      <PageHeader title="Appointments" subtitle="Central appoints District Admins. District nominates AC Admins. AC nominates Ward Admins. Central gives final approval for AC and Ward nominations." actions={canCreate && admin ? <Button onClick={() => setOpen(true)}><Plus className="size-4" aria-hidden />{admin.role === "central" ? "Appoint District Admin" : admin.role === "district" ? "Nominate AC Admin" : "Nominate Ward Admin"}</Button> : undefined} />
      {admin?.role === "ward" && <InfoBanner>Ward Admins can&apos;t nominate other admins. You can see nominations affecting your ward.</InfoBanner>}
      <Tabs label="Appointments view" value={tab} onChange={setTab} items={[{ value: "nominations", label: "Nominations" }, { value: "hierarchy", label: "Hierarchy" }]} className="my-5 max-w-fit" />
      {tab === "nominations" ? (
        <>
          <div className="mb-4 max-w-xs"><Select aria-label="Filter by status" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="!h-11"><option value="all">All statuses</option><option value="nominated">Awaiting Central</option><option value="approved">Approved</option><option value="needs_correction">Needs correction</option><option value="rejected">Rejected</option></Select></div>
          <QueryBoundary query={noms} skeleton={<LoadingSkeleton count={3} />} isEmpty={(d) => d.filter((n) => filter === "all" || n.status === filter).length === 0} empty={<EmptyState title="No nominations" body="Nominations within your scope appear here." />}>
            {(list) => <div className="space-y-4">{list.filter((n) => filter === "all" || n.status === filter).map((n) => admin && <NominationCard key={n.id} n={n} admin={admin} now={now} onDecide={(id, mode) => setDecide({ id, mode })} onResubmit={(x) => { setResub(x); setRationale(x.rationale); }} />)}</div>}
          </QueryBoundary>
        </>
      ) : (
        <QueryBoundary query={admins} skeleton={<LoadingSkeleton count={4} />}>
          {(list) => (
            <div className="space-y-8">
              {(["central", "district", "ac", "ward"] as const).map((r) => { const rows = list.filter((a) => a.role === r); return rows.length === 0 ? null : (
                <section key={r}><SectionHeading title={`${ROLE_LABEL[r]}s`} as="h3" />
                  <ul className="grid gap-3 sm:grid-cols-2">{rows.map((a) => (
                    <li key={a.id}><Card className="flex items-center gap-3 p-4"><UserCircle weight="duotone" className="size-10 text-muted-fg" aria-hidden /><div className="min-w-0 flex-1"><p className="font-semibold">{a.name}</p><p className="truncate text-sm text-muted-fg">{locLabel({ districtId: a.scope.districtId, acId: a.scope.acId, wardId: a.scope.wardId }, a.scope.wardId ? 3 : a.scope.acId ? 2 : 1)}</p></div>{a.active ? <Badge tone="success">Active</Badge> : <Badge tone="warning">Pending · no privileges</Badge>}</Card></li>
                  ))}</ul></section>
              ); })}
            </div>
          )}
        </QueryBoundary>
      )}
      {admin && <NominationDialog open={open} onClose={() => setOpen(false)} admin={admin} />}
      <ReasonDialog open={decide !== null} onClose={() => setDecide(null)} loading={act.isPending} tone={decide?.mode === "rejected" ? "danger" : "primary"} title={decide?.mode === "approved" ? "Approve this appointment" : decide?.mode === "rejected" ? "Reject this nomination" : "Request a correction"} description={decide?.mode === "approved" ? "Admin privileges activate immediately. Add a short note for the record." : undefined} confirmLabel={decide?.mode === "approved" ? "Approve" : decide?.mode === "rejected" ? "Reject" : "Send request"} onSubmit={(reason) => decide && act.mutate({ id: decide.id, mode: decide.mode, reason })} />
      <Modal open={!!resub} onClose={() => setResub(null)} title="Update and resubmit" size="sm" footer={<><Button variant="ghost" onClick={() => setResub(null)}>Cancel</Button><Button loading={re.isPending} onClick={() => resub && re.mutate({ id: resub.id, text: rationale })}>Resubmit</Button></>}>
        <Field label="Updated rationale" hint="Address Central's feedback.">{(p) => <Textarea {...p} rows={4} value={rationale} onChange={(e) => setRationale(e.target.value)} />}</Field>
      </Modal>
    </div>
  );
}
