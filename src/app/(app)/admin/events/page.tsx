"use client";
import { Plus } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { PageHeader } from "@/components/data-display";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Card } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EventFormDialog } from "@/features/admin/event-form";
import { WelfareAdmin } from "@/features/admin/welfare-admin";
import { ReasonDialog } from "@/features/admin/components";
import { useAdmin } from "@/features/admin/use-admin";
import { CATEGORY_LABEL } from "@/features/events/event-card";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { admin as adminApi } from "@/lib/api";
import { locLabel } from "@/data/seeds/locations";
import { fmtDateTime } from "@/lib/utils";
import type { PREvent } from "@/types";

export default function AdminEvents() {
  const { adminId, admin } = useAdmin();
  const [tab, setTab] = useState<"events" | "welfare">("events");
  const [edit, setEdit] = useState<PREvent | undefined>();
  const [form, setForm] = useState(false);
  const [cancel, setCancel] = useState<PREvent | null>(null);
  const [pub, setPub] = useState<PREvent | null>(null);
  const q = useApiQuery(["admin-events"], () => adminApi.adminListEvents(adminId), !!adminId);
  const setStatus = useApiMutation((v: { id: string; s: PREvent["status"]; reason?: string }) => adminApi.setEventStatus(adminId, v.id, v.s, v.reason), { success: (e) => `Event ${e.status}`, onSuccess: () => { setCancel(null); setPub(null); } });
  return (
    <div>
      <PageHeader title="Events & welfare" subtitle="Create, publish and run events inside your scope." actions={tab === "events" ? <Button disabled={!admin?.active} onClick={() => { setEdit(undefined); setForm(true); }}><Plus className="size-4" aria-hidden />Create event</Button> : undefined} />
      <Tabs label="Events or welfare" value={tab} onChange={setTab} items={[{ value: "events", label: "Events" }, { value: "welfare", label: "Welfare activities" }]} className="mb-6 max-w-fit" />
      {tab === "welfare" ? <WelfareAdmin /> : (
        <QueryBoundary query={q} skeleton={<LoadingSkeleton count={3} />} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No events in your scope" body="Create your first event as a draft." action={<Button onClick={() => setForm(true)}>Create event</Button>} />}>
          {(list) => (
            <ul className="space-y-3">{list.map(({ event: e, stats }) => (
              <li key={e.id}><Card className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{e.title}</h2><StatusBadge status={e.status} /><Badge>{CATEGORY_LABEL[e.category]}</Badge></div><p className="text-sm text-muted-fg">{fmtDateTime(e.startsAt)} · {e.venue} · {locLabel(e.loc, 2)}</p><p className="mt-1 text-sm">{stats.confirmed}/{e.capacity} confirmed · {stats.waitlisted} waitlisted · {stats.checkedIn} checked in</p></div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/events/${e.id}`} className={buttonStyles({ size: "sm", variant: "outline" })}>Attendees</Link>
                  <Button size="sm" variant="ghost" onClick={() => { setEdit(e); setForm(true); }}>Edit</Button>
                  {e.status === "draft" && <Button size="sm" onClick={() => setPub(e)}>Publish</Button>}
                  {e.status === "published" && <Button size="sm" variant="ghost" className="text-danger" onClick={() => setCancel(e)}>Cancel event</Button>}
                </div>
              </Card></li>
            ))}</ul>
          )}
        </QueryBoundary>
      )}
      <EventFormDialog open={form} onClose={() => setForm(false)} event={edit} />
      <ConfirmDialog open={!!pub} onClose={() => setPub(null)} loading={setStatus.isPending} onConfirm={() => pub && setStatus.mutate({ id: pub.id, s: "published" })} title="Publish this event?" description="Members in the audience will be able to see it and RSVP." confirmLabel="Publish" />
      <ReasonDialog open={!!cancel} onClose={() => setCancel(null)} loading={setStatus.isPending} tone="danger" title="Cancel this event" description="Everyone with an RSVP is notified with your reason." confirmLabel="Cancel event" onSubmit={(reason) => cancel && setStatus.mutate({ id: cancel.id, s: "cancelled", reason })} />
    </div>
  );
}
