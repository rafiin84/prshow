"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { PageHeader } from "@/components/data-display";
import { DemoArt } from "@/components/media";
import { OfficialBadge, StatusBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Modal } from "@/components/ui/dialog";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Card } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { InfoBanner } from "@/features/admin/components";
import { useAdmin } from "@/features/admin/use-admin";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { admin as adminApi } from "@/lib/api";
import { DISTRICTS, acsOf, locLabel, wardsOf } from "@/data/seeds/locations";
import { announcementSchema } from "@/lib/validation";
import { fmtDate } from "@/lib/utils";
import type { Announcement } from "@/types";

type Values = { title: string; body: string; audience: Announcement["audience"]; districtId?: string; acId?: string; wardId?: string; schedule: boolean };
const HUES = [330, 38, 262, 150, 12, 200];

function Composer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { adminId, admin } = useAdmin();
  const [hue, setHue] = useState(330);
  const [confirm, setConfirm] = useState<Values | null>(null);
  const { register, handleSubmit, watch, reset, getValues, formState: { errors } } = useForm<Values>({ resolver: zodResolver(announcementSchema) as never, defaultValues: { title: "", body: "", audience: "district", districtId: admin?.scope.districtId ?? "chennai", acId: "", wardId: "", schedule: false } });
  const v = watch();
  const save = useApiMutation((p: { values: Values; publish: boolean }) => adminApi.saveAnnouncement(adminId, { ...p.values, hue }, p.publish), { success: (a) => (a.status === "published" ? "Published. Members in the audience were notified." : a.status === "scheduled" ? "Scheduled (simulated)" : "Draft saved"), onSuccess: () => { setConfirm(null); reset(); onClose(); } });
  const audienceLabel = v.audience === "all" ? "All members" : locLabel({ districtId: v.districtId, acId: v.audience === "district" ? undefined : v.acId, wardId: v.audience === "ward" ? v.wardId : undefined }, v.audience === "district" ? 1 : v.audience === "ac" ? 2 : 3);
  return (
    <>
      <Modal open={open} onClose={onClose} size="xl" title="New announcement" description="Official announcements are labelled and sent to approved members in the audience."
        footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="outline" loading={save.isPending} onClick={handleSubmit((vals) => save.mutate({ values: vals, publish: false }))}>{v.schedule ? "Save as scheduled" : "Save draft"}</Button><Button onClick={handleSubmit((vals) => setConfirm(vals))}>Review &amp; publish</Button></>}>
        <div className="grid gap-6 lg:grid-cols-2">
          <form noValidate className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <Field label="Title" error={errors.title?.message}>{(p) => <Input {...p} maxLength={90} {...register("title")} />}</Field>
            <Field label="Message" error={errors.body?.message}>{(p) => <Textarea {...p} rows={5} maxLength={600} {...register("body")} />}</Field>
            <Field label="Audience">{(p) => <Select {...p} {...register("audience")}>{admin?.role === "central" && <option value="all">Everyone</option>}{admin?.role !== "ward" && admin?.role !== "ac" && <option value="district">A district</option>}{admin?.role !== "ward" && <option value="ac">A constituency</option>}<option value="ward">A ward</option></Select>}</Field>
            {v.audience !== "all" && <Field label="District">{(p) => <Select {...p} disabled={admin?.role !== "central"} {...register("districtId")}>{DISTRICTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select>}</Field>}
            {(v.audience === "ac" || v.audience === "ward") && <Field label="Constituency">{(p) => <Select {...p} disabled={admin?.role === "ac" || admin?.role === "ward"} {...register("acId")}><option value="">Choose</option>{acsOf(v.districtId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>}</Field>}
            {v.audience === "ward" && <Field label="Ward">{(p) => <Select {...p} disabled={admin?.role === "ward"} {...register("wardId")}><option value="">Choose</option>{wardsOf(v.acId).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select>}</Field>}
            <fieldset><legend className="mb-2 text-sm font-medium">Artwork colour <span className="font-normal text-muted-fg">(demo art, optional)</span></legend><div className="flex gap-2">{HUES.map((h) => <button type="button" key={h} aria-pressed={hue === h} aria-label={`Hue ${h}`} onClick={() => setHue(h)} className={`size-9 cursor-pointer rounded-full ring-offset-2 ring-offset-elevated ${hue === h ? "ring-2 ring-fg" : ""}`} style={{ background: `hsl(${h} 70% 48%)` }} />)}</div></fieldset>
            <Checkbox label="Schedule instead of publishing now (simulated)" description="Scheduled items can be published from the list to simulate the time arriving." {...register("schedule")} />
          </form>
          <div>
            <p className="mb-2 text-sm font-semibold">Preview as a member sees it</p>
            <Card className="overflow-hidden p-0"><DemoArt hue={hue} ratio="16/7" rounded={false} label={false} /><div className="space-y-2 p-5"><OfficialBadge /><h3 className="text-xl font-semibold">{v.title || "Your title"}</h3><p className="text-muted-fg">{v.body || "Your message appears here."}</p></div></Card>
            <p className="mt-3 text-sm text-muted-fg">Audience: <strong className="text-fg">{audienceLabel}</strong></p>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} loading={save.isPending} onConfirm={() => confirm && save.mutate({ values: { ...confirm, schedule: false }, publish: true })} title="Publish this announcement?" description={`It goes to approved members in: ${audienceLabel}. A notification is created for each. This can't be unpublished, only archived.`} confirmLabel="Publish" />
      <span hidden>{getValues("title")}</span>
    </>
  );
}

export default function Announcements() {
  const { adminId, admin } = useAdmin();
  const [tab, setTab] = useState<"all" | Announcement["status"]>("all");
  const [open, setOpen] = useState(false);
  const q = useApiQuery(["announcements"], () => adminApi.listAnnouncements(adminId), !!adminId);
  const archive = useApiMutation((id: string) => adminApi.archiveAnnouncement(adminId, id), { success: "Archived" });
  const publish = useApiMutation((a: Announcement) => adminApi.saveAnnouncement(adminId, { id: a.id, title: a.title, body: a.body, audience: a.audience, districtId: a.districtId, acId: a.acId, wardId: a.wardId, hue: a.hue, schedule: false }, true), { success: "Published" });
  return (
    <div>
      <PageHeader title="Announcements" subtitle="Official updates to members. Publishing also creates notifications." actions={<Button onClick={() => setOpen(true)} disabled={!admin?.active}><Plus className="size-4" aria-hidden />New announcement</Button>} />
      <Tabs label="Status" value={tab} onChange={setTab} items={[{ value: "all", label: "All" }, { value: "draft", label: "Drafts" }, { value: "scheduled", label: "Scheduled" }, { value: "published", label: "Published" }, { value: "archived", label: "Archived" }]} className="mb-5 max-w-fit" />
      {admin?.role !== "central" && <div className="mb-5"><InfoBanner>You can announce to your own district, constituency or ward. Only Central Admin can announce to everyone.</InfoBanner></div>}
      <QueryBoundary query={q} skeleton={<LoadingSkeleton count={3} />} isEmpty={(d) => d.filter((a) => tab === "all" || a.status === tab).length === 0} empty={<EmptyState title="No announcements here" body="Create one to keep your members informed." action={<Button onClick={() => setOpen(true)}>New announcement</Button>} />}>
        {(list) => (
          <ul className="space-y-3">{list.filter((a) => tab === "all" || a.status === tab).map((a) => (
            <li key={a.id}><Card className="flex flex-wrap items-start gap-4"><DemoArt hue={a.hue} ratio="1/1" label={false} className="size-16 shrink-0 !rounded-2xl" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{a.title}</h2><StatusBadge status={a.status} /></div><p className="mt-1 line-clamp-2 text-sm text-muted-fg">{a.body}</p><p className="mt-1 text-xs text-muted-fg">{a.authorName} · {a.publishedAt ? `published ${fmtDate(a.publishedAt)}` : `created ${fmtDate(a.createdAt)}`} · <Badge>{a.audience === "all" ? "Everyone" : locLabel({ districtId: a.districtId, acId: a.acId, wardId: a.wardId }, a.wardId ? 3 : a.acId ? 2 : 1)}</Badge></p></div>
              <div className="flex gap-2">{(a.status === "draft" || a.status === "scheduled") && <Button size="sm" loading={publish.isPending} onClick={() => publish.mutate(a)}>{a.status === "scheduled" ? "Publish (simulate schedule)" : "Publish"}</Button>}{a.status === "published" && <Button size="sm" variant="outline" loading={archive.isPending} onClick={() => archive.mutate(a.id)}>Archive</Button>}</div>
            </Card></li>
          ))}</ul>
        )}
      </QueryBoundary>
      <Composer open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
