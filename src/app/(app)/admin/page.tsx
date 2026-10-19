"use client";
import { ArrowRight, Calendar, Lightbulb, Megaphone, ShieldCheck, TreeStructure, UsersThree, Lock } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { AdminMetric, SectionHeading } from "@/components/data-display";
import { Badge, ScopeBadge, StatusBadge } from "@/components/ui/badge";
import { Select } from "@/components/ui/form";
import { Card, Skeleton } from "@/components/ui/misc";
import { AuditTrail, CaseRow } from "@/features/admin/components";
import { useApiQuery } from "@/lib/query";
import { admin as adminApi } from "@/lib/api";
import { useSession } from "@/stores/session";
import { ROLE_LABEL, canNominate, canPublishQuiz, scopeLabel } from "@/lib/permissions/policy";
import { findAC, findDistrict, findWard } from "@/data/seeds/locations";
import { fmtDateTime, fmtRelative } from "@/lib/utils";
import { CATEGORY_LABEL } from "@/features/events/event-card";
import { MemberRowMini } from "@/features/admin/member-mini";

export default function AdminHome() {
  const userId = useSession((s) => s.userId);
  const [range, setRange] = useState(7);
  const q = useApiQuery(["admin-home", range], () => adminApi.getAdminHome(userId!, range), !!userId);
  return (
    <QueryBoundary query={q} skeleton={<div className="space-y-6"><Skeleton className="h-10 w-80" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div><LoadingSkeleton /></div>}>
      {(h) => {
        const a = h.admin;
        const scope = scopeLabel(a.scope, { district: findDistrict(a.scope.districtId)?.name, ac: findAC(a.scope.acId)?.name, ward: findWard(a.scope.wardId)?.name });
        const m = h.metrics;
        const actions = [
          { href: "/admin/moderation", icon: ShieldCheck, label: "Review queue", ok: a.active, why: "Your appointment is pending approval." },
          { href: "/admin/members", icon: UsersThree, label: "Verify members", ok: a.active, why: "Your appointment is pending approval." },
          { href: "/admin/announcements", icon: Megaphone, label: "Write announcement", ok: a.active, why: "Your appointment is pending approval." },
          { href: "/admin/events", icon: Calendar, label: "Manage events", ok: a.active, why: "Your appointment is pending approval." },
          { href: "/admin/appointments", icon: TreeStructure, label: a.role === "district" ? "Nominate an AC Admin" : a.role === "ac" ? "Nominate a Ward Admin" : a.role === "central" ? "Appointments" : "Appointments", ok: a.role === "ward" ? true : canNominate(a, a.role === "district" ? "ac" : a.role === "ac" ? "ward" : "district").allowed || a.role === "central", why: "" },
          { href: "/admin/quiz-studio", icon: Lightbulb, label: "Quiz Studio", ok: canPublishQuiz(a.role).allowed, why: canPublishQuiz(a.role).reason ?? "" },
        ];
        return (
          <div className="space-y-10">
            <header className="flex flex-wrap items-end justify-between gap-4">
              <div><p className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Operations</p><h1 className="text-3xl font-semibold sm:text-4xl">Hello, {a.name.split(" ")[0]}</h1><p className="mt-2 flex flex-wrap items-center gap-2 text-muted-fg"><ScopeBadge>{ROLE_LABEL[a.role]}</ScopeBadge><span>Scope: <strong className="text-fg">{scope}</strong></span></p></div>
              <label className="flex items-center gap-2 text-sm text-muted-fg">Activity range<Select value={range} onChange={(e) => setRange(Number(e.target.value))} className="!h-10 w-36"><option value={1}>Last 24 hours</option><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option></Select></label>
            </header>
            {!a.active && <p role="alert" className="rounded-2xl bg-warning-soft p-4 text-warning">Your appointment is pending Central approval, so admin privileges are not active yet.</p>}

            <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <AdminMetric {...m.queue} href="/admin/moderation" />
              <AdminMetric {...m.mine} href="/admin/moderation" tone={m.mine.value > 0 ? "warning" : undefined} />
              <AdminMetric {...m.overdue} href="/admin/moderation" tone={m.overdue.value > 0 ? "danger" : undefined} />
              <AdminMetric {...m.verification} href="/admin/members" />
              <AdminMetric {...m.members} href="/admin/members" />
              <AdminMetric {...m.events} href="/admin/events" />
              <AdminMetric {...m.rsvps} href="/admin/events" />
              <AdminMetric {...m.nominations} href="/admin/appointments" />
            </section>
            <p className="-mt-6 text-xs text-muted-fg">Every number is calculated from the same data as the queue and detail pages it links to. Hover or focus the “i” for its definition. Mock data only.</p>

            <section aria-labelledby="qa"><SectionHeading title="Quick actions" />
              <ul id="qa" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {actions.map((x) => { const I = x.icon; return (
                  <li key={x.label}>{x.ok ? <Link href={x.href} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 font-medium transition-shadow hover:shadow-card"><I className="size-6 text-accent" aria-hidden />{x.label}<ArrowRight className="ml-auto size-4 text-muted-fg" aria-hidden /></Link> : (
                    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/50 p-4 text-muted-fg"><Lock className="size-6" aria-hidden /><div><p className="font-medium">{x.label}</p><p className="text-xs">{x.why}</p></div></div>
                  )}</li>
                ); })}
              </ul>
            </section>

            <div className="grid gap-10 lg:grid-cols-2">
              <section aria-labelledby="att"><SectionHeading title={m.mine.label} action={<Link href="/admin/moderation" className="text-sm font-medium text-accent">Open queue</Link>} />
                <div id="att" className="space-y-3">{h.urgent.length === 0 ? <EmptyState title="Queue is clear" body="Nothing is waiting on your review level." /> : h.urgent.map((c) => <CaseRow key={c.id} c={c} now={h.now} href={`/admin/moderation/${c.id}`} />)}</div>
              </section>
              <section aria-labelledby="ver"><SectionHeading title="Verifications to review" action={<Link href="/admin/members" className="text-sm font-medium text-accent">All members</Link>} />
                <div id="ver" className="space-y-3">{h.pendingVerifications.length === 0 ? <EmptyState title="No pending verifications" body="New applications in your scope appear here." /> : h.pendingVerifications.map((f) => <MemberRowMini key={f.id} fan={f} />)}</div>
              </section>
              <section aria-labelledby="evs"><SectionHeading title="Upcoming events" action={<Link href="/admin/events" className="text-sm font-medium text-accent">Manage</Link>} />
                <div id="evs" className="space-y-3">{h.upcomingEvents.length === 0 ? <EmptyState title="No upcoming events in scope" /> : h.upcomingEvents.map(({ event: e, stats }) => (
                  <Link key={e.id} href={`/admin/events/${e.id}`} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 hover:shadow-card"><div className="min-w-0 flex-1"><p className="truncate font-semibold">{e.title}</p><p className="text-sm text-muted-fg">{fmtDateTime(e.startsAt)} · {CATEGORY_LABEL[e.category]}</p></div><Badge tone={stats.full ? "warning" : "success"}>{stats.confirmed}/{e.capacity}{stats.waitlisted ? ` · ${stats.waitlisted} waiting` : ""}</Badge></Link>
                ))}</div>
              </section>
              <section aria-labelledby="noms"><SectionHeading title="Appointments" action={<Link href="/admin/appointments" className="text-sm font-medium text-accent">View all</Link>} />
                <div id="noms" className="space-y-3">{h.awaitingNoms.length === 0 ? <EmptyState title="No nominations awaiting a decision" /> : h.awaitingNoms.map((n) => (
                  <Link key={n.id} href="/admin/appointments" className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 hover:shadow-card"><div className="min-w-0 flex-1"><p className="font-semibold">{n.nomineeName}</p><p className="text-sm text-muted-fg">{n.targetRole.toUpperCase()} Admin · {findAC(n.scope.acId)?.name ?? findDistrict(n.scope.districtId)?.name}</p></div><StatusBadge status={n.status} /></Link>
                ))}</div>
              </section>
            </div>

            <div className="grid gap-10 lg:grid-cols-2">
              <section aria-labelledby="anns"><SectionHeading title="Recent announcements" action={<Link href="/admin/announcements" className="text-sm font-medium text-accent">Compose</Link>} />
                <ul id="anns" className="space-y-3">{h.announcements.map((x) => <li key={x.id}><Card className="p-4"><p className="font-semibold">{x.title}</p><p className="mt-0.5 line-clamp-2 text-sm text-muted-fg">{x.body}</p><p className="mt-1 text-xs text-muted-fg">{x.authorName} · {x.publishedAt ? fmtRelative(x.publishedAt, h.now) : "draft"}</p></Card></li>)}</ul>
              </section>
              <section aria-labelledby="act"><SectionHeading title="Activity" action={<Link href="/admin/activity" className="text-sm font-medium text-accent">Full log</Link>} />
                <div id="act"><AuditTrail events={h.activity} now={h.now} empty="No activity in this range." /></div>
              </section>
            </div>
          </div>
        );
      }}
    </QueryBoundary>
  );
}
