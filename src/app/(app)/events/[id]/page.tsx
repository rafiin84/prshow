"use client";
import { Wheelchair, CalendarBlank, MapPin, UsersThree, IdentificationBadge } from "@phosphor-icons/react";
import { use } from "react";
import { QueryBoundary, LoadingSkeleton } from "@/components/feedback";
import { PageHeader, SectionHeading } from "@/components/data-display";
import { DemoArt } from "@/components/media";
import { Badge } from "@/components/ui/badge";
import { Card, Progress } from "@/components/ui/misc";
import { CATEGORY_LABEL } from "@/features/events/event-card";
import { RSVPControl } from "@/features/events/rsvp-control";
import { useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { locLabel } from "@/data/seeds/locations";
import { fmtDateTime, fmtTime } from "@/lib/utils";
import { useSession } from "@/stores/session";

export default function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const userId = useSession((s) => s.userId);
  const q = useApiQuery(["event", id], () => fan.getEvent(id, userId!), !!userId);
  return (
    <QueryBoundary query={q} skeleton={<LoadingSkeleton variant="detail" />}>
      {({ event: e, stats, myRsvp, waitlistPosition, canRsvp, ended }) => (
        <div>
          <PageHeader backHref="/events" backLabel="Events" title={e.title} subtitle={e.summary} actions={<Badge tone="ink">{CATEGORY_LABEL[e.category]}</Badge>} />
          {e.status === "cancelled" && <p role="alert" className="mb-6 rounded-2xl bg-danger-soft p-4 font-medium text-danger">This event has been cancelled.</p>}
          <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
            <div className="space-y-10">
              <DemoArt hue={e.hue} ratio="21/9" label={false} title={e.title} subtitle={locLabel(e.loc, 2)} className="min-h-48" />
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="flex gap-3"><CalendarBlank className="size-6 shrink-0 text-accent" aria-hidden /><div><dt className="text-sm text-muted-fg">When</dt><dd className="font-medium">{fmtDateTime(e.startsAt)} – {fmtTime(e.endsAt)}</dd></div></div>
                <div className="flex gap-3"><MapPin className="size-6 shrink-0 text-accent" aria-hidden /><div><dt className="text-sm text-muted-fg">Where</dt><dd className="font-medium">{e.venue}</dd><dd className="text-sm text-muted-fg">{locLabel(e.loc)}</dd></div></div>
                <div className="flex gap-3"><IdentificationBadge className="size-6 shrink-0 text-accent" aria-hidden /><div><dt className="text-sm text-muted-fg">Eligibility</dt><dd className="font-medium">{e.eligibility}</dd></div></div>
                <div className="flex gap-3"><Wheelchair className="size-6 shrink-0 text-accent" aria-hidden /><div><dt className="text-sm text-muted-fg">Accessibility</dt><dd className="font-medium">{e.accessibility}</dd></div></div>
              </dl>
              <section><SectionHeading title="Why we're meeting" /><p className="max-w-2xl text-[1.05rem] leading-relaxed">{e.purpose}</p><p className="mt-3 text-sm text-muted-fg">Organised by {e.organiser}</p></section>
              {e.schedule.length > 0 && <section><SectionHeading title="Schedule" /><ol className="space-y-3 border-l-2 border-border pl-5">{e.schedule.map((s) => <li key={s.time} className="relative"><span className="absolute top-1.5 -left-[1.62rem] size-2.5 rounded-full bg-accent" aria-hidden /><p className="text-sm font-semibold text-accent">{s.time}</p><p>{s.item}</p></li>)}</ol></section>}
            </div>
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <Card className="space-y-4">
                <div><p className="flex items-center gap-2 text-sm font-medium"><UsersThree className="size-5" aria-hidden />{stats.confirmed} of {e.capacity} seats taken</p><Progress className="mt-2" value={(stats.confirmed / e.capacity) * 100} label="Seats taken" tone={stats.full ? "gold" : "accent"} />{stats.waitlisted > 0 && <p className="mt-1.5 text-xs text-muted-fg">{stats.waitlisted} on the waitlist</p>}</div>
                {e.requiresMembership && <p className="text-sm text-muted-fg">Approved members only. Your membership must be verified by a moderator first.</p>}
                {e.status === "cancelled" ? <p className="text-sm text-danger">RSVPs are closed.</p> : <RSVPControl event={e} myRsvp={myRsvp} waitlistPosition={waitlistPosition} full={stats.full} canRsvp={canRsvp} ended={ended} />}
              </Card>
            </aside>
          </div>
        </div>
      )}
    </QueryBoundary>
  );
}
