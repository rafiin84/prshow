"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowFatLinesUp, CheckCircle, Circle, Info, Lock, Timer } from "@phosphor-icons/react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/form";
import { LEVEL_LABEL, STATUS_LABEL, currentDeadline, districtDeadline, isOpen, reviewLevel, wardDeadline } from "@/lib/moderation/workflow";
import { locLabel } from "@/data/seeds/locations";
import { reasonSchema } from "@/lib/validation";
import { cn, fmtDateTime, fmtDuration, fmtRelative } from "@/lib/utils";
import type { AuditEvent, ContentModerationCase } from "@/types";

export function PolicyNote({ policy }: { policy?: { allowed: boolean; reason?: string } }) {
  if (!policy || policy.allowed) return null;
  return <p role="note" className="flex items-start gap-2 rounded-2xl bg-muted p-3 text-sm text-muted-fg"><Lock className="mt-0.5 size-4 shrink-0" aria-hidden />{policy.reason}</p>;
}

export function DeadlineChip({ c, now }: { c: ContentModerationCase; now: number }) {
  if (!isOpen(c)) return null;
  const dl = currentDeadline(c, now);
  if (dl === undefined) return <Badge tone="danger"><ArrowFatLinesUp className="size-3.5" aria-hidden />Final level</Badge>;
  const left = dl - now;
  return <Badge tone={left < 0 ? "danger" : left < 15 * 60_000 ? "warning" : "neutral"}><Timer className="size-3.5" aria-hidden />{left < 0 ? fmtDuration(left) : `${fmtDuration(left)} left`}</Badge>;
}

export function CaseRow({ c, now, href }: { c: ContentModerationCase; now: number; href: string }) {
  const level = reviewLevel(c, now);
  return (
    <Link href={href} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-shadow hover:shadow-card">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{c.title}</p>
        <p className="truncate text-sm text-muted-fg">{c.submitterName} · {locLabel(c.loc, 3)} · {c.subjectType}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={isOpen(c) && c.status === "submitted" ? "pending_review" : c.status} />
        {isOpen(c) && <Badge tone="ink">{LEVEL_LABEL[level]}</Badge>}
        <DeadlineChip c={c} now={now} />
      </div>
    </Link>
  );
}

export function EscalationTimeline({ c, now }: { c: ContentModerationCase; now: number }) {
  const open = isOpen(c);
  const level = reviewLevel(c, now);
  const steps = [
    { key: "ward", title: "Ward Admin review", note: `1-hour window · until ${fmtDateTime(wardDeadline(c))}`, state: level === "ward" && open ? "current" : "done" },
    { key: "district", title: "District Admin review", note: `2-hour window · until ${fmtDateTime(districtDeadline(c))}`, state: level === "district" && open ? "current" : level === "central" || (!open && c.escalatedToDistrictAt !== undefined) ? "done" : "upcoming" },
    { key: "central", title: "Central Admin decision", note: "Final level", state: level === "central" && open ? "current" : !open && c.escalatedToCentralAt !== undefined ? "done" : "upcoming" },
  ] as const;
  return (
    <ol aria-label="Escalation timeline" className="space-y-4">
      {steps.map((s) => (
        <li key={s.key} className="flex gap-3">
          {s.state === "done" ? <CheckCircle weight="fill" className="mt-0.5 size-5 shrink-0 text-success" aria-label="Completed" /> : s.state === "current" ? <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center" aria-label="Current"><span className="absolute size-5 animate-ping rounded-full bg-accent/40" /><span className="size-3 rounded-full bg-accent" /></span> : <Circle className="mt-0.5 size-5 shrink-0 text-muted-fg" aria-label="Upcoming" />}
          <div className={cn(s.state === "upcoming" && "text-muted-fg")}><p className="font-medium">{s.title}{s.state === "current" && <span className="ml-2 text-xs font-semibold text-accent">Now</span>}</p><p className="text-xs text-muted-fg">{s.note}</p></div>
        </li>
      ))}
      {c.decision && <li className="flex gap-3 border-t border-border pt-4"><CheckCircle weight="fill" className="mt-0.5 size-5 shrink-0 text-success" aria-hidden /><div><p className="font-medium">{STATUS_LABEL[c.decision.outcome]} by {c.decision.byName} <span className="text-muted-fg">({c.decision.byRole})</span></p><p className="text-xs text-muted-fg">{fmtDateTime(c.decision.at)} — further escalation cancelled</p></div></li>}
    </ol>
  );
}

export function AuditTrail({ events, now, empty = "No activity yet." }: { events: AuditEvent[]; now: number; empty?: string }) {
  if (events.length === 0) return <p className="text-sm text-muted-fg">{empty}</p>;
  return (
    <ol aria-label="Audit trail" className="space-y-3 border-l-2 border-border pl-4">
      {[...events].sort((a, b) => b.at - a.at).map((e) => (
        <li key={e.id} className="relative text-sm"><span aria-hidden className="absolute top-1.5 -left-[1.38rem] size-2 rounded-full bg-border" />
          <p><span className="font-medium">{e.actorName}</span> <span className="text-muted-fg">· {e.actorRole}</span></p>
          <p>{e.summary}</p>
          {e.reason && <p className="mt-0.5 rounded-lg bg-muted px-2 py-1 text-xs text-muted-fg">Reason: {e.reason}</p>}
          <p className="text-xs text-muted-fg">{fmtDateTime(e.at)} · {fmtRelative(e.at, now)}</p></li>
      ))}
    </ol>
  );
}

/** Reusable "give a reason" dialog (validated). */
export function ReasonDialog({ open, onClose, title, description, confirmLabel, tone = "primary", onSubmit, loading, label = "Reason" }: {
  open: boolean; onClose: () => void; title: string; description?: string; confirmLabel: string; tone?: "primary" | "danger"; onSubmit: (reason: string) => void; loading?: boolean; label?: string;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ reason: string }>({ resolver: zodResolver(reasonSchema), defaultValues: { reason: "" } });
  const close = () => { onClose(); reset(); };
  return (
    <Modal open={open} onClose={close} title={title} description={description} size="sm" footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button variant={tone === "danger" ? "danger" : "primary"} loading={loading} onClick={handleSubmit((v) => onSubmit(v.reason))}>{confirmLabel}</Button></>}>
      <form noValidate onSubmit={handleSubmit((v) => onSubmit(v.reason))}><Field label={label} error={errors.reason?.message} hint="This is recorded in the audit trail.">{(p) => <Textarea {...p} rows={4} {...register("reason")} />}</Field></form>
    </Modal>
  );
}

export function InfoBanner({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "gold" }) {
  return <p role="note" className={cn("flex items-start gap-2 rounded-2xl p-3 text-sm", tone === "gold" ? "bg-gold-soft text-gold" : "bg-info-soft text-info")}><Info className="mt-0.5 size-4 shrink-0" aria-hidden />{children}</p>;
}
