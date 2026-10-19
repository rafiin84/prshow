"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Card } from "@/components/ui/misc";
import { useAdmin } from "./use-admin";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { admin as adminApi } from "@/lib/api";
import { DISTRICTS, acsOf, locLabel, wardsOf } from "@/data/seeds/locations";
import { fmtDateTime } from "@/lib/utils";

const schema = z.object({ title: z.string().trim().min(4, "Add a title."), purpose: z.string().trim().min(20, "Describe the purpose (at least 20 characters)."), date: z.string().min(1, "Choose a date."), venue: z.string().trim().min(4, "Add a venue."), districtId: z.string().min(1, "Choose a district."), acId: z.string().min(1, "Choose an AC."), wardId: z.string().min(1, "Choose a ward."), eligibility: z.string().trim().min(4, "Add eligibility."), capacity: z.coerce.number().int().min(1, "At least 1."), steps: z.array(z.object({ text: z.string() })) });
type V = { title: string; purpose: string; date: string; venue: string; districtId: string; acId: string; wardId: string; eligibility: string; capacity: number; steps: { text: string }[] };

function WelfareForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { adminId, admin, now } = useAdmin();
  const { register, control, handleSubmit, watch, reset, formState: { errors } } = useForm<V>({ resolver: zodResolver(schema) as never, defaultValues: { title: "", purpose: "", date: new Date(now + 14 * 86_400_000 + 5.5 * 3_600_000).toISOString().slice(0, 10), venue: "", districtId: admin?.scope.districtId ?? "", acId: admin?.scope.acId ?? "", wardId: admin?.scope.wardId ?? "", eligibility: "Approved members.", capacity: 30, steps: [{ text: "Register your participation" }, { text: "Wait for your Ward Admin's confirmation" }, { text: "Check in with the volunteer lead" }] } });
  const { fields, append, remove } = useFieldArray({ control, name: "steps" });
  const d = watch("districtId"); const a = watch("acId");
  const save = useApiMutation((v: V) => adminApi.saveWelfare(adminId, { title: v.title, purpose: v.purpose, startsAt: Date.parse(`${v.date}T09:00:00Z`) - 5.5 * 3_600_000, venue: v.venue, loc: { districtId: v.districtId, acId: v.acId, wardId: v.wardId }, eligibility: v.eligibility, capacity: v.capacity, steps: v.steps.map((s) => s.text) }), { success: "Draft created. Publish it when ready.", onSuccess: () => { reset(); onClose(); } });
  return (
    <Modal open={open} onClose={onClose} size="lg" title="Create welfare activity" description="Describe only what is planned. Don't claim outcomes in advance." footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={handleSubmit((v) => save.mutate(v))}>Create draft</Button></>}>
      <form noValidate className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit((v) => save.mutate(v))}>
        <Field className="sm:col-span-2" label="Title" error={errors.title?.message}>{(p) => <Input {...p} {...register("title")} />}</Field>
        <Field className="sm:col-span-2" label="Purpose" error={errors.purpose?.message}>{(p) => <Textarea {...p} rows={3} {...register("purpose")} />}</Field>
        <Field label="Date" error={errors.date?.message}>{(p) => <Input {...p} type="date" {...register("date")} />}</Field>
        <Field label="Capacity" error={errors.capacity?.message}>{(p) => <Input {...p} type="number" {...register("capacity")} />}</Field>
        <Field className="sm:col-span-2" label="Venue" error={errors.venue?.message}>{(p) => <Input {...p} {...register("venue")} />}</Field>
        <Field label="District" error={errors.districtId?.message}>{(p) => <Select {...p} disabled={admin?.role !== "central"} {...register("districtId")}><option value="">Choose</option>{DISTRICTS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>}</Field>
        <Field label="Constituency" error={errors.acId?.message}>{(p) => <Select {...p} disabled={admin?.role === "ac" || admin?.role === "ward"} {...register("acId")}><option value="">Choose</option>{acsOf(d).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>}</Field>
        <Field label="Ward" error={errors.wardId?.message}>{(p) => <Select {...p} disabled={admin?.role === "ward"} {...register("wardId")}><option value="">Choose</option>{wardsOf(a).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>}</Field>
        <Field label="Eligibility" error={errors.eligibility?.message}>{(p) => <Input {...p} {...register("eligibility")} />}</Field>
        <fieldset className="space-y-2 sm:col-span-2"><legend className="mb-1 text-sm font-medium">Participation steps</legend>
          {fields.map((f, i) => <div key={f.id} className="flex gap-2"><Input aria-label={`Step ${i + 1}`} {...register(`steps.${i}.text` as const)} /><Button type="button" variant="ghost" size="sm" onClick={() => remove(i)} aria-label={`Remove step ${i + 1}`}>Remove</Button></div>)}
          <Button type="button" variant="outline" size="sm" onClick={() => append({ text: "" })}><Plus className="size-4" aria-hidden />Add step</Button></fieldset>
      </form>
    </Modal>
  );
}

export function WelfareAdmin() {
  const { adminId, admin } = useAdmin();
  const [open, setOpen] = useState(false);
  const q = useApiQuery(["admin-welfare"], () => adminApi.adminListWelfare(adminId), !!adminId);
  const status = useApiMutation((v: { id: string; s: "draft" | "published" | "completed" }) => adminApi.setWelfareStatus(adminId, v.id, v.s), { success: "Updated" });
  const decide = useApiMutation((v: { id: string; s: "approved" | "declined" | "attended" }) => adminApi.decideParticipation(adminId, v.id, v.s), { success: "Participation updated" });
  return (
    <div>
      <div className="mb-4 flex justify-end"><Button onClick={() => setOpen(true)} disabled={!admin?.active}><Plus className="size-4" aria-hidden />New welfare activity</Button></div>
      <QueryBoundary query={q} skeleton={<LoadingSkeleton count={2} />} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No welfare activities in your scope" body="Create one to start accepting participation." />}>
        {(list) => (
          <ul className="space-y-4">{list.map(({ activity: w, rows }) => (
            <li key={w.id}><Card className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">{w.title}</h2><p className="text-sm text-muted-fg">{fmtDateTime(w.startsAt)} · {locLabel(w.loc, 3)} · capacity {w.capacity}</p></div><div className="flex items-center gap-2"><StatusBadge status={w.status} />{w.status === "draft" && <Button size="sm" loading={status.isPending} onClick={() => status.mutate({ id: w.id, s: "published" })}>Publish</Button>}{w.status === "published" && <Button size="sm" variant="outline" onClick={() => status.mutate({ id: w.id, s: "completed" })}>Mark completed</Button>}</div></div>
              <div><h3 className="mb-2 text-sm font-semibold">Participants ({rows.length})</h3>
                {rows.length === 0 ? <p className="text-sm text-muted-fg">No registrations yet.</p> : (
                  <ul className="divide-y divide-border rounded-2xl border border-border">{rows.map(({ part, fan }) => (
                    <li key={part.id} className="flex flex-wrap items-center gap-3 px-4 py-3"><span className="min-w-0 flex-1"><span className="font-medium">{fan.name}</span><span className="block text-xs text-muted-fg">{locLabel(fan.loc, 3)}</span></span><StatusBadge status={part.status} />
                      <div className="flex gap-1.5">{part.status === "registered" && <><Button size="sm" onClick={() => decide.mutate({ id: part.id, s: "approved" })}>Approve</Button><Button size="sm" variant="outline" onClick={() => decide.mutate({ id: part.id, s: "declined" })}>Decline</Button></>}{part.status === "approved" && <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: part.id, s: "attended" })}>Mark attended</Button>}</div></li>
                  ))}</ul>
                )}</div>
            </Card></li>
          ))}</ul>
        )}
      </QueryBoundary>
      <WelfareForm open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
