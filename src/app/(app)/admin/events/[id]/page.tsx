"use client";
import { Export, QrCode } from "@phosphor-icons/react";
import { use, useState } from "react";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { FilterBar, PageHeader, ResponsiveDataList, SearchField } from "@/components/data-display";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { Card } from "@/components/ui/misc";
import { PolicyNote } from "@/features/admin/components";
import { useAdmin } from "@/features/admin/use-admin";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { admin as adminApi } from "@/lib/api";
import { passTokenFor } from "@/lib/api/admin";
import { fmtDateTime, fmtTime } from "@/lib/utils";
import { locLabel } from "@/data/seeds/locations";

export default function Attendees({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { adminId } = useAdmin();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [scan, setScan] = useState(false);
  const [token, setToken] = useState("");
  const [exp, setExp] = useState(false);
  const query = useApiQuery(["attendees", id], () => adminApi.listAttendees(adminId, id), !!adminId);
  const checkIn = useApiMutation((rid: string) => adminApi.checkInAttendee(adminId, rid), { success: "Checked in" });
  const promote = useApiMutation((rid: string) => adminApi.promoteWaitlisted(adminId, rid), { success: "Promoted to confirmed" });
  const byToken = useApiMutation((t: string) => adminApi.checkInByToken(adminId, id, t), { success: (r) => `${r.name} checked in`, onSuccess: () => setToken("") });
  return (
    <QueryBoundary query={query} skeleton={<LoadingSkeleton count={4} />}>
      {({ event: e, stats, rows, policy }) => {
        const filtered = rows.filter((r) => (status === "all" || r.rsvp.status === status) && `${r.fan.name} ${r.fan.handle}`.toLowerCase().includes(q.toLowerCase()));
        const csv = ["name,status,ward,rsvp_at", ...filtered.map((r) => `${r.fan.name},${r.rsvp.status},${locLabel(r.fan.loc, 3)},${fmtDateTime(r.rsvp.at)}`)].join("\n");
        const demoToken = rows.find((r) => r.rsvp.status === "confirmed");
        return (
          <div>
            <PageHeader backHref="/admin/events" backLabel="Events" title={e.title} subtitle={`${fmtDateTime(e.startsAt)} – ${fmtTime(e.endsAt)} · ${e.venue}`} actions={<><Button variant="outline" onClick={() => setExp(true)}><Export className="size-4" aria-hidden />Export preview</Button><Button onClick={() => setScan(true)} disabled={!policy.allowed}><QrCode className="size-4" aria-hidden />Scan pass</Button></>} />
            <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Attendance summary">{[["Capacity", e.capacity], ["Confirmed", stats.confirmed], ["Waitlisted", stats.waitlisted], ["Checked in", stats.checkedIn]].map(([l, v]) => <Card key={l as string} className="p-4"><p className="text-sm text-muted-fg">{l}</p><p className="font-display text-3xl font-semibold">{v}</p></Card>)}</section>
            <PolicyNote policy={policy} />
            <div className="mt-4"><FilterBar><SearchField value={q} onChange={setQ} placeholder="Search attendees" label="Search attendees" className="sm:w-72" /><Select aria-label="Status" value={status} onChange={(ev) => setStatus(ev.target.value)} className="sm:w-48 !h-12"><option value="all">All statuses</option><option value="confirmed">Confirmed</option><option value="waitlisted">Waitlisted</option><option value="checked_in">Checked in</option><option value="cancelled">Cancelled</option></Select></FilterBar></div>
            {filtered.length === 0 ? <EmptyState title="No attendees match" body="RSVPs for this event will appear here." /> : (
              <ResponsiveDataList caption="Attendees" rows={filtered} rowKey={(r) => r.rsvp.id} columns={[
                { key: "n", header: "Attendee", cell: (r) => r.fan.name },
                { key: "l", header: "Ward", cell: (r) => locLabel(r.fan.loc, 3) },
                { key: "s", header: "Status", cell: (r) => <StatusBadge status={r.rsvp.status} /> },
                { key: "t", header: "RSVP", cell: (r) => fmtDateTime(r.rsvp.at), hideOnMobile: true },
                { key: "a", header: "Action", cell: (r) => r.rsvp.status === "confirmed" ? <Button size="sm" disabled={!policy.allowed} loading={checkIn.isPending} onClick={() => checkIn.mutate(r.rsvp.id)}>Check in</Button> : r.rsvp.status === "waitlisted" ? <Button size="sm" variant="outline" disabled={!policy.allowed || stats.full} onClick={() => promote.mutate(r.rsvp.id)}>{stats.full ? "Event full" : "Promote"}</Button> : <span className="text-muted-fg">—</span> },
              ]} />
            )}
            <Modal open={scan} onClose={() => setScan(false)} title="Scan a pass (simulated)" description="Enter the pass token shown under the attendee's QR code." size="sm" footer={<><Button variant="ghost" onClick={() => setScan(false)}>Close</Button><Button loading={byToken.isPending} disabled={!token.trim()} onClick={() => byToken.mutate(token)}>Check in</Button></>}>
              <form onSubmit={(ev) => { ev.preventDefault(); if (token.trim()) byToken.mutate(token); }}><Field label="Pass token">{(p) => <Input {...p} value={token} onChange={(ev) => setToken(ev.target.value)} placeholder="PRS-PASS-XXXXXX" className="font-mono" />}</Field></form>
              {demoToken && <p className="mt-3 text-xs text-muted-fg">Demo hint: try <button className="cursor-pointer font-mono underline" onClick={() => setToken(passTokenFor(e.id, demoToken.fan.id))}>{passTokenFor(e.id, demoToken.fan.id)}</button> ({demoToken.fan.name}).</p>}
            </Modal>
            <Modal open={exp} onClose={() => setExp(false)} title="Export preview" description="No file is created in this demo. This is what a CSV would contain." size="lg"><pre className="max-h-[50dvh] overflow-auto rounded-2xl bg-muted p-4 text-xs">{csv}</pre></Modal>
          </div>
        );
      }}
    </QueryBoundary>
  );
}
