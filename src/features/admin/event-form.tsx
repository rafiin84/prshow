"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { useApiMutation } from "@/lib/query";
import { admin as adminApi } from "@/lib/api";
import { DISTRICTS, acsOf, wardsOf } from "@/data/seeds/locations";
import { eventSchema } from "@/lib/validation";
import { CATEGORY_LABEL } from "@/features/events/event-card";
import { useAdmin } from "./use-admin";
import type { PREvent } from "@/types";

const IST = 5.5 * 3_600_000;
const toDate = (ts: number) => new Date(ts + IST).toISOString().slice(0, 10);
const toTime = (ts: number) => new Date(ts + IST).toISOString().slice(11, 16);
const toTs = (d: string, t: string) => Date.parse(`${d}T${t}:00Z`) - IST;

type V = { title: string; category: PREvent["category"]; summary: string; purpose: string; date: string; start: string; end: string; venue: string; districtId: string; acId: string; wardId: string; capacity: number; eligibility: string; accessibility: string; requiresMembership: boolean };

export function EventFormDialog({ open, onClose, event }: { open: boolean; onClose: () => void; event?: PREvent }) {
  const { adminId, admin, now } = useAdmin();
  const def = (): V => event ? { title: event.title, category: event.category, summary: event.summary, purpose: event.purpose, date: toDate(event.startsAt), start: toTime(event.startsAt), end: toTime(event.endsAt), venue: event.venue, districtId: event.loc.districtId, acId: event.loc.acId, wardId: event.loc.wardId, capacity: event.capacity, eligibility: event.eligibility, accessibility: event.accessibility, requiresMembership: event.requiresMembership } : { title: "", category: "meetup", summary: "", purpose: "", date: toDate(now + 7 * 86_400_000), start: "17:30", end: "20:00", venue: "", districtId: admin?.scope.districtId ?? "", acId: admin?.scope.acId ?? "", wardId: admin?.scope.wardId ?? "", capacity: 50, eligibility: "Approved members aged 18+.", accessibility: "", requiresMembership: true };
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<V>({ resolver: zodResolver(eventSchema) as never, defaultValues: def() });
  useEffect(() => {
    if (open) reset(def());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, event?.id, admin?.id]);
  const d = watch("districtId"); const a = watch("acId");
  const save = useApiMutation((v: V) => adminApi.saveEvent(adminId, { id: event?.id, title: v.title, category: v.category, summary: v.summary, purpose: v.purpose, startsAt: toTs(v.date, v.start), endsAt: toTs(v.date, v.end), venue: v.venue, loc: { districtId: v.districtId, acId: v.acId, wardId: v.wardId }, capacity: v.capacity, eligibility: v.eligibility, accessibility: v.accessibility, requiresMembership: v.requiresMembership }), { success: event ? "Event updated" : "Draft created. Publish it when you're ready.", onSuccess: onClose });
  const lock = (lvl: "district" | "ac" | "ward") => (admin?.role === "ward") || (admin?.role === "ac" && lvl !== "ward") || (admin?.role === "district" && lvl === "district");
  return (
    <Modal open={open} onClose={onClose} size="lg" title={event ? "Edit event" : "Create event"} description="Events start as drafts. Nothing is visible to members until you publish."
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={handleSubmit((v) => save.mutate(v))}>{event ? "Save changes" : "Create draft"}</Button></>}>
      <form noValidate className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit((v) => save.mutate(v))}>
        <Field className="sm:col-span-2" label="Title" error={errors.title?.message}>{(p) => <Input {...p} {...register("title")} />}</Field>
        <Field label="Type">{(p) => <Select {...p} {...register("category")}>{Object.entries(CATEGORY_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>}</Field>
        <Field label="Capacity" error={errors.capacity?.message}>{(p) => <Input {...p} type="number" min={1} {...register("capacity")} />}</Field>
        <Field className="sm:col-span-2" label="One-line summary" error={errors.summary?.message}>{(p) => <Input {...p} {...register("summary")} />}</Field>
        <Field className="sm:col-span-2" label="Purpose" error={errors.purpose?.message}>{(p) => <Textarea {...p} rows={3} {...register("purpose")} />}</Field>
        <Field label="Date" error={errors.date?.message}>{(p) => <Input {...p} type="date" {...register("date")} />}</Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Starts" error={errors.start?.message}>{(p) => <Input {...p} type="time" {...register("start")} />}</Field><Field label="Ends" error={errors.end?.message}>{(p) => <Input {...p} type="time" {...register("end")} />}</Field></div>
        <Field className="sm:col-span-2" label="Venue" error={errors.venue?.message}>{(p) => <Input {...p} {...register("venue")} />}</Field>
        <Field label="District" error={errors.districtId?.message}>{(p) => <Select {...p} disabled={lock("district")} {...register("districtId")}><option value="">Choose</option>{DISTRICTS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>}</Field>
        <Field label="Constituency" error={errors.acId?.message}>{(p) => <Select {...p} disabled={lock("ac")} {...register("acId")}><option value="">Choose</option>{acsOf(d).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>}</Field>
        <Field label="Ward" error={errors.wardId?.message}>{(p) => <Select {...p} disabled={lock("ward")} {...register("wardId")}><option value="">Choose</option>{wardsOf(a).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>}</Field>
        <Field label="Eligibility" error={errors.eligibility?.message}>{(p) => <Input {...p} {...register("eligibility")} />}</Field>
        <Field className="sm:col-span-2" label="Accessibility details" error={errors.accessibility?.message}>{(p) => <Input {...p} placeholder="e.g. step-free entrance, reserved seating" {...register("accessibility")} />}</Field>
        <div className="sm:col-span-2"><Checkbox label="Approved members only" {...register("requiresMembership")} /></div>
      </form>
    </Modal>
  );
}
