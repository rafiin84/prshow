"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { PageHeader, SectionHeading } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Card } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { InfoBanner } from "@/features/admin/components";
import { useAdmin } from "@/features/admin/use-admin";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { admin as adminApi } from "@/lib/api";
import { DISTRICTS, acsOf, wardsOf } from "@/data/seeds/locations";
import { fmtDateTime } from "@/lib/utils";
import type { Announcement } from "@/types";

const schema = z.object({ title: z.string().trim().min(4, "Add a title (at least 4 characters)."), body: z.string().trim().min(10, "Write at least 10 characters."), audience: z.enum(["all", "district", "ac", "ward"]), districtId: z.string().optional(), acId: z.string().optional(), wardId: z.string().optional() });
type V = { title: string; body: string; audience: Announcement["audience"]; districtId?: string; acId?: string; wardId?: string };

export default function AdminNotifications() {
  const { adminId, admin } = useAdmin();
  const q = useApiQuery(["sent-notifs"], () => adminApi.listSentNotifications(adminId), !!adminId);
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<V>({ resolver: zodResolver(schema) as never, values: { title: "", body: "", audience: admin?.role === "central" ? "all" : admin?.role === "district" ? "district" : admin?.role === "ac" ? "ac" : "ward", districtId: admin?.scope.districtId ?? "", acId: admin?.scope.acId ?? "", wardId: admin?.scope.wardId ?? "" } });
  const v = watch();
  const send = useApiMutation((x: V) => adminApi.broadcastNotification(adminId, x), { success: (r) => `Delivered to ${r.delivered} member${r.delivered === 1 ? "" : "s"}`, onSuccess: () => reset() });
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <PageHeader title="Notifications" subtitle="Send a short notification to approved members in your scope." />
        <InfoBanner tone="gold">Demo: there&apos;s no push infrastructure. Notifications appear in each member&apos;s Notification centre.</InfoBanner>
        <form noValidate className="mt-5 space-y-4" onSubmit={handleSubmit((x) => send.mutate(x))}>
          <Field label="Title" error={errors.title?.message}>{(p) => <Input {...p} {...register("title")} />}</Field>
          <Field label="Message" error={errors.body?.message}>{(p) => <Textarea {...p} rows={3} {...register("body")} />}</Field>
          <Field label="Audience">{(p) => <Select {...p} {...register("audience")}>{admin?.role === "central" && <option value="all">Everyone</option>}{(admin?.role === "central" || admin?.role === "district") && <option value="district">District</option>}{admin?.role !== "ward" && <option value="ac">Constituency</option>}<option value="ward">Ward</option></Select>}</Field>
          {v.audience !== "all" && <Field label="District">{(p) => <Select {...p} disabled={admin?.role !== "central"} {...register("districtId")}>{DISTRICTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select>}</Field>}
          {(v.audience === "ac" || v.audience === "ward") && <Field label="Constituency">{(p) => <Select {...p} disabled={admin?.role === "ac" || admin?.role === "ward"} {...register("acId")}><option value="">Choose</option>{acsOf(v.districtId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>}</Field>}
          {v.audience === "ward" && <Field label="Ward">{(p) => <Select {...p} disabled={admin?.role === "ward"} {...register("wardId")}><option value="">Choose</option>{wardsOf(v.acId).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select>}</Field>}
          <Button type="submit" size="lg" loading={send.isPending} disabled={!admin?.active}>Send notification</Button>
        </form>
      </div>
      <div className="lg:pt-24">
        <SectionHeading title="History" />
        <QueryBoundary query={q} skeleton={<LoadingSkeleton count={3} />} isEmpty={(d) => d.length === 0} empty={<EmptyState title="Nothing sent yet" body="Published announcements and broadcasts are logged here." />}>
          {(list) => <ul className="space-y-3">{list.map((a) => <li key={a.id}><Card className="p-4"><div className="flex items-center gap-2"><Badge tone={a.action === "broadcast" ? "info" : "success"}>{a.action === "broadcast" ? "Broadcast" : "Announcement"}</Badge><span className="text-xs text-muted-fg">{fmtDateTime(a.at)}</span></div><p className="mt-2 text-sm">{a.summary}</p><p className="text-xs text-muted-fg">By {a.actorName}</p></Card></li>)}</ul>}
        </QueryBoundary>
      </div>
    </div>
  );
}
